package com.example.demo.service;

import com.example.demo.dto.OptionRequest;
import com.example.demo.dto.QuestionRequest;
import com.example.demo.dto.SurveyRequest;
import com.example.demo.dto.SurveyListDto;
import com.example.demo.entity.Option;
import com.example.demo.entity.Question;
import com.example.demo.entity.Survey;
import com.example.demo.entity.User;
import com.example.demo.entity.SurveyField;
import com.example.demo.repository.SurveyRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.repository.SurveyFieldRepository;
import com.example.demo.repository.SurveyResponseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SurveyService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SurveyRepository surveyRepository;
    @Autowired
    private SurveyFieldRepository surveyFieldRepository;

    @Autowired
    private SurveyResponseRepository surveyResponseRepository;

    public Survey createSurvey(String email, SurveyRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isPremium()) {
            throw new RuntimeException("Tài khoản của bạn chưa được nâng cấp để tạo khảo sát.");
        }

        // Load survey field
        SurveyField surveyField = null;
        if (request.getSurveyFieldId() != null) {
            surveyField = surveyFieldRepository.findById(request.getSurveyFieldId())
                    .orElseThrow(() -> new RuntimeException("Survey field not found"));
        }

        // Logic to create a survey
        Survey survey = new Survey();
        survey.setTitle(request.getTitle());
        survey.setDescription(request.getDescription());
        survey.setSurveyField(surveyField);
        survey.setUser(user);

        List<Question> questionList = new ArrayList<>();

        int qOrder = 1;

        for (QuestionRequest qReq : request.getQuestions()) {

            Question question = new Question();
            question.setTitle(qReq.getTitle());
            question.setType(qReq.getType());
            question.setKind(qReq.getKind());
            question.setRequired(qReq.getRequired());
            question.setMaxFileSizeMb(qReq.getMaxFileSizeMb());
            question.setMaxFileCount(qReq.getMaxFileCount());
            question.setMediaUrl(qReq.getMediaUrl());
            question.setQuestionOrder(qOrder++);
            question.setSurvey(survey);

            // OPTIONS
            if (!qReq.getType().equals("short_text")) {
                List<Option> options = new ArrayList<>();
                int oOrder = 1;

                for (OptionRequest oReq : qReq.getOptions()) {
                    Option option = new Option();
                    option.setText(oReq.getText());
                    option.setOptionOrder(oOrder++);
                    option.setQuestion(question);

                    options.add(option);
                }

                question.setOptions(options);
            }

            questionList.add(question);
        }

        // Update the managed questions collection to avoid JPA orphanRemoval issues
        List<Question> existingQuestions = survey.getQuestions();
        if (existingQuestions == null) {
            survey.setQuestions(questionList);
        } else {
            existingQuestions.clear();
            for (Question q : questionList) {
                existingQuestions.add(q);
            }
        }

        return surveyRepository.save(survey);
    }

    public List<SurveyListDto> getAllSurveys() {
        List<Survey> surveys = surveyRepository.findByIsDeletedFalseOrderByCreatedAtDesc();
        return surveys.stream()
                .map(SurveyListDto::fromSurvey)
                .collect(Collectors.toList());
    }

    public List<SurveyListDto> getCompletedSurveys(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Long> completedIds = surveyResponseRepository.findCompletedSurveyIdsByUserId(user.getId());
        if (completedIds.isEmpty()) return Collections.emptyList();
        return completedIds.stream()
                .distinct()
                .map(id -> surveyRepository.findById(id).orElse(null))
                .filter(s -> s != null && !Boolean.TRUE.equals(s.getIsDeleted()))
                .map(SurveyListDto::fromSurvey)
                .collect(Collectors.toList());
    }

    public List<SurveyListDto> getUserSurveys(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Survey> surveys = surveyRepository.findByUserAndIsDeletedFalseOrderByCreatedAtDesc(user);
        return surveys.stream()
                .map(SurveyListDto::fromSurvey)
                .collect(Collectors.toList());
    }

    public Survey updateSurvey(String email, Long surveyId, SurveyRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Survey not found"));

        if (!survey.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Không có quyền chỉnh sửa khảo sát này.");
        }

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát đã bị xóa.");
        }

        survey.setTitle(request.getTitle());
        survey.setDescription(request.getDescription());

        SurveyField surveyField = null;
        if (request.getSurveyFieldId() != null) {
            surveyField = surveyFieldRepository.findById(request.getSurveyFieldId())
                    .orElseThrow(() -> new RuntimeException("Survey field not found"));
        }
        survey.setSurveyField(surveyField);

        List<Question> questionList = new ArrayList<>();
        int qOrder = 1;

        for (QuestionRequest qReq : request.getQuestions()) {
            Question question = new Question();
            question.setTitle(qReq.getTitle());
            question.setType(qReq.getType());
            question.setKind(qReq.getKind());
            question.setRequired(qReq.getRequired());
            question.setMaxFileSizeMb(qReq.getMaxFileSizeMb());
            question.setMaxFileCount(qReq.getMaxFileCount());
            question.setMediaUrl(qReq.getMediaUrl());
            question.setQuestionOrder(qOrder++);
            question.setSurvey(survey);

            if (!qReq.getType().equals("short_text")) {
                List<Option> options = new ArrayList<>();
                int oOrder = 1;
                for (OptionRequest oReq : qReq.getOptions()) {
                    Option option = new Option();
                    option.setText(oReq.getText());
                    option.setOptionOrder(oOrder++);
                    option.setQuestion(question);
                    options.add(option);
                }
                question.setOptions(options);
            }

            questionList.add(question);
        }

        List<Question> existingQuestions = survey.getQuestions();
        if (existingQuestions == null) {
            survey.setQuestions(questionList);
        } else {
            existingQuestions.clear();
            for (Question q : questionList) {
                existingQuestions.add(q);
            }
        }

        return surveyRepository.save(survey);
    }

    public void softDeleteSurvey(String email, Long surveyId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Survey not found"));

        if (!survey.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Không có quyền xóa khảo sát này.");
        }

        survey.setIsDeleted(true);
        surveyRepository.save(survey);
    }

    public SurveyRequest getSurveyForView(Long surveyId) {
        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Survey not found"));

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát không tồn tại.");
        }

        SurveyRequest dto = new SurveyRequest();
        dto.setTitle(survey.getTitle());
        dto.setDescription(survey.getDescription());
        dto.setSurveyFieldId(survey.getSurveyField() != null ? survey.getSurveyField().getId() : null);

        List<QuestionRequest> qList = new ArrayList<>();
        if (survey.getQuestions() != null) {
            for (Question q : survey.getQuestions()) {
                QuestionRequest qr = new QuestionRequest();
                qr.setId(q.getId());
                qr.setTitle(q.getTitle());
                qr.setType(q.getType());
                qr.setKind(q.getKind());
                qr.setRequired(q.getRequired());
                qr.setMaxFileSizeMb(q.getMaxFileSizeMb());
                qr.setMaxFileCount(q.getMaxFileCount());
                qr.setMediaUrl(q.getMediaUrl());

                List<OptionRequest> opts = new ArrayList<>();
                if (q.getOptions() != null) {
                    for (Option o : q.getOptions()) {
                        OptionRequest or = new OptionRequest();
                        or.setText(o.getText());
                        opts.add(or);
                    }
                }
                qr.setOptions(opts);
                qList.add(qr);
            }
        }
        dto.setQuestions(qList);
        return dto;
    }

    public SurveyRequest getSurveyForEdit(String email, Long surveyId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Survey survey = surveyRepository.findById(surveyId)
                .orElseThrow(() -> new RuntimeException("Survey not found"));

        if (!survey.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Không có quyền xem khảo sát này.");
        }

        if (Boolean.TRUE.equals(survey.getIsDeleted())) {
            throw new RuntimeException("Khảo sát đã bị xóa.");
        }

        SurveyRequest dto = new SurveyRequest();
        dto.setTitle(survey.getTitle());
        dto.setDescription(survey.getDescription());
        dto.setSurveyFieldId(survey.getSurveyField() != null ? survey.getSurveyField().getId() : null);

        List<QuestionRequest> qList = new ArrayList<>();
        if (survey.getQuestions() != null) {
            for (Question q : survey.getQuestions()) {
                QuestionRequest qr = new QuestionRequest();
                qr.setTitle(q.getTitle());
                qr.setType(q.getType());
                qr.setKind(q.getKind());
                qr.setRequired(q.getRequired());
                qr.setMaxFileSizeMb(q.getMaxFileSizeMb());
                qr.setMaxFileCount(q.getMaxFileCount());
                qr.setMediaUrl(q.getMediaUrl());

                List<OptionRequest> opts = new ArrayList<>();
                if (q.getOptions() != null) {
                    for (Option o : q.getOptions()) {
                        OptionRequest or = new OptionRequest();
                        or.setText(o.getText());
                        opts.add(or);
                    }
                }

                qr.setOptions(opts);
                qList.add(qr);
            }
        }

        dto.setQuestions(qList);
        return dto;
    }
}

