package com.example.demo.service;

import com.example.demo.dto.AdminDashboardStatsDto;
import com.example.demo.dto.UserListItemDto;
import com.example.demo.entity.Role;
import com.example.demo.entity.SurveyField;
import com.example.demo.entity.User;
import com.example.demo.repository.SurveyFieldRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SurveyFieldRepository surveyFieldRepository;

    public List<UserListItemDto> getUsersForAdmin(String role) {
        Stream<User> userStream = userRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream();

        if (role != null && !role.isBlank()) {
            try {
                Role roleEnum = Role.valueOf(role.trim());
                userStream = userStream.filter(user -> user.getRole() == roleEnum);
            } catch (IllegalArgumentException ex) {
                return Collections.emptyList();
            }
        }

        return userStream.map(this::toUserListItem).collect(Collectors.toList());
    }

    private UserListItemDto toUserListItem(User user) {
        UserListItemDto dto = new UserListItemDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setRole(user.getRole() == null ? null : user.getRole().name());

        if (user.getProfile() != null) {
            dto.setFullName(user.getProfile().getFullName());
            dto.setJob(user.getProfile().getJob());
            dto.setPhone(user.getProfile().getPhone());
            dto.setInterests(splitInterests(user.getProfile().getInterests()));
        }

        dto.set_locked(user.isLocked());
        return dto;
    }

    private List<String> splitInterests(String interests) {
        if (interests == null || interests.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(interests.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .collect(Collectors.toList());
    }

    public List<SurveyField> getSurveyFields() {
        return surveyFieldRepository.findByIsDeletedFalse();
    }

    public AdminDashboardStatsDto getDashboardStats() {
        AdminDashboardStatsDto statsDto = new AdminDashboardStatsDto();
        statsDto.setTotalUsers(userRepository.count());
        return statsDto;
    }

    public void deleteField(Long id) {
        SurveyField field = surveyFieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lĩnh vực"));

        field.setDeleted(true);
        surveyFieldRepository.save(field);
    }

    public SurveyField addSurveyField(SurveyField surveyField) {
        return surveyFieldRepository.save(surveyField);
    }

    public SurveyField updateSurveyField(Long id, SurveyField updatedField) {
        SurveyField existingField = surveyFieldRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lĩnh vực"));

        existingField.setName(updatedField.getName());
        existingField.setDescription(updatedField.getDescription());

        return surveyFieldRepository.save(existingField);
    }

//Khóa tài khoản người dùng

    public UserListItemDto lockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        user.setLocked(true);
        userRepository.save(user);
        return toUserListItem(user);
    }

    public UserListItemDto unlockUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        user.setLocked(false);
        userRepository.save(user);
        return toUserListItem(user);
    }
}
