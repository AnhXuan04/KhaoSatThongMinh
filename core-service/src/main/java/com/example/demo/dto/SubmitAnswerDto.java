package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class SubmitAnswerDto {
    private Long questionId;
    // Dùng list để handle cả single (multiple_choice) lẫn multi (checkbox)
    private List<String> values;
    
    // File upload metadata (for file_upload question type)
    private String cloudinaryPublicId;
    private String secureUrl;
    private String originalFileName;
    private Long fileSize;
    private String fileType;
}
