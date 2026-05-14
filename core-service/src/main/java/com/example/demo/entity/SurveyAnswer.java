package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Data
@Table(name = "survey_answers")
public class SurveyAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "response_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private SurveyResponse response;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    // nullable — chỉ set khi câu hỏi là multiple_choice hoặc checkbox
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "option_id")
    private Option option;

    // Lưu text câu trả lời: short_text thì là nội dung nhập, trắc nghiệm thì copy text option
    @Column(name = "answer_text", columnDefinition = "TEXT")
    private String answerText;

    // File upload metadata (for file_upload question type)
    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    @Column(name = "secure_url", columnDefinition = "TEXT")
    private String secureUrl;

    @Column(name = "original_file_name")
    private String originalFileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_type")
    private String fileType;
}
