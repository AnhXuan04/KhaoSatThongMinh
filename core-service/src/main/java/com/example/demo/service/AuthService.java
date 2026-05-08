package com.example.demo.service;

import com.example.demo.dto.ResetPasswordRequest;
import com.example.demo.dto.SignInRequest;
import com.example.demo.dto.SignUpRequest;
import com.example.demo.entity.*;
import com.example.demo.repository.PaymentTransactionRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.OtpVerificationRepository;
import com.example.demo.repository.UserProfileRepository;
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
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private EmailService emailService;

    public String registerUser(SignUpRequest request) {
        return registerByRole(request, Role.INTERVIEWEE);
    }

    public String registerInterviewer(SignUpRequest request) {
        if (request.getPaidTxnRef() == null || request.getPaidTxnRef().isBlank()) {
            throw new RuntimeException("Bạn chưa thanh toán gói. Vui lòng hoàn tất thanh toán trước khi đăng ký.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        PaymentTransaction transaction = paymentTransactionRepository.findByVnpTxnRef(request.getPaidTxnRef())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch thanh toán hợp lệ."));

        if (transaction.getStatus() != PaymentStatus.SUCCESS) {
            throw new RuntimeException("Giao dịch chưa thanh toán thành công.");
        }

        if (Boolean.TRUE.equals(transaction.getClaimed())) {
            throw new RuntimeException("Giao dịch này đã được dùng để đăng ký tài khoản.");
        }

        String paidEmail = transaction.getPayerEmail();
        if (paidEmail != null && !paidEmail.equalsIgnoreCase(request.getEmail())) {
            throw new RuntimeException("Email đăng ký phải trùng với email đã thanh toán.");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.INTERVIEWER);
        userRepository.save(user);

        // Also create UserProfile for new structure
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFullName(request.getFullName());
        userProfileRepository.save(profile);

        paymentTransactionRepository.save(transaction);

        return "Đăng ký tài khoản thành công!";
    }

    private String registerByRole(SignUpRequest request, Role role) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email này đã được sử dụng!");
        }

        if (role != Role.INTERVIEWEE && role != Role.INTERVIEWER) {
            throw new RuntimeException("Không thể đăng ký với vai trò này!");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        userRepository.save(user);

        // Also create UserProfile for new structure
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFullName(request.getFullName());
        userProfileRepository.save(profile);

        return "Đăng ký tài khoản thành công!";
    }

    public String registerUserByRole(SignUpRequest request, Role role) {
        return registerByRole(request, role);
    }

    public String loginUser(SignInRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không chính xác!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không chính xác!");
        }

        return jwtUtils.generateTokenFromEmailAndRole(user.getEmail(), user.getRole().name());
    }

    public String generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        // Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Cũng tạo OtpVerification entity cho cấu trúc mới
        OtpVerification otpVerification = new OtpVerification();
        otpVerification.setUser(user);
        otpVerification.setOtpCode(otp);
        otpVerification.setPurpose(OtpPurpose.PASSWORD_RESET);
        otpVerification.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otpVerification.setAttemptCount(0);
        otpVerification.setUsed(false);
        otpVerificationRepository.save(otpVerification);

        // Gửi email
        emailService.sendOtpEmail(email, otp);

        return "OTP đã được gửi đến email của bạn!";
    }

    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        // Xác thực OTP
        if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
            throw new RuntimeException("OTP không được để trống!");
        }

        OtpVerification otpVerification = otpVerificationRepository
                .findFirstByUserOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy mã OTP!"));

        if (otpVerification.isExpired()) {
            throw new RuntimeException("Mã OTP đã hết hạn!");
        }

        if (otpVerification.isUsed()) {
            throw new RuntimeException("Mã OTP này đã được sử dụng!");
        }

        if (!otpVerification.getOtpCode().equals(request.getOtpCode())) {
            otpVerification.setAttemptCount(otpVerification.getAttemptCount() + 1);
            otpVerificationRepository.save(otpVerification);
            throw new RuntimeException("Mã OTP không chính xác!");
        }

        // Cập nhật mật khẩu
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Cập nhật OtpVerification entity
        otpVerification.setUsed(true);
        otpVerification.setUsedAt(LocalDateTime.now());
        otpVerificationRepository.save(otpVerification);

        return "Đặt lại mật khẩu thành công!";
    }
}