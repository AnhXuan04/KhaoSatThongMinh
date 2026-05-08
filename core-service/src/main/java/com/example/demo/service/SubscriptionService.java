package com.example.demo.service;

import com.example.demo.dto.SubscriptionDto;
import com.example.demo.entity.*;
import com.example.demo.repository.PlanRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.SubscriptionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Locale;

@Service
public class SubscriptionService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private PlanRepository planRepository;

    public SubscriptionDto getCurrentSubscription(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        Subscription subscription = subscriptionRepository.findByUserId(user.getId())
                .orElse(null);

        return toDto(subscription);
    }

    public SubscriptionDto cancelSubscription(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        Subscription subscription = subscriptionRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy gói dịch vụ!"));

        if (subscription.getStatus() == SubscriptionStatus.ACTIVE) {
            subscription.setCanceledAt(LocalDateTime.now());
            subscription.setStatus(SubscriptionStatus.CANCELED);
            subscriptionRepository.save(subscription);
        }

        return toDto(subscription);
    }

    public void applySubscription(User user, PaymentTransaction transaction) {
        String billingCycle = normalizeBillingCycle(transaction.getBillingCycle());
        LocalDateTime now = LocalDateTime.now();

        // Tạo/cập nhật Subscription entity
        Subscription subscription = subscriptionRepository.findByUserId(user.getId())
                .orElse(null);

        if (subscription == null) {
            subscription = new Subscription();
            subscription.setUser(user);
            subscription.setStartedAt(now);
        } else {
            if (subscription.getExpiresAt() == null || !subscription.getExpiresAt().isAfter(now)) {
                subscription.setStartedAt(now);
            }
        }

        LocalDateTime baseDate = now;
        if (subscription.getExpiresAt() != null && subscription.getExpiresAt().isAfter(now)) {
            baseDate = subscription.getExpiresAt();
        }

        LocalDateTime newExpiry = addCycle(baseDate, billingCycle);
        subscription.setPlanCode(transaction.getPlanCode());
        subscription.setBillingCycle(billingCycle);
        subscription.setExpiresAt(newExpiry);
        subscription.setCanceledAt(null);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        subscriptionRepository.save(subscription);
    }

    private SubscriptionDto toDto(Subscription subscription) {
        SubscriptionDto dto = new SubscriptionDto();

        if (subscription == null) {
            dto.setPremium(false);
            dto.setStatus("NONE");
            return dto;
        }

        dto.setPremium(subscription.isActive());
        dto.setPlanCode(subscription.getPlanCode());
        dto.setBillingCycle(subscription.getBillingCycle());
        dto.setStartedAt(subscription.getStartedAt());
        dto.setExpiresAt(subscription.getExpiresAt());
        dto.setCanceledAt(subscription.getCanceledAt());
        dto.setStatus(subscription.getStatus() != null ? subscription.getStatus().name() : "NONE");

        if (subscription.getPlanCode() != null) {
            Plan plan = planRepository.findByCode(subscription.getPlanCode()).orElse(null);
            dto.setPlanName(plan != null ? plan.getName() : subscription.getPlanCode());
            dto.setFeaturesJson(plan != null ? plan.getFeaturesJson() : null);
        }

        return dto;
    }

    private String normalizeBillingCycle(String billingCycle) {
        if (billingCycle == null || billingCycle.isBlank()) {
            return "MONTHLY";
        }
        return billingCycle.trim().toUpperCase(Locale.ROOT);
    }

    private LocalDateTime addCycle(LocalDateTime baseDate, String billingCycle) {
        if ("YEARLY".equalsIgnoreCase(billingCycle)) {
            return baseDate.plusYears(1);
        }
        return baseDate.plusMonths(1);
    }
}

