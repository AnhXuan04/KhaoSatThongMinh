package com.example.demo.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestController {

    @GetMapping("/all")
    public String allAccess() {
        return "Public Content.";
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String adminAccess() {
        return "Admin Board.";
    }

    @GetMapping("/interviewer")
    @PreAuthorize("hasRole('INTERVIEWER')")
    public String interviewerAccess() {
        return "Interviewer Board.";
    }

    @GetMapping("/interviewee")
    @PreAuthorize("hasRole('INTERVIEWEE')")
    public String intervieweeAccess() {
        return "Interviewee Board.";
    }
}

