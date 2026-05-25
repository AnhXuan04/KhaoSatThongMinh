package com.example.demo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SubscriptionDto {
    private boolean premium;
    private String status;
    private Long planId;
    private String planName;
    private String featuresJson;
    private String billingCycle;
    private LocalDateTime startedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime canceledAt;
}

