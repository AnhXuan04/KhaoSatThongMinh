package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "payment_transactions")
public class PaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "payer_email", length = 255)
    private String payerEmail;

    @Column(name = "is_claimed")
    private Boolean claimed = false;

    @Column(name = "plan_code", nullable = false, length = 50)
    private String planCode;

    @Column(name = "billing_cycle", length = 20)
    private String billingCycle;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "vnp_txn_ref", nullable = false, unique = true, length = 40)
    private String vnpTxnRef;

    @Column(name = "vnp_transaction_no", length = 30)
    private String vnpTransactionNo;

    @Column(name = "vnp_response_code", length = 10)
    private String vnpResponseCode;

    @Column(name = "vnp_pay_date", length = 20)
    private String vnpPayDate;

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
}
