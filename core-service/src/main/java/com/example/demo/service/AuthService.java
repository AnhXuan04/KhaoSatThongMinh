package com.example.demo.service;

import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.SignInRequest;
import com.example.demo.dto.SignUpRequest;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    public String registerUser(SignUpRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        user.setPassword(passwordEncoder.encode(request.getPassword()));

        String roleStr = request.getRole();
        Role role;
        if (roleStr == null) {
            role = Role.ROLE_INTERVIEWEE;
        } else {
            try {
                role = Role.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Vai trò không hợp lệ!");
            }
        }
        user.setRole(role);

        userRepository.save(user);
        return "Đăng ký tài khoản thành công!";
    }

    public String loginUser(SignInRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        return jwtUtils.generateTokenFromEmailAndRole(user.getEmail(), user.getRole().name());
    }

    @Autowired
    private EmailService emailService;

    public String generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        // Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Lưu OTP và thời gian hết hạn (5 phút) vào DB
        user.setOtpCode(otp);
        user.setOtpExpiryTime(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        // Gửi email
        emailService.sendOtpEmail(email, otp);

        return "Mã OTP đã được gửi đến email của bạn!";
    }

    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        if (user.getOtpCode() == null || !user.getOtpCode().equals(request.getOtpCode())) {
            throw new RuntimeException("Mã OTP không chính xác!");
        }

        if (user.getOtpExpiryTime() == null || user.getOtpExpiryTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));

        user.setOtpCode(null);
        user.setOtpExpiryTime(null);

        userRepository.save(user);

        return "Đặt lại mật khẩu thành công!";
    }
}