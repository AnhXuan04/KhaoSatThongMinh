package com.example.demo.dto;

import lombok.Data;

@Data
public class PaymentCreateResponse {
    private String paymentUrl;
    private String txnRef;
}

