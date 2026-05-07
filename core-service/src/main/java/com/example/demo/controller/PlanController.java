package com.example.demo.controller;

import com.example.demo.dto.PlanDto;
import com.example.demo.service.PlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    @Autowired
    private PlanService planService;

    @GetMapping
    public ResponseEntity<List<PlanDto>> getPlans() {
        return ResponseEntity.ok(planService.getActivePlans());
    }

    @GetMapping("/current")
    public ResponseEntity<PlanDto> getCurrentPlan() {
        return ResponseEntity.ok(planService.getCurrentPlan());
    }
}