package com.example.demo.dto;

import lombok.Data;

@Data
public class UserBehaviorLogDto {
    private Long questionId;
    private String eventType;
    private String eventValue;
    private Long durationMs;
}
