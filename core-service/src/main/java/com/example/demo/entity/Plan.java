package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Data
@Table(name = "plans")
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "price_monthly", nullable = false, precision = 18, scale = 2)
    private BigDecimal priceMonthly;

    @Column(name = "price_yearly", nullable = false, precision = 18, scale = 2)
    private BigDecimal priceYearly;

    @Column(name = "features_json", nullable = false, columnDefinition = "TEXT")
    private String featuresJson;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}