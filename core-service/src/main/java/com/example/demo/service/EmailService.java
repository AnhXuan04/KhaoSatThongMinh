package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Mã OTP khôi phục mật khẩu");
        message.setText("Xin chào,\n\nMã OTP để đặt lại mật khẩu của bạn là: " + otp +
                "\nMã này sẽ hết hạn trong 5 phút.\n\nTrân trọng.");

        mailSender.send(message);
    }
}