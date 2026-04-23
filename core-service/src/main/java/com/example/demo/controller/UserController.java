package com.example.demo.controller;

import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.dto.UserProfileDto;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

   @GetMapping("/profile")
    @PreAuthorize("hasAuthority('INTERVIEWEE') or hasAuthority('ADMIN') or hasAuthority('INTERVIEWER')")
    public ResponseEntity<UserProfileDto> getProfile() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (String) auth.getPrincipal();

        return ResponseEntity.ok(userService.getUserProfile(email));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasAuthority('INTERVIEWEE') or hasAuthority('ADMIN') or hasAuthority('INTERVIEWER')")
    public ResponseEntity<String> updateProfile(@RequestBody UserProfileDto dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = (String) auth.getPrincipal();

        return ResponseEntity.ok(userService.updateUserProfile(email, dto));
    }

    @PutMapping("/change-password")
    @PreAuthorize("hasAuthority('INTERVIEWEE') or hasAuthority('ADMIN') or hasAuthority('INTERVIEWER')")
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequest dto) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String email = (String) auth.getPrincipal();

            return ResponseEntity.ok(userService.changePassword(email, dto.getCurrentPassword(), dto.getNewPassword()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}