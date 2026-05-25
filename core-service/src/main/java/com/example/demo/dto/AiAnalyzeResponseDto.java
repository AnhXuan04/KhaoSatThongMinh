package com.example.demo.dto;

import lombok.Data;

@Data
public class AiAnalyzeResponseDto {
    private Integer qualityScore;
    private Boolean superficial;
    private Boolean isSuperficial;
    private Boolean rewardEligible;
    private String analysisSummary;
    private String recommendation;
    private String modelName;

    public boolean resolvedSuperficial() {
        if (isSuperficial != null) {
            return isSuperficial;
        }
        return Boolean.TRUE.equals(superficial);
    }
}
