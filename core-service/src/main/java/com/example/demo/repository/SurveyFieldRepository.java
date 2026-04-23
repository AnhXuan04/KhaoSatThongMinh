package com.example.demo.repository;

import com.example.demo.entity.SurveyField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SurveyFieldRepository extends JpaRepository<SurveyField, Long> {

    List<SurveyField> findByIsDeletedFalse();
}
