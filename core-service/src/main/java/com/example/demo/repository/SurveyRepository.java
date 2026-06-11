package com.example.demo.repository;

import com.example.demo.entity.Survey;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Long> {
    List<Survey> findByUserAndIsDeletedFalseOrderByCreatedAtDesc(User user);
    List<Survey> findByIsDeletedFalseOrderByCreatedAtDesc();

    @Query("""
            SELECT s FROM Survey s
            WHERE (s.isDeleted IS NULL OR s.isDeleted = false)
              AND (s.isHidden IS NULL OR s.isHidden = false)
              AND (s.isLocked IS NULL OR s.isLocked = false)
            ORDER BY s.createdAt DESC
            """)
    List<Survey> findVisibleForIntervieweeOrderByCreatedAtDesc();

    long countByIsDeletedFalse();
}
