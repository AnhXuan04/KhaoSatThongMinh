package com.example.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuestionRequest {
    private String title;
    private String type;
    private Boolean required;
    private List<OptionRequest> options;
}
