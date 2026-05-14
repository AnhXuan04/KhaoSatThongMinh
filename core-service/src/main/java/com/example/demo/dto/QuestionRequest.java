package com.example.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuestionRequest {
    private Long id;
    private String title;
    private String type;
    private String kind;
    private Boolean required;
    private Integer maxFileSizeMb;
    private Integer maxFileCount;
    private List<OptionRequest> options;
}
