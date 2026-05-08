package com.example.backend.controller;

import com.example.backend.dto.TestSettingsDto;
import com.example.backend.entity.TestSettings;
import com.example.backend.service.TestSettingsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
public class TestSettingsController {
    private final TestSettingsService testSettingsService;

    public TestSettingsController(TestSettingsService testSettingsService) {
        this.testSettingsService = testSettingsService;
    }

    //save settings
    @PostMapping
    public TestSettingsDto saveSettings(@RequestBody TestSettingsDto dto) {
        TestSettings settings = testSettingsService.saveSettings(dto);
        return toDto(settings);
    }


    //get setting by exam — return DTO to avoid Jackson circular reference (TestSettings↔Exam)
    @GetMapping("/{examId}")
    public TestSettingsDto getSettings(@PathVariable Long examId) {
        TestSettings settings = testSettingsService.getSettings(examId);
        return toDto(settings);
    }

    //publish result — directly update showResult without regenerating test link
    @PostMapping("/{examId}/publish-results")
    public java.util.Map<String, String> publishResults(@PathVariable Long examId) {
        testSettingsService.publishResults(examId);
        return java.util.Map.of("message", "Results published successfully");
    }

    private TestSettingsDto toDto(TestSettings settings) {
        TestSettingsDto dto = new TestSettingsDto();
        dto.setExamId(settings.getExam() != null ? settings.getExam().getId() : null);
        dto.setDuration(settings.getDuration());
        dto.setMaxAttempts(settings.getMaxAttempts());
        dto.setEnableTimer(settings.isEnableTimer());
        dto.setEnableProctor(settings.isEnableProctor());
        dto.setTabSwitch(settings.isTabSwitch());
        dto.setCamera(settings.isCamera());
        dto.setMicrophone(settings.isMicrophone());
        dto.setFullScreen(settings.isFullScreen());
        dto.setMultiMonitor(settings.isMultiMonitor());
        dto.setPhotosRandom(settings.isPhotosRandom());
        dto.setShowResult(settings.getShowResult());
        if (settings.getStartTime() != null) dto.setStartTime(settings.getStartTime().toString());
        if (settings.getEndTime() != null) dto.setEndTime(settings.getEndTime().toString());
        return dto;
    }
}
