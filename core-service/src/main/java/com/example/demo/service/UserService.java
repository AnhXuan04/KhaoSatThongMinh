package com.example.demo.service;

import com.example.demo.dto.UserProfileDto;
import com.example.demo.entity.User;
import com.example.demo.entity.UserProfile;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CloudinaryService cloudinaryService;

    // 1. Hàm Lấy thông tin user (Trả về React)
    public UserProfileDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        UserProfileDto dto = new UserProfileDto();
        dto.setEmail(user.getEmail());

        if (user.getProfile() != null) {
            dto.setFullName(user.getProfile().getFullName());
            dto.setJob(user.getProfile().getJob());
            dto.setPhone(user.getProfile().getPhone());
            dto.setInterests(user.getProfile().getInterests());
            dto.setAvatarUrl(user.getProfile().getAvatarUrl());
            dto.setCoinBalance(user.getProfile().getCoinBalance() != null ? user.getProfile().getCoinBalance() : 0);
        } else {
            dto.setCoinBalance(0);
        }

        return dto;
    }

    // 2. Hàm Cập nhật thông tin user (Từ React gửi xuống)
    public String updateUserProfile(String email, UserProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
        }

        profile.setFullName(dto.getFullName());
        profile.setJob(dto.getJob());
        profile.setPhone(dto.getPhone());
        profile.setInterests(dto.getInterests());
        if (dto.getAvatarUrl() != null) {
            profile.setAvatarUrl(dto.getAvatarUrl().isBlank() ? null : dto.getAvatarUrl());
        }
        if (profile.getCoinBalance() == null) {
            profile.setCoinBalance(0);
        }

        userProfileRepository.save(profile);
        return "Cập nhật hồ sơ thành công!";
    }

    public UserProfileDto updateAvatar(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            profile.setFullName(user.getEmail());
            profile.setCoinBalance(0);
        }

        Map<String, Object> uploadResult = cloudinaryService.uploadFileWithFolder(file, "avatars");
        Object secureUrl = uploadResult.get("secureUrl");
        if (secureUrl == null) {
            throw new RuntimeException("Không thể lấy đường dẫn ảnh đại diện.");
        }

        profile.setAvatarUrl(secureUrl.toString());
        userProfileRepository.save(profile);

        return getUserProfile(email);
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
