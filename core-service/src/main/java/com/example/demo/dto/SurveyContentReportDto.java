package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SurveyContentReportDto {
    private Long surveyId;
    private String surveyTitle;
    private int totalResponses;
    private String generatedAt;
    private String executiveSummary;
    private String respondentSummary;
    private String answerSummary;
    private String recommendation;
    private List<String> highlights;
    private List<QuestionReportDto> questionReports;
    private String plainText;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionReportDto {
        private Long questionId;
        private String title;
        private String type;
        private String kind;
        private int totalAnswers;
        private String summary;
        private String recommendation;
        private List<OptionInsightDto> options;
        private Double averageValue;
        private List<String> notableAnswers;
        private List<String> keywords;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionInsightDto {
        private String label;
        private int count;
        private int percentage;
    }
}
