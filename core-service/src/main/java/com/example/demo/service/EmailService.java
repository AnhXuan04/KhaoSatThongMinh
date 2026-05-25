package com.example.demo.service;

import com.example.demo.entity.OtpPurpose;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String brevoApiKey;
    private final String brevoApiUrl;
    private final String fromEmail;
    private final String fromName;

    public EmailService(
            ObjectMapper objectMapper,
            @Value("${brevo.api-key}") String brevoApiKey,
            @Value("${brevo.api-url:https://api.brevo.com/v3/smtp/email}") String brevoApiUrl,
            @Value("${brevo.from-email}") String fromEmail,
            @Value("${brevo.from-name:Khao Sat Thong Minh}") String fromName) {
        this.objectMapper = objectMapper;
        this.brevoApiKey = brevoApiKey;
        this.brevoApiUrl = brevoApiUrl;
        this.fromEmail = fromEmail;
        this.fromName = fromName;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public void sendOtpEmail(String toEmail, String otp, OtpPurpose purpose, String fullName) {
        String subject;
        String content;

        if (purpose == OtpPurpose.REGISTER) {
            subject = "Xac minh tai khoan";
            content = "Xin chao " + (fullName != null ? fullName : "") + ",\n\n"
                    + "Ma OTP de xac minh tai khoan cua ban la: " + otp + "\n\n"
                    + "Ma nay se het han trong 5 phut.\n\n"
                    + "Tran trong.";
        } else {
            subject = "Dat lai mat khau";
            content = "Xin chao,\n\n"
                    + "Ma OTP de dat lai mat khau cua ban la: " + otp + "\n\n"
                    + "Ma nay se het han trong 5 phut.\n\n"
                    + "Tran trong.";
        }

        sendEmail(toEmail, subject, content);
    }

    private void sendEmail(String toEmail, String subject, String content) {
        try {
            Map<String, Object> payload = Map.of(
                    "sender", Map.of(
                            "name", fromName,
                            "email", fromEmail
                    ),
                    "to", List.of(Map.of("email", toEmail)),
                    "subject", subject,
                    "textContent", content
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(brevoApiUrl))
                    .timeout(Duration.ofSeconds(15))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Brevo email failed with status "
                        + response.statusCode() + ": " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Email request was interrupted", e);
        } catch (Exception e) {
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }
}
