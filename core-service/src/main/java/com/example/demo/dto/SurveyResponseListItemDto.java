package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SurveyResponseListItemDto {
    private Long responseId;
    private Long surveyId;
    private String userName;
    private String userEmail;
    private String avatar;
    private Integer rating;
    private String comment;
    private String submittedAt;
}
