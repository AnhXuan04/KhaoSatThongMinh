package com.example.demo.service;

import com.example.demo.dto.SubmitAnswerDto;
import com.example.demo.dto.SubmitSurveyRequest;
import com.example.demo.dto.SurveyHistoryItemDto;
import com.example.demo.dto.SurveyQualityAnalyticsDto;
import com.example.demo.dto.SurveyResponseDetailDto;
import com.example.demo.dto.SurveyResponseListItemDto;
import com.example.demo.dto.QuestionStatisticsDto;
import com.example.demo.dto.OptionStatisticDto;
import com.example.demo.dto.AiAnalyzeRequestDto;
import com.example.demo.dto.AiAnalyzeResponseDto;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SurveyResponseService {

    private static final Logger log = LoggerFactory.getLogger(SurveyResponseService.class);

    @Autowired
    private SurveyRepository surveyRepository;

    @Autowired
    private SurveyResponseRepository surveyResponseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private OptionRepository optionRepository;

    @Autowired
    private UserBehaviorLogRepository userBehaviorLogRepository;

    @Autowired
    private AiAnalysisResultRepository aiAnalysisResultRepository;

    @Autowired
    private CoinTransactionRepository coinTransactionRepository;

    @Autowired
    private AiAnalysisClient aiAnalysisClient;

    public List<SurveyHistoryItemDto> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return surveyResponseRepository.findByUserIdOrderBySubmittedAtDesc(user.getId())
                .stream()
                .map(SurveyHistoryItemDto::fromResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SurveyResponseDetailDto getResponseDetail(Long responseId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SurveyResponse response = surveyResponseRepository.findByIdWithDetails(responseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phản hồi."));

        // Check authorization: user must be either the respondent (INTERVIEWEE) or the survey creator (INTERVIEWER)
        boolean isRespondent = response.getUser() != null && response.getUser().getId().equals(user.getId());
            boolean isSurveyCreator = response.getSurvey().getUser() != null && 
                          response.getSurvey().getUser().getEmail().equals(email);

        if (!isRespondent && !isSurveyCreator) {
            throw new RuntimeException("Không có quyền xem phản hồi này.");
        }

        String completedAt = response.getSubmittedAt() != null
                ? response.getSubmittedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "";

        // Group answers by question, giữ thứ tự
        java.util.Map<Long, SurveyResponseDetailDto.AnswerDetailDto> answerMap = new java.util.LinkedHashMap<>();
        if (response.getAnswers() != null) {
            for (SurveyAnswer answer : response.getAnswers()) {
                Long qId = answer.getQuestion().getId();
                answerMap.computeIfAbsent(qId, k -> new SurveyResponseDetailDto.AnswerDetailDto(
                        qId,
                        answer.getQuestion().getTitle(),
                        answer.getQuestion().getType(),
                        answer.getQuestion().getKind(),
                        new ArrayList<>(),
                        null, null, null, null, null
                ));
                
                SurveyResponseDetailDto.AnswerDetailDto dto = answerMap.get(qId);
                
                // Populate file metadata when file info exists
                if (answer.getCloudinaryPublicId() != null || answer.getSecureUrl() != null) {
                    dto.setCloudinaryPublicId(answer.getCloudinaryPublicId());
                    dto.setSecureUrl(answer.getSecureUrl());
                    dto.setOriginalFileName(answer.getOriginalFileName());
                    dto.setFileSize(answer.getFileSize());
                    dto.setFileType(answer.getFileType());
                }
                
                if (answer.getAnswerText() != null) {
                    dto.getValues().add(answer.getAnswerText());
                }
            }
        }

        return new SurveyResponseDetailDto(
                response.getId(),
                response.getSurvey().getId(),
                response.getSurvey().getTitle(),
                completedAt,
                new ArrayList<>(answerMap.values())
        );
    }

    @Transactional
    public void submitResponse(Long surveyId, SubmitSurveyRequest request, String email) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khảo sát."));

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát không còn tồn tại.");
        }

        // Nếu user đã đăng nhập, kiểm tra đã làm chưa
        User resolvedUser = null;
        if (email != null && !email.isBlank()) {
            resolvedUser = userRepository.findByEmail(email).orElse(null);
        }
        if (resolvedUser != null && surveyResponseRepository.existsBySurveyIdAndUserId(surveyId, resolvedUser.getId())) {
            throw new RuntimeException("Bạn đã thực hiện khảo sát này rồi.");
        }

        SurveyResponse response = new SurveyResponse();
        response.setSurvey(survey);

        if (resolvedUser != null) {
            response.setUser(resolvedUser);
        }

        List<SurveyAnswer> answerList = new ArrayList<>();

        List<SubmitAnswerDto> submittedAnswers = request.getAnswers() != null ? request.getAnswers() : List.of();
        for (SubmitAnswerDto dto : submittedAnswers) {
            Question question = questionRepository.findById(dto.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Câu hỏi không tồn tại: " + dto.getQuestionId()));

            boolean hasFileMetadata = dto.getCloudinaryPublicId() != null || dto.getSecureUrl() != null;

            boolean isFileUploadQuestion = "file_upload".equals(question.getKind()) || "file_upload".equals(question.getType());

            // Persist file upload whenever client sends file metadata
            if (hasFileMetadata || isFileUploadQuestion) {
                if (!hasFileMetadata && isFileUploadQuestion) {
                    throw new RuntimeException("Câu hỏi tải tệp chưa có dữ liệu tệp hợp lệ.");
                }

                if (hasFileMetadata) {
                    SurveyAnswer answer = new SurveyAnswer();
                    answer.setResponse(response);
                    answer.setQuestion(question);
                    answer.setCloudinaryPublicId(dto.getCloudinaryPublicId());
                    answer.setSecureUrl(dto.getSecureUrl());
                    answer.setOriginalFileName(dto.getOriginalFileName());
                    answer.setFileSize(dto.getFileSize());
                    answer.setFileType(dto.getFileType());
                    answerList.add(answer);
                }
                continue;
            }

            if (dto.getValues() == null || dto.getValues().isEmpty()) continue;

            for (String value : dto.getValues()) {
                SurveyAnswer answer = new SurveyAnswer();
                answer.setResponse(response);
                answer.setQuestion(question);
                answer.setAnswerText(value);

                // Nếu là trắc nghiệm, tìm option tương ứng để lưu FK
                if (!question.getType().equals("short_text") && question.getOptions() != null) {
                    question.getOptions().stream()
                            .filter(o -> o.getText().equals(value))
                            .findFirst()
                            .ifPresent(answer::setOption);
                }

                answerList.add(answer);
            }
        }

        response.setAnswers(answerList);
        SurveyResponse savedResponse = surveyResponseRepository.save(response);
        saveBehaviorLogs(savedResponse, survey, resolvedUser, request);
        java.util.Optional<AiAnalysisResult> analysisResult = analyzeResponseQuality(savedResponse);
        if (analysisResult.isPresent()) {
            createPendingCoinTransactionForAnalysis(savedResponse, analysisResult.get());
        } else {
            log.warn("Survey response {} was saved but AI analysis was not created. Check AI Service and trained model.",
                    savedResponse.getId());
        }
    }

    private void saveBehaviorLogs(SurveyResponse response, Survey survey, User user, SubmitSurveyRequest request) {
        if (request.getBehaviorLogs() == null || request.getBehaviorLogs().isEmpty()) {
            return;
        }

        List<UserBehaviorLog> logs = request.getBehaviorLogs().stream()
                .filter(dto -> dto.getEventType() != null && !dto.getEventType().isBlank())
                .map(dto -> {
                    UserBehaviorLog log = new UserBehaviorLog();
                    log.setResponse(response);
                    log.setSurvey(survey);
                    log.setUser(user);
                    log.setQuestionId(dto.getQuestionId());
                    log.setEventType(dto.getEventType());
                    log.setEventValue(dto.getEventValue());
                    log.setDurationMs(dto.getDurationMs());
                    return log;
                })
                .collect(java.util.stream.Collectors.toList());

        if (!logs.isEmpty()) {
            userBehaviorLogRepository.saveAll(logs);
        }
    }

    private java.util.Optional<AiAnalysisResult> analyzeResponseQuality(SurveyResponse response) {
        List<UserBehaviorLog> logs = userBehaviorLogRepository.findByResponseId(response.getId());
        AiAnalyzeRequestDto request = buildAiAnalyzeRequest(response, logs);
        java.util.Optional<AiAnalyzeResponseDto> aiResponse = aiAnalysisClient.analyze(request);

        if (aiResponse.isPresent()) {
            AiAnalyzeResponseDto dto = aiResponse.get();
            AiAnalysisResult result = new AiAnalysisResult();
            result.setResponse(response);
            result.setQualityScore(dto.getQualityScore() != null ? dto.getQualityScore() : 0);
            result.setSuperficial(dto.resolvedSuperficial());
            result.setRewardEligible(Boolean.TRUE.equals(dto.getRewardEligible()) && response.getUser() != null);
            result.setModelName(dto.getModelName() != null ? dto.getModelName() : "fastapi-ai-service");
            result.setAnalysisSummary(dto.getAnalysisSummary());
            result.setRecommendation(dto.getRecommendation());
            return java.util.Optional.of(aiAnalysisResultRepository.save(result));
        }

        return java.util.Optional.empty();
    }

    private AiAnalyzeRequestDto buildAiAnalyzeRequest(SurveyResponse response, List<UserBehaviorLog> logs) {
        List<AiAnalyzeRequestDto.AiAnswerDto> answers = new ArrayList<>();
        if (response.getAnswers() != null) {
            for (SurveyAnswer answer : response.getAnswers()) {
                Question question = answer.getQuestion();
                answers.add(new AiAnalyzeRequestDto.AiAnswerDto(
                        question != null ? question.getId() : null,
                        question != null ? question.getType() : null,
                        question != null ? question.getKind() : null,
                        answer.getAnswerText() != null ? answer.getAnswerText() : ""
                ));
            }
        }

        List<AiAnalyzeRequestDto.AiBehaviorLogDto> behaviorLogs = logs.stream()
                .map(log -> new AiAnalyzeRequestDto.AiBehaviorLogDto(
                        log.getQuestionId(),
                        log.getEventType(),
                        log.getEventValue(),
                        log.getDurationMs()
                ))
                .collect(java.util.stream.Collectors.toList());

        return new AiAnalyzeRequestDto(
                response.getId(),
                response.getSurvey().getId(),
                answers,
                behaviorLogs
        );
    }

    private void createPendingCoinTransactionForAnalysis(SurveyResponse response, AiAnalysisResult analysisResult) {
        if (response.getUser() == null) {
            return;
        }

        if (coinTransactionRepository.findByResponseId(response.getId()).isPresent()) {
            return;
        }

        CoinTransaction transaction = new CoinTransaction();
        transaction.setUser(response.getUser());
        transaction.setResponse(response);
        transaction.setAnalysisResult(analysisResult);
        transaction.setAmount(10);
        transaction.setStatus(CoinTransactionStatus.PENDING);
        transaction.setReason(Boolean.TRUE.equals(analysisResult.getRewardEligible())
                ? "AI danh gia phan hoi dat chat luong, cho admin duyet."
                : "AI danh gia phan hoi can xem lai, cho admin duyet hoac tu choi.");
        coinTransactionRepository.save(transaction);
    }

    @Transactional(readOnly = true)
    public SurveyQualityAnalyticsDto getQualityAnalyticsForInterviewer(String interviewerEmail) {
        User interviewer = userRepository.findByEmail(interviewerEmail)
                .orElseThrow(() -> new RuntimeException("Nguoi dung khong ton tai"));

        List<AiAnalysisResult> results = aiAnalysisResultRepository.findRecentByInterviewerId(interviewer.getId());
        List<CoinTransaction> transactions = coinTransactionRepository.findByInterviewerId(interviewer.getId());
        long totalResponses = surveyResponseRepository.countByInterviewerId(interviewer.getId());

        return buildQualityAnalytics(results, transactions, totalResponses);
    }

    @Transactional(readOnly = true)
    public SurveyQualityAnalyticsDto getQualityAnalyticsForSurvey(Long surveyId, String interviewerEmail) {
        User interviewer = userRepository.findByEmail(interviewerEmail)
                .orElseThrow(() -> new RuntimeException("Nguoi dung khong ton tai"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Khảo sát không tồn tại"));

        if (!survey.getUser().getId().equals(interviewer.getId())) {
            throw new RuntimeException("Không có quyền xem phân tích khảo sát này.");
        }

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát không tồn tại.");
        }

        List<AiAnalysisResult> results = aiAnalysisResultRepository.findRecentBySurveyId(surveyId);
        List<CoinTransaction> transactions = coinTransactionRepository.findBySurveyId(surveyId);
        long totalResponses = surveyResponseRepository.countBySurveyId(surveyId);

        return buildQualityAnalytics(results, transactions, totalResponses);
    }

    private SurveyQualityAnalyticsDto buildQualityAnalytics(
            List<AiAnalysisResult> results,
            List<CoinTransaction> transactions,
            long totalResponses) {
        Map<Long, CoinTransaction> transactionByResponseId = transactions.stream()
                .collect(java.util.stream.Collectors.toMap(
                        transaction -> transaction.getResponse().getId(),
                        transaction -> transaction,
                        (first, second) -> first
                ));

        long superficial = results.stream().filter(result -> Boolean.TRUE.equals(result.getSuperficial())).count();
        long rewardEligible = results.stream().filter(result -> Boolean.TRUE.equals(result.getRewardEligible())).count();
        long pendingCoins = transactions.stream()
                .filter(transaction -> transaction.getStatus() == CoinTransactionStatus.PENDING)
                .count();
        int averageScore = results.isEmpty()
                ? 0
                : Math.round((float) results.stream().mapToInt(AiAnalysisResult::getQualityScore).sum() / results.size());
        int rewardEligibleRate = results.isEmpty()
                ? 0
                : Math.round((rewardEligible * 100f) / results.size());

        List<SurveyQualityAnalyticsDto.ResponseQualityItemDto> recent = results.stream()
                .limit(6)
                .map(result -> {
                    SurveyResponse response = result.getResponse();
                    CoinTransaction transaction = transactionByResponseId.get(response.getId());
                    String submittedAt = response.getSubmittedAt() != null
                            ? response.getSubmittedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                            : "";
                    return new SurveyQualityAnalyticsDto.ResponseQualityItemDto(
                            response.getId(),
                            response.getSurvey().getId(),
                            response.getSurvey().getTitle(),
                            response.getUser() != null ? response.getUser().getEmail() : "Khach",
                            result.getQualityScore(),
                            result.getSuperficial(),
                            result.getRewardEligible(),
                            result.getRecommendation(),
                            transaction != null ? transaction.getStatus().name() : "NONE",
                            submittedAt
                    );
                })
                .collect(java.util.stream.Collectors.toList());

        return new SurveyQualityAnalyticsDto(
                totalResponses,
                results.size(),
                results.size() - superficial,
                superficial,
                results.size() - superficial,
                rewardEligible,
                rewardEligibleRate,
                pendingCoins,
                averageScore,
                recent
        );
    }

    @Transactional(readOnly = true)
    public List<SurveyResponseListItemDto> getResponsesForSurvey(Long surveyId, String interviewerEmail) {
        // Verify interviewer owns this survey
        User interviewer = userRepository.findByEmail(interviewerEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Khảo sát không tồn tại"));

        if (!survey.getUser().getId().equals(interviewer.getId())) {
            throw new RuntimeException("Không có quyền xem phản hồi của khảo sát này");
        }

        List<SurveyResponse> responses = surveyResponseRepository.findBySurveyId(surveyId);

        return responses.stream().map(response -> {
            String userName = "Khách";
            String userEmail = "";
            String avatar = "K";

            if (response.getUser() != null && response.getUser().getProfile() != null) {
                userName = response.getUser().getProfile().getFullName();
                userEmail = response.getUser().getEmail();
                // Generate avatar from initials
                String[] parts = userName.split(" ");
                avatar = (parts.length > 0 ? parts[0].substring(0, 1) : "K")
                        + (parts.length > 1 ? parts[parts.length - 1].substring(0, 1) : "");
                avatar = avatar.toUpperCase();
            }

            Integer rating = null;
            String comment = "";

            // Try to find rating/comment from answers
            if (response.getAnswers() != null) {
                for (SurveyAnswer answer : response.getAnswers()) {
                    if (answer.getQuestion().getKind() != null && answer.getQuestion().getKind().equals("rating")) {
                        try {
                            rating = Integer.parseInt(answer.getAnswerText());
                        } catch (NumberFormatException e) {
                            // ignore
                        }
                    }
                    if (comment.isBlank()) {
                        boolean isTextAnswer = "short_text".equals(answer.getQuestion().getType())
                                || "short_answer".equals(answer.getQuestion().getKind())
                                || "paragraph".equals(answer.getQuestion().getKind());
                        if (isTextAnswer && answer.getAnswerText() != null && !answer.getAnswerText().isBlank()) {
                            comment = answer.getAnswerText().trim();
                        }
                    }
                }
            }

            String submittedAt = response.getSubmittedAt() != null
                    ? response.getSubmittedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                    : "";

            return new SurveyResponseListItemDto(
                    response.getId(),
                    surveyId,
                    userName,
                    userEmail,
                    avatar,
                    rating,
                    comment,
                    submittedAt
            );
        }).collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QuestionStatisticsDto> getQuestionStatistics(Long surveyId, String interviewerEmail) {
        // Verify interviewer owns this survey
        User interviewer = userRepository.findByEmail(interviewerEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Khảo sát không tồn tại"));

        if (!survey.getUser().getId().equals(interviewer.getId())) {
            throw new RuntimeException("Không có quyền xem thống kê của khảo sát này");
        }

        List<SurveyResponse> responses = surveyResponseRepository.findBySurveyId(surveyId);
        int totalResponses = responses.size();

        List<QuestionStatisticsDto> result = new ArrayList<>();

        // Process each question
        for (Question question : survey.getQuestions()) {
            // Count answers for each option
            Map<String, Integer> optionCounts = new HashMap<>();
            
            for (SurveyResponse response : responses) {
                for (SurveyAnswer answer : response.getAnswers()) {
                    if (answer.getQuestion().getId().equals(question.getId())) {
                        String answerText = answer.getAnswerText();
                        optionCounts.put(answerText, optionCounts.getOrDefault(answerText, 0) + 1);
                    }
                }
            }

            // Build option statistics
            List<OptionStatisticDto> options = new ArrayList<>();
            for (Option option : question.getOptions()) {
                int count = optionCounts.getOrDefault(option.getText(), 0);
                int percentage = totalResponses > 0 ? Math.round((count * 100f) / totalResponses) : 0;
                options.add(new OptionStatisticDto(option.getText(), count, percentage));
            }

            result.add(new QuestionStatisticsDto(
                    question.getId(),
                    question.getTitle(),
                    question.getType(),
                    question.getKind(),
                    totalResponses,
                    options
            ));
        }

        return result;
    }
}
