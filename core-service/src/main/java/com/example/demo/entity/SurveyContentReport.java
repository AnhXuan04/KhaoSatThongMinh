package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "survey_content_reports")
@Data
public class SurveyContentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_user_id", nullable = false)
    private User generatedByUser;

    private Integer totalResponses;

    private Integer eligibleResponses;

    private Integer excludedResponses;

    @Column(columnDefinition = "TEXT")
    private String executiveSummary;

    @Column(columnDefinition = "TEXT")
    private String respondentSummary;

    @Column(columnDefinition = "TEXT")
    private String answerSummary;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String highlightsJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private String questionReportsJson;

    @Column(columnDefinition = "TEXT")
    private String plainText;

    private LocalDateTime generatedAt;

    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        generatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        generatedAt = LocalDateTime.now();
    }
}
