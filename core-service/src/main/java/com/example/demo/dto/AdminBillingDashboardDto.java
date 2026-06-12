package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
public class AdminBillingDashboardDto {
    private BigDecimal totalRevenue;
    private long totalTransactions;
    private long successfulTransactions;
    private long failedTransactions;
    private long pendingTransactions;
    private List<PlanItemDto> plans;
    private List<TransactionItemDto> transactions;

    @Data
    @AllArgsConstructor
    public static class PlanItemDto {
        private Long id;
        private String code;
        private String name;
        private BigDecimal priceMonthly;
        private BigDecimal priceYearly;
        private boolean active;
    }

    @Data
    @AllArgsConstructor
    public static class TransactionItemDto {
        private Long id;
        private String payerEmail;
        private String planName;
        private String billingCycle;
        private BigDecimal amount;
        private String status;
        private String createdAt;
    }
}
