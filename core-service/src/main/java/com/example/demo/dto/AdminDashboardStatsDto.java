package com.example.demo.dto;

import lombok.Data;

@Data
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long totalSurveys;
    private long superficialSurveys;
    private long nonSuperficialSurveys;
    private long rewardEligibleResponses;
}
