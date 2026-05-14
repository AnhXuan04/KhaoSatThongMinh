package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.SurveyService;
import com.example.demo.service.SurveyResponseService;
import com.example.demo.service.CloudinaryService;
import com.example.demo.entity.SurveyField;
import com.example.demo.repository.SurveyFieldRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/surveys")
public class SurveyController {

    @Autowired
    private SurveyService surveyService;

    @Autowired
    private SurveyResponseService surveyResponseService;

    @Autowired
    private SurveyFieldRepository surveyFieldRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    @PostMapping("/create")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<String> createSurvey(@RequestBody SurveyRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        String email = auth.getName();

        try {
            surveyService.createSurvey(email, request);
            return ResponseEntity.ok("Tạo khảo sát thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }

    @GetMapping("/history")
    @PreAuthorize("hasAuthority('INTERVIEWEE')")
    public ResponseEntity<List<SurveyHistoryItemDto>> getSurveyHistory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        try {
            return ResponseEntity.ok(surveyResponseService.getHistory(email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/responses/{responseId}")
    @PreAuthorize("hasAuthority('INTERVIEWEE') or hasAuthority('INTERVIEWER')")
    public ResponseEntity<SurveyResponseDetailDto> getResponseDetail(@PathVariable("responseId") Long responseId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        try {
            return ResponseEntity.ok(surveyResponseService.getResponseDetail(responseId, email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/completed")
    @PreAuthorize("hasAuthority('INTERVIEWEE')")
    public ResponseEntity<List<SurveyListDto>> getCompletedSurveys() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        try {
            return ResponseEntity.ok(surveyService.getCompletedSurveys(email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<SurveyListDto>> getAllSurveys() {
        try {
            List<SurveyListDto> surveys = surveyService.getAllSurveys();
            return ResponseEntity.ok(surveys);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/view/{id}")
    public ResponseEntity<SurveyRequest> getSurveyPublic(@PathVariable("id") Long id) {
        try {
            SurveyRequest dto = surveyService.getSurveyForView(id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{id}/responses")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<List<SurveyResponseListItemDto>> getSurveyResponses(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            List<SurveyResponseListItemDto> responses = surveyResponseService.getResponsesForSurvey(id, email);
            return ResponseEntity.ok(responses);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{id}/statistics")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<List<com.example.demo.dto.QuestionStatisticsDto>> getSurveyStatistics(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            List<com.example.demo.dto.QuestionStatisticsDto> stats = surveyResponseService.getQuestionStatistics(id, email);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/{id}/responses")
    public ResponseEntity<String> submitResponse(
            @PathVariable("id") Long id,
            @RequestBody SubmitSurveyRequest request,
            Authentication auth) {
        try {
            String email = (auth != null) ? auth.getName() : null;
            surveyResponseService.submitResponse(id, request, email);
            return ResponseEntity.ok("Gửi phản hồi thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/upload/file")
    public ResponseEntity<Map<String, Object>> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File trống"));
            }
            // Allow common file types that Cloudinary can store and Google Viewer can preview.
            String original = file.getOriginalFilename();
            String contentType = file.getContentType();
            boolean isAllowed = isAllowedUploadType(original, contentType);
            if (!isAllowed) {
                return ResponseEntity.badRequest().body(Map.of("error", "Chỉ hỗ trợ PDF, Word, Excel, PowerPoint và ảnh"));
            }

            Map<String, Object> result = cloudinaryService.uploadFile(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi tải tệp: " + e.getMessage()));
        }
    }

    private boolean isAllowedUploadType(String originalFilename, String contentType) {
        String lowerName = originalFilename != null ? originalFilename.toLowerCase() : "";
        if (lowerName.endsWith(".pdf") || lowerName.endsWith(".doc") || lowerName.endsWith(".docx")
                || lowerName.endsWith(".xls") || lowerName.endsWith(".xlsx")
                || lowerName.endsWith(".ppt") || lowerName.endsWith(".pptx")
                || lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
            return true;
        }

        if (contentType == null) {
            return false;
        }

        return contentType.equalsIgnoreCase("application/pdf")
                || contentType.equalsIgnoreCase("application/msword")
                || contentType.equalsIgnoreCase("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                || contentType.equalsIgnoreCase("application/vnd.ms-excel")
                || contentType.equalsIgnoreCase("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                || contentType.equalsIgnoreCase("application/vnd.ms-powerpoint")
                || contentType.equalsIgnoreCase("application/vnd.openxmlformats-officedocument.presentationml.presentation")
                || contentType.equalsIgnoreCase("image/png")
                || contentType.equalsIgnoreCase("image/jpeg");
    }

    @GetMapping("/my")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<List<SurveyListDto>> getUserSurveys() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            List<SurveyListDto> surveys = surveyService.getUserSurveys(email);
            return ResponseEntity.ok(surveys);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<String> updateSurvey(@PathVariable("id") Long id, @RequestBody SurveyRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            surveyService.updateSurvey(email, id, request);
            return ResponseEntity.ok("Cập nhật khảo sát thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<String> deleteSurvey(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            surveyService.softDeleteSurvey(email, id);
            return ResponseEntity.ok("Xóa khảo sát thành công.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<SurveyRequest> getSurvey(@PathVariable("id") Long id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();

        try {
            SurveyRequest dto = surveyService.getSurveyForEdit(email, id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/fields/list")
    @PreAuthorize("hasAuthority('INTERVIEWER')")
    public ResponseEntity<List<SurveyField>> getSurveyFields() {
        try {
            List<SurveyField> fields = surveyFieldRepository.findByIsDeletedFalse();
            return ResponseEntity.ok(fields);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
