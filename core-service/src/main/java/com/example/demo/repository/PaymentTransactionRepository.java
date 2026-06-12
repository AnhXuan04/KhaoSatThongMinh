package com.example.demo.repository;

import com.example.demo.entity.PaymentTransaction;
import com.example.demo.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {
    Optional<PaymentTransaction> findByVnpTxnRef(String vnpTxnRef);
    List<PaymentTransaction> findByPayerEmailIgnoreCaseOrderByCreatedAtDesc(String payerEmail);
    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();
    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM PaymentTransaction t WHERE t.status = 'SUCCESS'")
    BigDecimal sumSuccessfulRevenue();
}
