package com.example.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class SurveyRequest {
    private String title;
    private String description;
    private List<QuestionRequest> questions;
}
