package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminQualityReviewDto {
    private Long coinTransactionId;
    private Long responseId;
    private String surveyTitle;
    private String respondentEmail;
    private Integer qualityScore;
    private Boolean superficial;
    private Boolean rewardEligible;
    private String analysisSummary;
    private Integer coinAmount;
    private String coinStatus;
    private String reason;
    private String submittedAt;
}
