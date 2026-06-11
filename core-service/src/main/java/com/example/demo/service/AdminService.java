package com.example.demo.service;

import com.example.demo.dto.AdminDashboardStatsDto;
import com.example.demo.dto.AdminQualityReviewDto;
import com.example.demo.dto.AdminSurveyListItemDto;
import com.example.demo.dto.OptionRequest;
import com.example.demo.dto.QuestionRequest;
import com.example.demo.dto.SurveyRequest;
import com.example.demo.entity.AiAnalysisResult;
import com.example.demo.entity.CoinTransaction;
import com.example.demo.entity.CoinTransactionStatus;
import com.example.demo.entity.Option;
import com.example.demo.entity.Question;
import com.example.demo.dto.UserListItemDto;
import com.example.demo.entity.Role;
import com.example.demo.entity.SurveyField;
import com.example.demo.entity.User;
import com.example.demo.entity.UserProfile;
import com.example.demo.repository.AiAnalysisResultRepository;
import com.example.demo.repository.CoinTransactionRepository;
import com.example.demo.repository.SurveyFieldRepository;
import com.example.demo.repository.SurveyRepository;
import com.example.demo.repository.SurveyResponseRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
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
    @Autowired
    private SurveyResponseRepository surveyResponseRepository;

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

    public List<AdminSurveyListItemDto> getSurveysForAdmin() {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        return surveyRepository.findByIsDeletedFalseOrderByCreatedAtDesc()
                .stream()
                .map(survey -> {
                    User creator = survey.getUser();
                    UserProfile profile = creator != null ? creator.getProfile() : null;
                    String creatorName = profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()
                            ? profile.getFullName()
                            : creator != null ? creator.getEmail() : "Không rõ";
                    String createdAt = survey.getCreatedAt() != null ? survey.getCreatedAt().format(formatter) : "";

                    return new AdminSurveyListItemDto(
                            survey.getId(),
                            survey.getTitle(),
                            creatorName,
                            creator != null ? creator.getEmail() : "",
                            surveyResponseRepository.countBySurveyId(survey.getId()),
                            createdAt,
                            getSurveyStatus(survey),
                            Boolean.TRUE.equals(survey.getIsHidden()),
                            Boolean.TRUE.equals(survey.getIsLocked())
                    );
                })
                .collect(Collectors.toList());
    }

    public SurveyRequest getSurveyForAdminView(Long surveyId) {
        com.example.demo.entity.Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khảo sát"));

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát đã bị xóa");
        }

        SurveyRequest dto = new SurveyRequest();
        dto.setTitle(survey.getTitle());
        dto.setDescription(survey.getDescription());
        dto.setSurveyFieldId(survey.getSurveyField() != null ? survey.getSurveyField().getId() : null);

        List<QuestionRequest> questions = survey.getQuestions() != null
                ? survey.getQuestions().stream()
                        .sorted(java.util.Comparator.comparing(Question::getQuestionOrder, java.util.Comparator.nullsLast(Integer::compareTo)))
                        .map(question -> {
                            QuestionRequest questionDto = new QuestionRequest();
                            questionDto.setId(question.getId());
                            questionDto.setTitle(question.getTitle());
                            questionDto.setType(question.getType());
                            questionDto.setKind(question.getKind());
                            questionDto.setRequired(question.getRequired());
                            questionDto.setMaxFileSizeMb(question.getMaxFileSizeMb());
                            questionDto.setMaxFileCount(question.getMaxFileCount());
                            questionDto.setMediaUrl(question.getMediaUrl());

                            List<OptionRequest> options = question.getOptions() != null
                                    ? question.getOptions().stream()
                                            .sorted(java.util.Comparator.comparing(Option::getOptionOrder, java.util.Comparator.nullsLast(Integer::compareTo)))
                                            .map(option -> {
                                                OptionRequest optionDto = new OptionRequest();
                                                optionDto.setText(option.getText());
                                                return optionDto;
                                            })
                                            .collect(Collectors.toList())
                                    : Collections.emptyList();
                            questionDto.setOptions(options);
                            return questionDto;
                        })
                        .collect(Collectors.toList())
                : Collections.emptyList();

        dto.setQuestions(questions);
        return dto;
    }

    private String getSurveyStatus(com.example.demo.entity.Survey survey) {
        if (Boolean.TRUE.equals(survey.getIsLocked())) {
            return "BI_KHOA";
        }
        if (Boolean.TRUE.equals(survey.getIsHidden())) {
            return "DA_AN";
        }
        return "HOAT_DONG";
    }

    @Transactional
    public AdminSurveyListItemDto lockSurvey(Long surveyId) {
        com.example.demo.entity.Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khảo sát"));
        survey.setIsLocked(true);
        return toAdminSurveyListItem(surveyRepository.save(survey));
    }

    @Transactional
    public AdminSurveyListItemDto unlockSurvey(Long surveyId) {
        com.example.demo.entity.Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khảo sát"));
        survey.setIsLocked(false);
        return toAdminSurveyListItem(surveyRepository.save(survey));
    }

    @Transactional
    public AdminSurveyListItemDto hideSurvey(Long surveyId) {
        com.example.demo.entity.Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khảo sát"));
        survey.setIsHidden(true);
        return toAdminSurveyListItem(surveyRepository.save(survey));
    }

    @Transactional
    public AdminSurveyListItemDto unhideSurvey(Long surveyId) {
        com.example.demo.entity.Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khảo sát"));
        survey.setIsHidden(false);
        return toAdminSurveyListItem(surveyRepository.save(survey));
    }

    @Transactional
    public void deleteSurvey(Long surveyId) {
        com.example.demo.entity.Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khảo sát"));
        survey.setIsDeleted(true);
        surveyRepository.save(survey);
    }

    private AdminSurveyListItemDto toAdminSurveyListItem(com.example.demo.entity.Survey survey) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        User creator = survey.getUser();
        UserProfile profile = creator != null ? creator.getProfile() : null;
        String creatorName = profile != null && profile.getFullName() != null && !profile.getFullName().isBlank()
                ? profile.getFullName()
                : creator != null ? creator.getEmail() : "Không rõ";
        String createdAt = survey.getCreatedAt() != null ? survey.getCreatedAt().format(formatter) : "";

        return new AdminSurveyListItemDto(
                survey.getId(),
                survey.getTitle(),
                creatorName,
                creator != null ? creator.getEmail() : "",
                surveyResponseRepository.countBySurveyId(survey.getId()),
                createdAt,
                getSurveyStatus(survey),
                Boolean.TRUE.equals(survey.getIsHidden()),
                Boolean.TRUE.equals(survey.getIsLocked())
        );
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
