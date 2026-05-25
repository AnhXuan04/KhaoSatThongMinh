package com.example.demo.service;

import com.example.demo.dto.AdminDashboardStatsDto;
import com.example.demo.dto.AdminQualityReviewDto;
import com.example.demo.entity.AiAnalysisResult;
import com.example.demo.entity.CoinTransaction;
import com.example.demo.entity.CoinTransactionStatus;
import com.example.demo.dto.UserListItemDto;
import com.example.demo.entity.Role;
import com.example.demo.entity.SurveyField;
import com.example.demo.entity.User;
import com.example.demo.entity.UserProfile;
import com.example.demo.repository.AiAnalysisResultRepository;
import com.example.demo.repository.CoinTransactionRepository;
import com.example.demo.repository.SurveyFieldRepository;
import com.example.demo.repository.SurveyRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    @Autowired
    private SurveyRepository surveyRepository;
    @Autowired
    private AiAnalysisResultRepository aiAnalysisResultRepository;
    @Autowired
    private CoinTransactionRepository coinTransactionRepository;
    @Autowired
    private UserProfileRepository userProfileRepository;

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
        statsDto.setTotalSurveys(surveyRepository.countByIsDeletedFalse());
        statsDto.setSuperficialSurveys(aiAnalysisResultRepository.countBySuperficialTrue());
        statsDto.setNonSuperficialSurveys(aiAnalysisResultRepository.countBySuperficialFalse());
        statsDto.setRewardEligibleResponses(aiAnalysisResultRepository.countByRewardEligibleTrue());
        return statsDto;
    }

    @Transactional
    public List<AdminQualityReviewDto> getPendingCoinReviews() {
        backfillPendingCoinTransactions();
        return coinTransactionRepository.findByStatusOrderByCreatedAtDesc(CoinTransactionStatus.PENDING)
                .stream()
                .map(this::toQualityReviewDto)
                .collect(Collectors.toList());
    }

    private void backfillPendingCoinTransactions() {
        List<AiAnalysisResult> missingTransactions = aiAnalysisResultRepository.findAnalyzedResponsesWithoutCoinTransaction();
        for (AiAnalysisResult analysisResult : missingTransactions) {
            if (analysisResult.getResponse() == null || analysisResult.getResponse().getUser() == null) {
                continue;
            }

            CoinTransaction transaction = new CoinTransaction();
            transaction.setUser(analysisResult.getResponse().getUser());
            transaction.setResponse(analysisResult.getResponse());
            transaction.setAnalysisResult(analysisResult);
            transaction.setAmount(10);
            transaction.setStatus(CoinTransactionStatus.PENDING);
            transaction.setReason(Boolean.TRUE.equals(analysisResult.getRewardEligible())
                    ? "AI đánh giá phản hồi đạt chất lượng, chờ admin duyệt."
                    : "AI đánh giá phản hồi cần xem lại, cho admin duyệt hoặc từ chối.");
            coinTransactionRepository.save(transaction);
        }
    }

    @Transactional
    public AdminQualityReviewDto approveCoinTransaction(Long transactionId, String adminEmail) {
        CoinTransaction transaction = coinTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch coin"));
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy admin"));

        if (transaction.getStatus() != CoinTransactionStatus.PENDING) {
            throw new RuntimeException("Giao dịch coin đã được xử lý");
        }

        addCoinToWallet(transaction.getUser(), transaction.getAmount());
        transaction.setStatus(CoinTransactionStatus.APPROVED);
        transaction.setApprovedBy(admin);
        transaction.setApprovedAt(LocalDateTime.now());
        transaction.setReason("Admin đã duyệt cộng coin.");

        return toQualityReviewDto(coinTransactionRepository.save(transaction));
    }

    @Transactional
    public AdminQualityReviewDto rejectCoinTransaction(Long transactionId, String adminEmail) {
        CoinTransaction transaction = coinTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giao dịch coin"));
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy admin"));

        if (transaction.getStatus() != CoinTransactionStatus.PENDING) {
            throw new RuntimeException("Giao dịch coin đã được xử lý");
        }

        transaction.setStatus(CoinTransactionStatus.REJECTED);
        transaction.setApprovedBy(admin);
        transaction.setApprovedAt(LocalDateTime.now());
        transaction.setReason("Admin từ chối cộng coin sau khi xem xét.");

        return toQualityReviewDto(coinTransactionRepository.save(transaction));
    }

    private void addCoinToWallet(User user, Integer amount) {
        if (user == null || amount == null || amount <= 0) {
            return;
        }

        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            profile.setFullName(user.getEmail() != null ? user.getEmail().split("@")[0] : "Interviewee");
        }

        int currentBalance = profile.getCoinBalance() != null ? profile.getCoinBalance() : 0;
        profile.setCoinBalance(currentBalance + amount);
        userProfileRepository.save(profile);
    }

    private AdminQualityReviewDto toQualityReviewDto(CoinTransaction transaction) {
        String submittedAt = transaction.getResponse().getSubmittedAt() != null
                ? transaction.getResponse().getSubmittedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "";

        return new AdminQualityReviewDto(
                transaction.getId(),
                transaction.getResponse().getId(),
                transaction.getResponse().getSurvey().getTitle(),
                transaction.getUser().getEmail(),
                transaction.getAnalysisResult() != null ? transaction.getAnalysisResult().getQualityScore() : 0,
                transaction.getAnalysisResult() != null && Boolean.TRUE.equals(transaction.getAnalysisResult().getSuperficial()),
                transaction.getAnalysisResult() != null && Boolean.TRUE.equals(transaction.getAnalysisResult().getRewardEligible()),
                transaction.getAnalysisResult() != null ? transaction.getAnalysisResult().getAnalysisSummary() : "",
                transaction.getAmount(),
                transaction.getStatus().name(),
                transaction.getReason(),
                submittedAt
        );
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
