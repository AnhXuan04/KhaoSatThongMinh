package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(
        name = "survey_responses",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_survey_responses_survey_user", columnNames = {"survey_id", "user_id"})
        }
)
public class SurveyResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @OneToMany(mappedBy = "response", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SurveyAnswer> answers;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
