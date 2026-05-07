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
    private SubscriptionService subscriptionService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

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

        // Create UserProfile for new structure
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFullName(request.getFullName());
        userProfileRepository.save(profile);

        transaction.setUser(user);
        transaction.setPayerEmail(request.getEmail().trim().toLowerCase());
        transaction.setClaimed(true);
        subscriptionService.applySubscription(user, transaction);
        userRepository.save(user);
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

        // Create UserProfile for new structure
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setFullName(request.getFullName());
        userProfileRepository.save(profile);

        return "Đăng ký tài khoản thành công!";
    }

    public String loginUser(SignInRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        if (user.isLocked()) {
            throw new RuntimeException("Tài khoản đã bị khóa!");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        userRepository.save(user);

        return jwtUtils.generateTokenFromEmailAndRole(user.getEmail(), user.getRole().name());
    }

    public String generateAndSendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống!"));

        // Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Tạo OtpVerification entity cho cấu trúc mới
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

        return "Mã OTP đã được gửi đến email của bạn!";
    }

    public String resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email không tồn tại!"));

        // Tìm OTP gần đây nhất
        OtpVerification otpVerification = otpVerificationRepository
                .findFirstByUserOrderByCreatedAtDesc(user)
                .orElseThrow(() -> new RuntimeException("Không có mã OTP nào!"));

        if (!otpVerification.getOtpCode().equals(request.getOtpCode())) {
            otpVerification.setAttemptCount(otpVerification.getAttemptCount() + 1);
            otpVerificationRepository.save(otpVerification);
            throw new RuntimeException("Mã OTP không chính xác!");
        }

        if (otpVerification.isExpired()) {
            throw new RuntimeException("Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.");
        }

        if (otpVerification.isUsed()) {
            throw new RuntimeException("Mã OTP này đã được sử dụng!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        otpVerification.setUsed(true);
        otpVerification.setUsedAt(LocalDateTime.now());

        userRepository.save(user);
        otpVerificationRepository.save(otpVerification);

        return "Đặt lại mật khẩu thành công!";
    }
}