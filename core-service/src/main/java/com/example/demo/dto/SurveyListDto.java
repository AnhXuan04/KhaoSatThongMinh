package com.example.demo.dto;

import com.example.demo.entity.Survey;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@AllArgsConstructor
public class SurveyListDto {
    private Long id;
    private String title;
    private String description;
    private Integer questionCount;
    private String createdAt;
    private String surveyField;

    public static SurveyListDto fromSurvey(Survey survey) {
        String formattedDate = survey.getCreatedAt()
                .format(DateTimeFormatter.ofPattern("dd MMM, yyyy", new java.util.Locale("vi", "VN")));

        String field = (survey.getSurveyField() != null) ? survey.getSurveyField().getName() : "Khác";

        return new SurveyListDto(
                survey.getId(),
                survey.getTitle(),
                survey.getDescription(),
                survey.getQuestions() != null ? survey.getQuestions().size() : 0,
                formattedDate,
                field
        );
    }
}
