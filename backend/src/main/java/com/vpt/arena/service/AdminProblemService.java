package com.vpt.arena.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.admin.AdminProblemDto;
import com.vpt.arena.dto.admin.AdminProblemListResponse;
import com.vpt.arena.dto.admin.AdminProblemRequest;
import com.vpt.arena.dto.admin.AdminProblemTestCaseDto;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.security.CustomUserDetails;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminProblemService {
    private static final int MAX_PAGE_SIZE = 100;

    private final ProblemRepository problemRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public AdminProblemListResponse listProblems(CustomUserDetails principal, String search, Difficulty difficulty,
                                                 Boolean published, int page, int size) {
        requireAdmin(principal);
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(1, Math.min(size, MAX_PAGE_SIZE));
        Page<Problem> problems = problemRepository.findAll(
            problemFilter(blankToNull(search), difficulty, published),
            PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"))
        );
        return new AdminProblemListResponse(
            problems.getContent().stream().map(this::toDto).toList(),
            problems.getNumber(),
            problems.getSize(),
            problems.getTotalElements(),
            problems.getTotalPages()
        );
    }

    @Transactional(readOnly = true)
    public AdminProblemDto getProblem(CustomUserDetails principal, UUID problemId) {
        requireAdmin(principal);
        return toDto(findProblem(problemId));
    }

    @Transactional
    public AdminProblemDto createProblem(CustomUserDetails principal, AdminProblemRequest request) {
        requireAdmin(principal);
        Problem problem = new Problem();
        applyRequest(problem, request);
        return toDto(problemRepository.save(problem));
    }

    @Transactional
    public AdminProblemDto updateProblem(CustomUserDetails principal, UUID problemId, AdminProblemRequest request) {
        requireAdmin(principal);
        Problem problem = findProblem(problemId);
        applyRequest(problem, request);
        return toDto(problemRepository.save(problem));
    }

    @Transactional
    public void deleteProblem(CustomUserDetails principal, UUID problemId) {
        requireAdmin(principal);
        Problem problem = findProblem(problemId);
        try {
            problemRepository.delete(problem);
            problemRepository.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Problem is already used by submissions or battles");
        }
    }

    private Problem findProblem(UUID problemId) {
        return problemRepository.findById(problemId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Problem not found"));
    }

    private void applyRequest(Problem problem, AdminProblemRequest request) {
        problem.setTitle(request.getTitle().trim());
        problem.setDescription(request.getDescription().trim());
        problem.setDifficulty(request.getDifficulty());
        problem.setTopic(request.getTopic().trim());
        problem.setTimeLimitMs(request.getTimeLimitMs());
        problem.setMemoryLimitKb(request.getMemoryLimitKb());
        problem.setTestCases(toTestCasesJson(request.getTestCases()));
        problem.setSolutionCode(blankToNull(request.getSolutionCode()));
        problem.setPublished(request.isPublished());
    }

    private String toTestCasesJson(List<AdminProblemTestCaseDto> testCases) {
        try {
            List<Map<String, Object>> cases = testCases.stream()
                .map(testCase -> Map.<String, Object>of(
                    "input", testCase.getInput(),
                    "expected", testCase.getExpectedOutput(),
                    "hidden", testCase.isHidden()
                ))
                .toList();
            return objectMapper.writeValueAsString(Map.of("cases", cases));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid test cases");
        }
    }

    private List<AdminProblemTestCaseDto> toTestCaseDtos(String testCasesJson) {
        List<AdminProblemTestCaseDto> result = new ArrayList<>();
        try {
            JsonNode cases = objectMapper.readTree(testCasesJson).path("cases");
            if (!cases.isArray()) {
                return result;
            }
            for (JsonNode testCase : cases) {
                result.add(new AdminProblemTestCaseDto(
                    testCase.path("input").asText(""),
                    firstNonBlank(testCase.path("expected").asText(null), testCase.path("expectedOutput").asText("")),
                    testCase.path("hidden").asBoolean(testCase.path("isHidden").asBoolean(false))
                ));
            }
            return result;
        } catch (Exception e) {
            return result;
        }
    }

    private AdminProblemDto toDto(Problem problem) {
        return AdminProblemDto.builder()
            .id(problem.getId())
            .title(problem.getTitle())
            .description(problem.getDescription())
            .difficulty(problem.getDifficulty())
            .topic(problem.getTopic())
            .timeLimitMs(problem.getTimeLimitMs())
            .memoryLimitKb(problem.getMemoryLimitKb())
            .testCases(toTestCaseDtos(problem.getTestCases()))
            .solutionCode(problem.getSolutionCode())
            .published(problem.isPublished())
            .createdAt(problem.getCreatedAt())
            .updatedAt(problem.getUpdatedAt())
            .build();
    }

    private Specification<Problem> problemFilter(String search, Difficulty difficulty, Boolean published) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null) {
                String pattern = "%" + search.toLowerCase(Locale.ROOT) + "%";
                predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("topic")), pattern)
                ));
            }
            if (difficulty != null) {
                predicates.add(criteriaBuilder.equal(root.get("difficulty"), difficulty));
            }
            if (published != null) {
                predicates.add(criteriaBuilder.equal(root.get("isPublished"), published));
            }
            return criteriaBuilder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void requireAdmin(CustomUserDetails principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        boolean admin = principal.getAuthorities().stream()
            .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + Role.ADMIN.name()));
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String firstNonBlank(String first, String second) {
        return first == null || first.isBlank() ? second : first;
    }
}
