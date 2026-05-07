package com.example.demo.service;

import com.example.demo.dto.PlanDto;
import com.example.demo.entity.Plan;
import com.example.demo.repository.PlanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlanService {

    @Autowired
    private PlanRepository planRepository;

    public List<PlanDto> getActivePlans() {
        return planRepository.findByIsActiveTrueOrderByPriceMonthlyAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public PlanDto getCurrentPlan() {
        Plan plan = planRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("Chưa cấu hình gói đang hoạt động."));

        return toDto(plan);
    }

    private PlanDto toDto(Plan plan) {
        PlanDto dto = new PlanDto();
        dto.setId(plan.getId());
        dto.setCode(plan.getCode());
        dto.setName(plan.getName());
        dto.setPriceMonthly(plan.getPriceMonthly());
        dto.setPriceYearly(plan.getPriceYearly());
        dto.setFeaturesJson(plan.getFeaturesJson());
        dto.setActive(plan.isActive());
        return dto;
    }
}