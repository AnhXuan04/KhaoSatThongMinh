package com.example.demo.controller;

import com.example.demo.dto.AdminDashboardStatsDto;
import com.example.demo.dto.AdminBillingDashboardDto;
import com.example.demo.dto.AdminQualityReviewDto;
import com.example.demo.dto.AdminPlanRequestDto;
import com.example.demo.dto.AdminSurveyListItemDto;
import com.example.demo.dto.SurveyRequest;
import com.example.demo.dto.UserListItemDto;
import com.example.demo.entity.SurveyField;
import com.example.demo.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    @GetMapping("/billing")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminBillingDashboardDto> getBillingDashboard() {
        return ResponseEntity.ok(adminService.getBillingDashboard());
    }

    @PostMapping("/plans")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminBillingDashboardDto.PlanItemDto> createPlan(@RequestBody AdminPlanRequestDto request) {
        return ResponseEntity.ok(adminService.createPlan(request));
    }

    @PutMapping("/plans/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminBillingDashboardDto.PlanItemDto> updatePlan(
            @PathVariable Long id,
            @RequestBody AdminPlanRequestDto request
    ) {
        return ResponseEntity.ok(adminService.updatePlan(id, request));
    }

    @GetMapping("/surveys")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AdminSurveyListItemDto>> getSurveysForAdmin() {
        return ResponseEntity.ok(adminService.getSurveysForAdmin());
    }

    @GetMapping("/surveys/{id}/view")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<SurveyRequest> getSurveyForAdminView(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getSurveyForAdminView(id));
    }

    @PutMapping("/surveys/{id}/lock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminSurveyListItemDto> lockSurvey(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.lockSurvey(id));
    }

    @PutMapping("/surveys/{id}/unlock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminSurveyListItemDto> unlockSurvey(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unlockSurvey(id));
    }

    @PutMapping("/surveys/{id}/hide")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminSurveyListItemDto> hideSurvey(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.hideSurvey(id));
    }

    @PutMapping("/surveys/{id}/unhide")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminSurveyListItemDto> unhideSurvey(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.unhideSurvey(id));
    }

    @DeleteMapping("/surveys/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteSurvey(@PathVariable Long id) {
        adminService.deleteSurvey(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/coin-reviews")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<AdminQualityReviewDto>> getPendingCoinReviews() {
        return ResponseEntity.ok(adminService.getPendingCoinReviews());
    }

    @PutMapping("/coin-reviews/{id}/approve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminQualityReviewDto> approveCoinTransaction(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.approveCoinTransaction(id, auth.getName()));
    }

    @PutMapping("/coin-reviews/{id}/reject")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminQualityReviewDto> rejectCoinTransaction(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(adminService.rejectCoinTransaction(id, auth.getName()));
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
