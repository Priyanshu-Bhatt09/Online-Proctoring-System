package com.example.backend.service;

import com.example.backend.dto.ResultResponseDto;
import com.example.backend.entity.Attempt;
import com.example.backend.repository.AttemptRepository;
import com.example.backend.repository.TestSettingsRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service

public class ResultService {
    private final AttemptRepository attemptRepository;
    private final TestSettingsRepository testSettingsRepository;

    public ResultService(AttemptRepository attemptRepository, TestSettingsRepository testSettingsRepository) {
        this.attemptRepository = attemptRepository;
        this.testSettingsRepository = testSettingsRepository;
    }

    public List<ResultResponseDto> getResultsByExam(Long examId) {
        List<Attempt> attempts = attemptRepository.findByExamIdWithUser(examId);

        List<ResultResponseDto> results = new ArrayList<>();

        // Instructor always sees actual scores — score hiding is only for students
        for (Attempt a : attempts) {
            String studentName = a.getUser() != null ? a.getUser().getName() : null;
            String studentEmail = a.getUser() != null ? a.getUser().getEmail() : null;
            results.add(new ResultResponseDto(
                    a.getId(),
                    studentName,
                    studentEmail,
                    a.getScore(),
                    a.getStartTime(),
                    a.getEndTime()
            ));
        }
        return results;
    }
}
