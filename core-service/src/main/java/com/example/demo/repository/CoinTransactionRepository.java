package com.example.demo.repository;

import com.example.demo.entity.CoinTransaction;
import com.example.demo.entity.CoinTransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CoinTransactionRepository extends JpaRepository<CoinTransaction, Long> {
    long countByStatus(CoinTransactionStatus status);

    Optional<CoinTransaction> findByResponseId(Long responseId);

    List<CoinTransaction> findByStatusOrderByCreatedAtDesc(CoinTransactionStatus status);

    @Query("""
            SELECT c FROM CoinTransaction c
            JOIN FETCH c.response r
            JOIN FETCH r.survey s
            LEFT JOIN FETCH r.user
            WHERE s.user.id = :interviewerId
            ORDER BY c.createdAt DESC
            """)
    List<CoinTransaction> findByInterviewerId(@Param("interviewerId") Long interviewerId);
}
