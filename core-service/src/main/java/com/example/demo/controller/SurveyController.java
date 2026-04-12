package com.example.demo.controller;

import com.example.demo.service.SurveyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    @Autowired
    private SurveyService surveyService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('INTERVIEWER')")
    public ResponseEntity<String> createSurvey(Principal principal) {
        String email = principal.getName();
        return surveyService.createSurvey(email);
    }
}

