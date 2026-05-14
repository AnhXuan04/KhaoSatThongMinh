package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;

@Data
@AllArgsConstructor
public class SurveyResponseDetailDto {
    private Long responseId;
    private Long surveyId;
    private String surveyTitle;
    private String completedAt;
    private List<AnswerDetailDto> answers;

    @Data
    @AllArgsConstructor
    public static class AnswerDetailDto {
        private Long questionId;
        private String questionTitle;
        private String questionType;
        private String questionKind;
        private List<String> values;
        private String cloudinaryPublicId;
        private String secureUrl;
        private String originalFileName;
        private Long fileSize;
        private String fileType;
    }
}
