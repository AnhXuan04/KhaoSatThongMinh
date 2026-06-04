package com.example.demo.service;

import com.example.demo.dto.AiAnalyzeRequestDto;
import com.example.demo.dto.AiAnalyzeResponseDto;
import com.example.demo.dto.AiSurveyReportRequestDto;
import com.example.demo.dto.AiSurveyReportResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Optional;

@Service
public class AiAnalysisClient {

    private static final Logger log = LoggerFactory.getLogger(AiAnalysisClient.class);

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.analyze-url:http://localhost:5000/api/analyze-response}")
    private String analyzeUrl;

    @Value("${ai.service.report-url:http://localhost:5000/api/generate-survey-content-report}")
    private String reportUrl;

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

    public Optional<AiSurveyReportResponseDto> generateSurveyReport(AiSurveyReportRequestDto request) {
        try {
            AiSurveyReportResponseDto response = restTemplate.postForObject(
                    reportUrl,
                    request,
                    AiSurveyReportResponseDto.class
            );
            return Optional.ofNullable(response);
        } catch (HttpStatusCodeException ex) {
            log.warn("AI survey report request failed. reportUrl={}, surveyId={}, status={}, responseBody={}",
                    reportUrl,
                    request.getSurvey() != null ? request.getSurvey().getId() : null,
                    ex.getStatusCode(),
                    ex.getResponseBodyAsString());
            return Optional.empty();
        } catch (RestClientException ex) {
            log.warn("AI survey report request failed. reportUrl={}, surveyId={}, error={}",
                    reportUrl,
                    request.getSurvey() != null ? request.getSurvey().getId() : null,
                    ex.getMessage());
            return Optional.empty();
        }
    }
}
