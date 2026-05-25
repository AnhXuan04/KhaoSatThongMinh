package com.example.demo.service;

import com.example.demo.dto.AiAnalyzeRequestDto;
import com.example.demo.dto.AiAnalyzeResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
public class AiAnalysisClient {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.analyze-url:http://localhost:5000/api/analyze-response}")
    private String analyzeUrl;

    public Optional<AiAnalyzeResponseDto> analyze(AiAnalyzeRequestDto request) {
        try {
            AiAnalyzeResponseDto response = restTemplate.postForObject(
                    analyzeUrl,
                    request,
                    AiAnalyzeResponseDto.class
            );
            return Optional.ofNullable(response);
        } catch (RestClientException ex) {
            log.warn("AI analysis request failed. analyzeUrl={}, responseId={}, error={}",
                    analyzeUrl,
                    request.getResponseId(),
                    ex.getMessage());
            return Optional.empty();
        }
    }
}
