package com.example.demo.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class AiSurveyReportResponseDto {
    private String executiveSummary;
    private String respondentSummary;
    private String answerSummary;
    private String recommendation;
    private List<String> highlights = new ArrayList<>();
    private String plainText;
    private String modelName;
}