package com.example.backend.service;

import com.example.backend.dto.TestSettingsDto;
import com.example.backend.entity.Exam;
import com.example.backend.entity.TestSettings;
import com.example.backend.repository.ExamRepository;
import com.example.backend.repository.TestSettingsRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Service
public class TestSettingsService {
    private final TestSettingsRepository settingsRepository;
    private final ExamRepository examRepository;

    public TestSettingsService(TestSettingsRepository settingsRepository,
                               ExamRepository examRepository) {
        this.settingsRepository = settingsRepository;
        this.examRepository = examRepository;
    }

    public TestSettings saveSettings(TestSettingsDto dto) {
        Exam exam = examRepository.findById(dto.getExamId()).orElseThrow();
        
        // Dynamically regenerate test link so old link is invalidated
        exam.setTestLink(java.util.UUID.randomUUID().toString());
        examRepository.save(exam);

        // Update existing or create new
        TestSettings settings = settingsRepository.findByExamId(exam.getId()).orElse(new TestSettings());
        settings.setExam(exam);
        settings.setDuration(dto.getDuration());
        settings.setMaxAttempts(dto.getMaxAttempts());
        settings.setEnableTimer(dto.isEnableTimer());
        settings.setEnableProctor(dto.isEnableProctor());
        settings.setTabSwitch(dto.isTabSwitch());
        settings.setCamera(dto.isCamera());
        settings.setMicrophone(dto.isMicrophone());
        settings.setFullScreen(dto.isFullScreen());
        settings.setMultiMonitor(dto.isMultiMonitor());
        settings.setPhotosRandom(dto.isPhotosRandom());
        settings.setShowResult(dto.getShowResult());

        // Parse startTime and endTime strings
        if (dto.getStartTime() != null && !dto.getStartTime().isEmpty()) {
            settings.setStartTime(parseDateTime(dto.getStartTime()));
        }
        if (dto.getEndTime() != null && !dto.getEndTime().isEmpty()) {
            settings.setEndTime(parseDateTime(dto.getEndTime()));
        }

        return settingsRepository.save(settings);
    }

    private LocalDateTime parseDateTime(String dateTimeStr) {
        try {
            // Try ISO format first (from datetime-local input)
            return LocalDateTime.parse(dateTimeStr);
        } catch (DateTimeParseException e) {
            try {
                // Try with 'T' separator format from HTML inputs
                return LocalDateTime.parse(dateTimeStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            } catch (DateTimeParseException e2) {
                return null;
            }
        }
    }

    public TestSettings getSettings(Long examId) {
        return settingsRepository.findByExamId(examId).orElseThrow();
    }

    /**
     * Publish results: sets showResult to IMMEDIATELY without regenerating the test link.
     */
    public void publishResults(Long examId) {
        TestSettings settings = settingsRepository.findByExamId(examId)
                .orElseThrow(() -> new RuntimeException("Settings not found for exam: " + examId));
        settings.setShowResult("IMMEDIATELY");
        settingsRepository.save(settings);
    }
}
