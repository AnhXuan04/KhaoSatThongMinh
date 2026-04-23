package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "otp_code")
    private String otpCode;

    @Column(name = "otp_expiry_time")
    private java.time.LocalDateTime otpExpiryTime;

    @Column(name = "job")
    private String job;

    @Column(name = "phone")
    private String phone;

    @Column(name = "interests")
    private String interests;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "is_premium", nullable = false)
    private boolean isPremium = false;

    @Column(name = "is_locked", nullable = false)
    private boolean isLocked = false;
}