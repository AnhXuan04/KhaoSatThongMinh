package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class QuestionStatisticsDto {
    private Long questionId;
    private String title;
    private String type;
    private String kind;
    private int totalResponses;
    private List<OptionStatisticDto> options;
}
