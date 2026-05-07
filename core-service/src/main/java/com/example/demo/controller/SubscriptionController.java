package com.example.demo.controller;

import com.example.demo.dto.SubscriptionDto;
import com.example.demo.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscription")
public class SubscriptionController {
    @Autowired
    private SubscriptionService subscriptionService;

    @GetMapping("/current")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<SubscriptionDto> getCurrentSubscription() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(subscriptionService.getCurrentSubscription(email));
    }

    @PostMapping("/cancel")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<SubscriptionDto> cancelSubscription() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(subscriptionService.cancelSubscription(email));
    }
}

