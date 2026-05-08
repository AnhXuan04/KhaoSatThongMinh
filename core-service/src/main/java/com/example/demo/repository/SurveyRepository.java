package com.example.demo.repository;

import com.example.demo.entity.Survey;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SurveyRepository extends JpaRepository<Survey, Long> {
    List<Survey> findByUserAndIsDeletedFalseOrderByCreatedAtDesc(User user);
}
