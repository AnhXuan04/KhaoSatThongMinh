package com.example.demo.service;

import com.example.demo.entity.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class SurveyService {

    @Autowired
    private UserRepository userRepository;

    public ResponseEntity<String> createSurvey(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isPremium()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Tài khoản của bạn chưa được nâng cấp để tạo khảo sát.");
        }

        // Logic to create a survey
        return ResponseEntity.ok("Khảo sát đã được tạo thành công.");
    }
}

