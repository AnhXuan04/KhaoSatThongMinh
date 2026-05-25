package com.example.demo.repository;

import com.example.demo.entity.AiAnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiAnalysisResultRepository extends JpaRepository<AiAnalysisResult, Long> {
    Optional<AiAnalysisResult> findByResponseId(Long responseId);

    long countBySuperficialTrue();

    long countBySuperficialFalse();

    long countByRewardEligibleTrue();

    @Query("""
            SELECT a FROM AiAnalysisResult a
            JOIN FETCH a.response r
            JOIN FETCH r.survey s
            LEFT JOIN FETCH r.user u
            WHERE s.user.id = :interviewerId
            ORDER BY a.analyzedAt DESC
            """)
    List<AiAnalysisResult> findRecentByInterviewerId(@Param("interviewerId") Long interviewerId);

    @Query("""
            SELECT a FROM AiAnalysisResult a
            JOIN FETCH a.response r
            JOIN FETCH r.survey s
            JOIN FETCH r.user u
            WHERE NOT EXISTS (
                SELECT c.id FROM CoinTransaction c
                WHERE c.response = r
            )
            ORDER BY a.analyzedAt DESC
            """)
    List<AiAnalysisResult> findAnalyzedResponsesWithoutCoinTransaction();
}
