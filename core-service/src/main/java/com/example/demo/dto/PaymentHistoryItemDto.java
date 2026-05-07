package com.example.demo.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PaymentHistoryItemDto {
    private String txnRef;
    private String planName;
    private String billingCycle;
    private BigDecimal amount;
    private String status;
    private LocalDateTime paymentDate;
}