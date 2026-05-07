package com.example.demo.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PlanDto {
    private Long id;
    private String code;
    private String name;
    private BigDecimal priceMonthly;
    private BigDecimal priceYearly;
    private String featuresJson;
    private boolean isActive;
}