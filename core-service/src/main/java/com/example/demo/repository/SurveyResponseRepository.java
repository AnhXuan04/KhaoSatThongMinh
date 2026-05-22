package com.example.demo.repository;

import com.example.demo.entity.SurveyResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SurveyResponseRepository extends JpaRepository<SurveyResponse, Long> {

    @Query("SELECT r FROM SurveyResponse r LEFT JOIN FETCH r.user LEFT JOIN FETCH r.answers a LEFT JOIN FETCH a.question WHERE r.id = :id")
    Optional<SurveyResponse> findByIdWithDetails(@Param("id") Long id);

    List<SurveyResponse> findBySurveyId(Long surveyId);
    List<SurveyResponse> findByUserId(Long userId);
    boolean existsBySurveyIdAndUserId(Long surveyId, Long userId);

    @Query("SELECT COUNT(r) FROM SurveyResponse r WHERE r.survey.user.id = :interviewerId")
    long countByInterviewerId(@Param("interviewerId") Long interviewerId);

    @Query("SELECT r.survey.id FROM SurveyResponse r WHERE r.user.id = :userId")
    List<Long> findCompletedSurveyIdsByUserId(@Param("userId") Long userId);
}
