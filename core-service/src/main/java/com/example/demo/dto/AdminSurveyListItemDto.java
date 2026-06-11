package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AdminSurveyListItemDto {
    private Long id;
    private String title;
    private String creatorName;
    private String creatorEmail;
    private long responseCount;
    private String createdAt;
    private String status;
    private boolean hidden;
    private boolean locked;
}
