package com.example.demo.repository;

import com.example.demo.entity.OtpPurpose;
import com.example.demo.entity.OtpVerification;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findFirstByUserOrderByCreatedAtDesc(User user);

    Optional<OtpVerification> findFirstByEmailAndPurposeOrderByCreatedAtDesc(String email, OtpPurpose otpPurpose);
}

