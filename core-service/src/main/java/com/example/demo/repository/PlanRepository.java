package com.example.demo.repository;

import com.example.demo.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {
    List<Plan> findByIsActiveTrueOrderByPriceMonthlyAsc();

    Optional<Plan> findFirstByIsActiveTrueOrderByIdAsc();

    Optional<Plan> findByCode(String code);
}