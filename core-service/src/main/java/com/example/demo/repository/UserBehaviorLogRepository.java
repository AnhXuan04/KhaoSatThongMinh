package com.example.demo.repository;

import com.example.demo.entity.UserBehaviorLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserBehaviorLogRepository extends JpaRepository<UserBehaviorLog, Long> {
    List<UserBehaviorLog> findByResponseId(Long responseId);
}
