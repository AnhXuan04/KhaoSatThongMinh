package com.example.demo.service;

import com.example.demo.dto.SubmitAnswerDto;
import com.example.demo.dto.SubmitSurveyRequest;
import com.example.demo.dto.SurveyHistoryItemDto;
import com.example.demo.dto.SurveyResponseDetailDto;
import com.example.demo.dto.SurveyResponseListItemDto;
import com.example.demo.dto.QuestionStatisticsDto;
import com.example.demo.dto.OptionStatisticDto;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SurveyResponseService {

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

    public List<SurveyHistoryItemDto> getHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return surveyResponseRepository.findByUserId(user.getId())
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

        for (SubmitAnswerDto dto : request.getAnswers()) {
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
        surveyResponseRepository.save(response);
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
