package com.example.demo.controller;

import com.example.demo.dto.SurveyRequest;
import com.example.demo.dto.SurveyListDto;
import com.example.demo.service.SurveyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    @Autowired
    private SurveyService surveyService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<String> createSurvey(@RequestBody SurveyRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String email = auth.getName();

        try {
            surveyService.createSurvey(email, request);
            return ResponseEntity.ok("Tạo khảo sát thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<List<SurveyListDto>> getUserSurveys() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            List<SurveyListDto> surveys = surveyService.getUserSurveys(email);
            return ResponseEntity.ok(surveys);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<String> updateSurvey(@PathVariable("id") Long id, @RequestBody SurveyRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            surveyService.updateSurvey(email, id, request);
            return ResponseEntity.ok("Cập nhật khảo sát thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<String> deleteSurvey(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            surveyService.softDeleteSurvey(email, id);
            return ResponseEntity.ok("Xóa khảo sát thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<SurveyRequest> getSurvey(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            SurveyRequest dto = surveyService.getSurveyForEdit(email, id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
