package com.example.demo.config;

import com.example.demo.entity.Plan;
import com.example.demo.repository.PlanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.util.List;

@Configuration
public class PlanDataInitializer {

    @Bean
    CommandLineRunner initPlans(PlanRepository planRepository) {
        return args -> {
            Plan currentPlan = upsertSinglePlan(planRepository, "SURVEY_PREMIUM", "Gói Khảo Sát Premium", new BigDecimal("89000"), new BigDecimal("854000"),
                    "[\"Khảo sát không giới hạn\",\"1000 lượt phản hồi\",\"Phân tích logic\"]");

            deactivateOtherPlans(planRepository, currentPlan.getCode());
        };
    }

    private Plan upsertSinglePlan(PlanRepository planRepository,
                                  String code,
                                  String name,
                                  BigDecimal priceMonthly,
                                  BigDecimal priceYearly,
                                  String featuresJson) {
        Plan plan = planRepository.findByCode(code).orElseGet(Plan::new);
        plan.setCode(code);
        plan.setName(name);
        plan.setPriceMonthly(priceMonthly);
        plan.setPriceYearly(priceYearly);
        plan.setFeaturesJson(featuresJson);
        plan.setActive(true);
        return planRepository.save(plan);
    }

    private void deactivateOtherPlans(PlanRepository planRepository, String activeCode) {
        List<Plan> allPlans = planRepository.findAll();
        for (Plan plan : allPlans) {
            if (!activeCode.equals(plan.getCode()) && plan.isActive()) {
                plan.setActive(false);
                planRepository.save(plan);
            }
        }
    }
}