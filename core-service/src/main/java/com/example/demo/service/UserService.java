package com.example.demo.service;

import com.example.demo.dto.UserProfileDto;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // 1. Hàm Lấy thông tin user (Trả về React)
    public UserProfileDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        UserProfileDto dto = new UserProfileDto();
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setJob(user.getJob());

        // --- Thêm 2 dòng này ---
        dto.setPhone(user.getPhone());
        dto.setInterests(user.getInterests());

        return dto;
    }

    // 2. Hàm Cập nhật thông tin user (Từ React gửi xuống)
    public String updateUserProfile(String email, UserProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        user.setFullName(dto.getFullName());
        user.setJob(dto.getJob());

        // --- Thêm 2 dòng này ---
        user.setPhone(dto.getPhone());
        user.setInterests(dto.getInterests());

        userRepository.save(user);
        return "Cập nhật hồ sơ thành công!";
    }
}