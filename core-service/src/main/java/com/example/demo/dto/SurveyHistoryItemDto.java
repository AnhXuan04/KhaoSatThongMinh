package com.example.demo.dto;

import com.example.demo.entity.SurveyResponse;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.format.DateTimeFormatter;

@Data
@AllArgsConstructor
public class SurveyHistoryItemDto {
    private Long responseId;
    private Long surveyId;
    private String title;
    private String description;
    private String surveyField;
    private String completedAt;

    public static SurveyHistoryItemDto fromResponse(SurveyResponse response) {
        String field = (response.getSurvey().getSurveyField() != null)
                ? response.getSurvey().getSurveyField().getName()
                : "Khác";

        String date = response.getSubmittedAt() != null
                ? response.getSubmittedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "";

        return new SurveyHistoryItemDto(
                response.getId(),
                response.getSurvey().getId(),
                response.getSurvey().getTitle(),
                response.getSurvey().getDescription(),
                field,
                date
        );
    }
}
