package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class SurveyQualityAnalyticsDto {
    private long totalResponses;
    private long totalAnalyzedResponses;
    private long seriousResponses;
    private long superficialResponses;
    private long qualityResponses;
    private long rewardEligibleResponses;
    private int rewardEligibleRate;
    private long pendingCoinTransactions;
    private int averageQualityScore;
    private List<ResponseQualityItemDto> recentResults;

    @Data
    @AllArgsConstructor
    public static class ResponseQualityItemDto {
        private Long responseId;
        private Long surveyId;
        private String surveyTitle;
        private String respondentEmail;
        private Integer qualityScore;
        private Boolean superficial;
        private Boolean rewardEligible;
        private String recommendation;
        private String coinStatus;
        private String submittedAt;
    }
}
