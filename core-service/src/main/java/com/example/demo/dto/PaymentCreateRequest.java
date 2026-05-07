package com.example.demo.dto;

import lombok.Data;

@Data
public class PaymentCreateRequest {
    private String planCode;
    private String billingCycle;
    private String payerEmail;
}

