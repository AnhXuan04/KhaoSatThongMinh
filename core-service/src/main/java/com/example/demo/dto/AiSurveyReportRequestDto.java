package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiSurveyReportRequestDto {
    private SurveyInfoDto survey;
    private int totalResponses;
    private int eligibleResponses;
    private int excludedResponses;
    private List<SurveyContentReportDto.QuestionReportDto> questionReports;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SurveyInfoDto {
        private Long id;
        private String title;
        private String description;
        private String field;
    }
}
