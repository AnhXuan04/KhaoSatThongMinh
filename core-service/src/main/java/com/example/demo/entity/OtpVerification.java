package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "otp_verifications", indexes = {
        @Index(name = "idx_otp_verification_user_purpose", columnList = "user_id,purpose"),
        @Index(name = "idx_otp_verification_code", columnList = "otp_code")
})
public class OtpVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "otp_code", nullable = false, length = 10)
    private String otpCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OtpPurpose purpose = OtpPurpose.PASSWORD_RESET;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount = 0;

    @Column(name = "is_used", nullable = false)
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }
}


