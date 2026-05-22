package com.example.demo.dto;

import lombok.Data;

@Data
public class UserProfileDto {
    private String fullName;
    private String email;
    private String job;
    private String phone;
    private String interests;
    private String avatarUrl;
    private Integer coinBalance;
}
