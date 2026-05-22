package com.example.demo.dto;

import lombok.Data;

@Data
public class PaymentCreateRequest {
    private Long planId;
    private String billingCycle;
    private String payerEmail;
}

