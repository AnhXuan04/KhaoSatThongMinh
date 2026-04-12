package com.example.demo.service;

import com.example.demo.dto.UserProfileDto;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    public String changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (currentPassword == null || currentPassword.isBlank()) {
            throw new RuntimeException("Vui lòng nhập mật khẩu hiện tại!");
        }

        if (newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("Vui lòng nhập mật khẩu mới!");
        }

        if (newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự!");
        }

        if (currentPassword.equals(newPassword)) {
            throw new RuntimeException("Mật khẩu mới phải khác mật khẩu hiện tại!");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng!");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return "Đổi mật khẩu thành công!";
    }
}