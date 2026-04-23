package com.example.demo.dto;

import lombok.Data;

import java.util.List;

@Data
public class UserListItemDto {
    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String job;
    private String phone;
    private List<String> interests;
}

