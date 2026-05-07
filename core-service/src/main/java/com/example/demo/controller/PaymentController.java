package com.example.demo.controller;

import com.example.demo.dto.PaymentCreateRequest;
import com.example.demo.dto.PaymentCreateResponse;
import com.example.demo.dto.PaymentHistoryItemDto;
import com.example.demo.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create")
    public ResponseEntity<PaymentCreateResponse> createPayment(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody PaymentCreateRequest request,
            HttpServletRequest httpServletRequest
    ) {
        String clientIp = getClientIp(httpServletRequest);
        PaymentCreateResponse response = paymentService.createPayment(authorization, request, clientIp);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<List<PaymentHistoryItemDto>> getPaymentHistory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(paymentService.getPaymentHistory(email));
    }

    @GetMapping("/return")
    public void handleReturn(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Map<String, String> params = extractParams(request);
        boolean success = paymentService.handleReturn(params);
        String redirectUrl = buildFrontendRedirect(success, params);
        response.sendRedirect(redirectUrl);
    }

    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> handleIpn(HttpServletRequest request) {
        Map<String, String> params = extractParams(request);
        Map<String, String> result = paymentService.handleIpn(params);
        return ResponseEntity.ok(result);
    }

    private Map<String, String> extractParams(HttpServletRequest request) {
        Map<String, String> params = new HashMap<>();
        request.getParameterMap().forEach((key, values) -> {
            if (values != null && values.length > 0) {
                params.put(key, values[0]);
            }
        });
        return params;
    }

    private String buildFrontendRedirect(boolean success, Map<String, String> params) {
        String txnRef = params.getOrDefault("vnp_TxnRef", "");
        String responseCode = params.getOrDefault("vnp_ResponseCode", "");
        String payerEmail = paymentService.getPayerEmailByTxnRef(txnRef);
        String baseUrl = paymentService.getFrontendReturnUrl();
        String encodedEmail = URLEncoder.encode(payerEmail == null ? "" : payerEmail, StandardCharsets.UTF_8);
        return baseUrl + "?success=" + success + "&txnRef=" + txnRef + "&code=" + responseCode + "&email=" + encodedEmail;
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

