package com.example.demo.service;

import com.example.demo.entity.OtpPurpose;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp, OtpPurpose purpose, String fullName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);

        String subject;
        String content;

        if (purpose == OtpPurpose.REGISTER) {
            subject = "Xác minh tài khoản";

            content = "Xin chào " + (fullName != null ? fullName : "") + ",\n\n"
                    + "Mã OTP để xác minh tài khoản của bạn là: " + otp + "\n\n"
                    + "Mã này sẽ hết hạn trong 5 phút.\n\n"
                    + "Trân trọng.";
        } else {
            subject = "Đặt lại mật khẩu";

            content = "Xin chào,\n\n"
                    + "Mã OTP để đặt lại mật khẩu của bạn là: " + otp + "\n\n"
                    + "Mã này sẽ hết hạn trong 5 phút.\n\n"
                    + "Trân trọng.";
        }

        message.setSubject(subject);
        message.setText(content);

        mailSender.send(message);
    }
}