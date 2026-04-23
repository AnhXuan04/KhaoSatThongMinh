package com.example.demo.controller;

import com.example.demo.dto.AdminDashboardStatsDto;
import com.example.demo.dto.UserListItemDto;
import com.example.demo.entity.SurveyField;
import com.example.demo.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<UserListItemDto>> getUsersForAdmin(@RequestParam(required = false) String role) {
        return ResponseEntity.ok(adminService.getUsersForAdmin(role));
    }

    @PutMapping("/users/{id}/lock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserListItemDto> lockUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.lockUser(id));
    }

    @PutMapping("/users/{id}/unlock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserListItemDto> unlockUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unlockUser(id));
    }

    @GetMapping("/survey-fields")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<SurveyField>> getSurveyFields() {
        return ResponseEntity.ok(adminService.getSurveyFields());
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminDashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @PostMapping("/survey-fields")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SurveyField> createSurveyField(@RequestBody SurveyField surveyField) {
        return ResponseEntity.ok(adminService.addSurveyField(surveyField));
    }

    @DeleteMapping("/survey-fields/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSurveyField(@PathVariable Long id) {
        adminService.deleteField(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/survey-fields/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SurveyField> updateSurveyField(@PathVariable Long id, @RequestBody SurveyField surveyField) {
        return ResponseEntity.ok(adminService.updateSurveyField(id, surveyField));
    }
}
