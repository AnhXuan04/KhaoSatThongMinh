package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Data
@Table(name = "user_profiles")
public class UserProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "job", length = 120)
    private String job;

    @Column(name = "phone", length = 30)
    private String phone;

    @Column(name = "interests", columnDefinition = "TEXT")
    private String interests;
}


