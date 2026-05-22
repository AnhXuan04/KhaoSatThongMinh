package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.util.List;

@Entity
@Data
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String type;
    
    private String kind;

    private Boolean required;

    private Integer maxFileSizeMb;

    private Integer maxFileCount;

    @Column(columnDefinition = "TEXT")
    private String mediaUrl;

    private Integer questionOrder;

    @ManyToOne
    @JoinColumn(name = "survey_id")
    private Survey survey;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Option> options;
}
