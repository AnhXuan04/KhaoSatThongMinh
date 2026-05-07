package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "subscriptions")
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "plan_code", nullable = false, length = 50)
    private String planCode;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionStatus status = SubscriptionStatus.INACTIVE;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE
                && expiresAt != null
                && expiresAt.isAfter(LocalDateTime.now())
                && canceledAt == null;
    }
}


