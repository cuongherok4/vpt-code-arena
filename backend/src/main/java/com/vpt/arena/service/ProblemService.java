package com.vpt.arena.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.exam.ProblemDetailDto;
import com.vpt.arena.dto.exam.ProblemListItemDto;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private static final int SAMPLE_LIMIT = 2;

    private final ProblemRepository problemRepository;
    private final ObjectMapper objectMapper;

    public List<ProblemListItemDto> findPublished(String difficulty, String topic, String keyword) {
        return problemRepository.findAll(
                publishedProblems(parseDifficulty(difficulty), blankToNull(topic), blankToNull(keyword)),
                Sort.by(Sort.Direction.ASC, "difficulty", "title")
            )
            .stream()
            .map(this::toListItem)
            .toList();
    }

    public ProblemDetailDto getPublished(UUID id) {
        Problem problem = problemRepository.findById(id)
            .filter(Problem::isPublished)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
        return toDetail(problem);
    }

    private ProblemListItemDto toListItem(Problem problem) {
        return new ProblemListItemDto(
            problem.getId(),
            problem.getTitle(),
            problem.getDifficulty(),
            problem.getTopic(),
            problem.getTimeLimitMs(),
            problem.getMemoryLimitKb()
        );
    }

    private ProblemDetailDto toDetail(Problem problem) {
        return new ProblemDetailDto(
            problem.getId(),
            problem.getTitle(),
            problem.getDescription(),
            problem.getDifficulty(),
            problem.getTopic(),
            problem.getTimeLimitMs(),
            problem.getMemoryLimitKb(),
            sampleCases(problem.getTestCases())
        );
    }

    private List<ProblemDetailDto.SampleCaseDto> sampleCases(String testCasesJson) {
        List<ProblemDetailDto.SampleCaseDto> samples = new ArrayList<>();
        try {
            JsonNode cases = objectMapper.readTree(testCasesJson).path("cases");
            if (!cases.isArray()) {
                return samples;
            }
            for (JsonNode testCase : cases) {
                if (samples.size() == SAMPLE_LIMIT) {
                    break;
                }
                samples.add(new ProblemDetailDto.SampleCaseDto(
                    testCase.path("input").asText(""),
                    testCase.path("expected").asText("")
                ));
            }
            return samples;
        } catch (Exception e) {
            return samples;
        }
    }

    private Difficulty parseDifficulty(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Difficulty.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid difficulty");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Specification<Problem> publishedProblems(Difficulty difficulty, String topic, String keyword) {
        return (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isTrue(root.get("isPublished")));

            if (difficulty != null) {
                predicates.add(criteriaBuilder.equal(root.get("difficulty"), difficulty));
            }
            if (topic != null) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("topic")), topic.toLowerCase(Locale.ROOT)));
            }
            if (keyword != null) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), "%" + keyword.toLowerCase(Locale.ROOT) + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
