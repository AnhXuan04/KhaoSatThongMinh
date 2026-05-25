package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class AiAnalyzeRequestDto {
    private Long responseId;
    private Long surveyId;
    private List<AiAnswerDto> answers;
    private List<AiBehaviorLogDto> behaviorLogs;

    @Data
    @AllArgsConstructor
    public static class AiAnswerDto {
        private Long questionId;
        private String questionType;
        private String questionKind;
        private String answerText;
    }

    @Data
    @AllArgsConstructor
    public static class AiBehaviorLogDto {
        private Long questionId;
        private String eventType;
        private String eventValue;
        private Long durationMs;
    }
}
