package com.example.demo.service;

import com.example.demo.dto.SubmitAnswerDto;
import com.example.demo.dto.SubmitSurveyRequest;
import com.example.demo.dto.SurveyHistoryItemDto;
import com.example.demo.dto.SurveyQualityAnalyticsDto;
import com.example.demo.dto.SurveyResponseDetailDto;
import com.example.demo.dto.SurveyResponseListItemDto;
import com.example.demo.dto.SurveyContentReportDto;
import com.example.demo.dto.QuestionStatisticsDto;
import com.example.demo.dto.OptionStatisticDto;
import com.example.demo.dto.AiAnalyzeRequestDto;
import com.example.demo.dto.AiAnalyzeResponseDto;
import com.example.demo.dto.AiSurveyReportRequestDto;
import com.example.demo.dto.AiSurveyReportResponseDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
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

    @Autowired
    private SurveyContentReportRepository surveyContentReportRepository;

    @Autowired
    private ObjectMapper reportObjectMapper;

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

        User resolvedUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (surveyResponseRepository.existsBySurveyIdAndUserId(surveyId, resolvedUser.getId())) {
            throw new RuntimeException("Bạn đã thực hiện khảo sát này rồi.");
        }

        SurveyResponse response = new SurveyResponse();
        response.setSurvey(survey);
        response.setUser(resolvedUser);

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
        SurveyResponse savedResponse;
        try {
            savedResponse = surveyResponseRepository.saveAndFlush(response);
        } catch (DataIntegrityViolationException ex) {
            throw new RuntimeException("Bạn đã thực hiện khảo sát này rồi.");
        }
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
            result.setRewardEligible(Boolean.TRUE.equals(dto.getRewardEligible()));
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
    public SurveyContentReportDto getContentReportForSurvey(Long surveyId, String interviewerEmail) {
        User interviewer = userRepository.findByEmail(interviewerEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Khảo sát không tồn tại"));

        if (!survey.getUser().getId().equals(interviewer.getId())) {
            throw new RuntimeException("Không có quyền xem báo cáo khảo sát này");
        }

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát không tồn tại.");
        }

        return surveyContentReportRepository.findBySurveyId(surveyId)
                .map(report -> toContentReportDto(survey, report))
                .orElse(null);
    }

    @Transactional
    public SurveyContentReportDto refreshContentReportForSurvey(Long surveyId, String interviewerEmail) {
        User interviewer = userRepository.findByEmail(interviewerEmail)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Khảo sát không tồn tại"));

        if (!survey.getUser().getId().equals(interviewer.getId())) {
            throw new RuntimeException("Không có quyền xem báo cáo khảo sát này");
        }

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát không tồn tại.");
        }

        List<SurveyResponse> responses = surveyResponseRepository.findBySurveyId(surveyId);
        int totalResponses = responses.size();
        java.util.Set<Long> eligibleResponseIds = aiAnalysisResultRepository.findRecentBySurveyId(surveyId)
                .stream()
                .filter(result -> !Boolean.TRUE.equals(result.getSuperficial()))
                .map(result -> result.getResponse() != null ? result.getResponse().getId() : null)
                .filter(id -> id != null)
                .collect(java.util.stream.Collectors.toSet());
        List<SurveyResponse> reportResponses = responses.stream()
                .filter(response -> eligibleResponseIds.contains(response.getId()))
                .collect(java.util.stream.Collectors.toList());
        int eligibleResponses = reportResponses.size();
        int excludedResponses = Math.max(0, totalResponses - eligibleResponses);

        Map<Long, List<SurveyAnswer>> answersByQuestion = new HashMap<>();
        for (SurveyResponse response : reportResponses) {
            if (response.getAnswers() == null) {
                continue;
            }
            for (SurveyAnswer answer : response.getAnswers()) {
                if (answer.getQuestion() == null || answer.getQuestion().getId() == null) {
                    continue;
                }
                answersByQuestion.computeIfAbsent(answer.getQuestion().getId(), key -> new ArrayList<>()).add(answer);
            }
        }

        List<SurveyContentReportDto.QuestionReportDto> questionReports = new ArrayList<>();

        List<Question> questions = survey.getQuestions() != null ? new ArrayList<>(survey.getQuestions()) : List.of();
        questions.sort(java.util.Comparator.comparing(Question::getQuestionOrder, java.util.Comparator.nullsLast(Integer::compareTo)));

        for (Question question : questions) {
            List<SurveyAnswer> questionAnswers = answersByQuestion.getOrDefault(question.getId(), List.of());
            SurveyContentReportDto.QuestionReportDto report = buildQuestionContentReport(question, questionAnswers, eligibleResponses);
            questionReports.add(report);
        }

        AiSurveyReportResponseDto aiReport = aiAnalysisClient.generateSurveyReport(
                buildAiSurveyReportRequest(survey, totalResponses, eligibleResponses, excludedResponses, questionReports)
        ).orElseThrow(() -> new RuntimeException("AI service chưa tạo được báo cáo khảo sát."));

        List<String> highlights = aiReport.getHighlights() != null ? aiReport.getHighlights() : List.of();
        String plainText = aiReport.getPlainText();
        if (plainText == null) plainText = "";

        SurveyContentReportDto dto = new SurveyContentReportDto(
                survey.getId(),
                survey.getTitle(),
                totalResponses,
                eligibleResponses,
                excludedResponses,
                java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                aiReport.getExecutiveSummary(),
                aiReport.getRespondentSummary(),
                aiReport.getAnswerSummary(),
                aiReport.getRecommendation(),
                highlights,
                questionReports,
                plainText
        );

        return saveContentReport(survey, interviewer, dto);
    }

    private SurveyContentReportDto saveContentReport(Survey survey, User generatedBy, SurveyContentReportDto dto) {
        SurveyContentReport report = surveyContentReportRepository.findBySurveyId(survey.getId())
                .orElseGet(SurveyContentReport::new);

        report.setSurvey(survey);
        report.setGeneratedByUser(generatedBy);
        report.setTotalResponses(dto.getTotalResponses());
        report.setEligibleResponses(dto.getEligibleResponses());
        report.setExcludedResponses(dto.getExcludedResponses());
        report.setExecutiveSummary(dto.getExecutiveSummary());
        report.setRespondentSummary(dto.getRespondentSummary());
        report.setAnswerSummary(dto.getAnswerSummary());
        report.setRecommendation(dto.getRecommendation());
        report.setHighlightsJson(writeJson(dto.getHighlights()));
        report.setQuestionReportsJson(writeJson(dto.getQuestionReports()));
        report.setPlainText(dto.getPlainText());

        SurveyContentReport saved = surveyContentReportRepository.save(report);
        return toContentReportDto(survey, saved);
    }

    private SurveyContentReportDto toContentReportDto(Survey survey, SurveyContentReport report) {
        List<String> highlights = readStringList(report.getHighlightsJson());
        List<SurveyContentReportDto.QuestionReportDto> questionReports = readQuestionReports(report.getQuestionReportsJson());
        String generatedAt = report.getGeneratedAt() != null
                ? report.getGeneratedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "";

        return new SurveyContentReportDto(
                survey.getId(),
                survey.getTitle(),
                report.getTotalResponses() != null ? report.getTotalResponses() : 0,
                report.getEligibleResponses() != null ? report.getEligibleResponses() : report.getTotalResponses() != null ? report.getTotalResponses() : 0,
                report.getExcludedResponses() != null ? report.getExcludedResponses() : 0,
                generatedAt,
                report.getExecutiveSummary(),
                report.getRespondentSummary(),
                report.getAnswerSummary(),
                report.getRecommendation(),
                highlights,
                questionReports,
                report.getPlainText()
        );
    }

    private String writeJson(Object value) {
        try {
            return reportObjectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new RuntimeException("Không thể lưu dữ liệu báo cáo dạng JSON.", ex);
        }
    }

    private List<SurveyContentReportDto.QuestionReportDto> readQuestionReports(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return reportObjectMapper.readValue(json, new TypeReference<List<SurveyContentReportDto.QuestionReportDto>>() {});
        } catch (Exception ex) {
            log.warn("Cannot parse survey content report questionReportsJson: {}", ex.getMessage());
            return List.of();
        }
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return reportObjectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            log.warn("Cannot parse survey content report string list JSON: {}", ex.getMessage());
            return List.of();
        }
    }

    private AiSurveyReportRequestDto buildAiSurveyReportRequest(
            Survey survey,
            int totalResponses,
            int eligibleResponses,
            int excludedResponses,
            List<SurveyContentReportDto.QuestionReportDto> questionReports) {
        String fieldName = survey.getSurveyField() != null ? survey.getSurveyField().getName() : "";
        return new AiSurveyReportRequestDto(
                new AiSurveyReportRequestDto.SurveyInfoDto(
                        survey.getId(),
                        survey.getTitle(),
                        survey.getDescription(),
                        fieldName
                ),
                totalResponses,
                eligibleResponses,
                excludedResponses,
                questionReports
        );
    }

    private SurveyContentReportDto.QuestionReportDto buildQuestionContentReport(
            Question question,
            List<SurveyAnswer> answers,
            int totalResponses) {
        String type = question.getType() != null ? question.getType() : "";
        String kind = question.getKind() != null ? question.getKind() : "";
        String normalizedKind = !kind.isBlank() ? kind : type;

        if ("rating".equals(normalizedKind) || "linear_scale".equals(normalizedKind)) {
            return buildNumericQuestionReport(question, answers, normalizedKind);
        }

        if ("file_upload".equals(normalizedKind) || "file_upload".equals(type)) {
            int fileCount = (int) answers.stream()
                    .filter(answer -> answer.getSecureUrl() != null && !answer.getSecureUrl().isBlank())
                    .count();
            return new SurveyContentReportDto.QuestionReportDto(
                    question.getId(), question.getTitle(), type, kind, fileCount, "",
                    "",
                    List.of(), null, List.of(), List.of()
            );
        }

        if (isTextQuestion(type, normalizedKind)) {
            return buildTextQuestionReport(question, answers, type, kind);
        }

        return buildChoiceQuestionReport(question, answers, totalResponses, type, kind, normalizedKind);
    }

    private SurveyContentReportDto.QuestionReportDto buildChoiceQuestionReport(
            Question question,
            List<SurveyAnswer> answers,
            int totalResponses,
            String type,
            String kind,
            String normalizedKind) {
        Map<String, Integer> counts = new HashMap<>();
        List<Option> options = question.getOptions() != null ? question.getOptions() : List.of();
        for (Option option : options) {
            counts.put(option.getText(), 0);
        }
        for (SurveyAnswer answer : answers) {
            String value = answer.getAnswerText();
            if (value == null || value.isBlank()) {
                continue;
            }
            counts.put(value, counts.getOrDefault(value, 0) + 1);
        }

        boolean checkbox = "checkbox".equals(type) || "checkbox".equals(normalizedKind);
        int denominator = checkbox ? totalResponses : Math.max(1, answers.size());
        List<SurveyContentReportDto.OptionInsightDto> optionInsights = counts.entrySet().stream()
                .map(entry -> new SurveyContentReportDto.OptionInsightDto(
                        entry.getKey(),
                        entry.getValue(),
                        denominator > 0 ? Math.round((entry.getValue() * 100f) / denominator) : 0
                ))
                .sorted(java.util.Comparator.comparing(SurveyContentReportDto.OptionInsightDto::getCount).reversed())
                .collect(java.util.stream.Collectors.toList());

        return new SurveyContentReportDto.QuestionReportDto(
                question.getId(), question.getTitle(), type, kind, answers.size(), "", "",
                optionInsights, null, List.of(), List.of()
        );
    }

    private SurveyContentReportDto.QuestionReportDto buildNumericQuestionReport(
            Question question,
            List<SurveyAnswer> answers,
            String normalizedKind) {
        List<Integer> values = answers.stream()
                .map(SurveyAnswer::getAnswerText)
                .filter(value -> value != null && !value.isBlank())
                .map(value -> {
                    try {
                        return Integer.parseInt(value.trim());
                    } catch (NumberFormatException ex) {
                        return null;
                    }
                })
                .filter(value -> value != null)
                .collect(java.util.stream.Collectors.toList());

        int total = values.size();
        Map<String, Integer> counts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            counts.put(String.valueOf(i), 0);
        }
        for (Integer value : values) {
            counts.put(String.valueOf(value), counts.getOrDefault(String.valueOf(value), 0) + 1);
        }
        List<SurveyContentReportDto.OptionInsightDto> optionInsights = counts.entrySet().stream()
                .map(entry -> new SurveyContentReportDto.OptionInsightDto(
                        entry.getKey(), entry.getValue(), total > 0 ? Math.round((entry.getValue() * 100f) / total) : 0))
                .sorted(java.util.Comparator.comparing(SurveyContentReportDto.OptionInsightDto::getLabel))
                .collect(java.util.stream.Collectors.toList());

        Double average = total > 0
                ? values.stream().mapToInt(Integer::intValue).average().orElse(0)
                : null;
        return new SurveyContentReportDto.QuestionReportDto(
                question.getId(), question.getTitle(), question.getType(), question.getKind(), total,
                "", "", optionInsights, average, List.of(), List.of()
        );
    }

    private SurveyContentReportDto.QuestionReportDto buildTextQuestionReport(
            Question question,
            List<SurveyAnswer> answers,
            String type,
            String kind) {
        List<String> texts = answers.stream()
                .map(SurveyAnswer::getAnswerText)
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(java.util.stream.Collectors.toList());
        List<String> notableAnswers = texts.stream().limit(5).collect(java.util.stream.Collectors.toList());

        return new SurveyContentReportDto.QuestionReportDto(
                question.getId(), question.getTitle(), type, kind, texts.size(), "", "",
                List.of(), null, notableAnswers, List.of()
        );
    }

    private boolean isTextQuestion(String type, String kind) {
        return "short_text".equals(type)
                || "short_answer".equals(kind)
                || "paragraph".equals(kind);
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
