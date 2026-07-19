package com.vpt.arena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.admin.AdminProblemRequest;
import com.vpt.arena.dto.admin.AdminProblemTestCaseDto;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminProblemService Unit Tests")
class AdminProblemServiceTest {
    @Mock private ProblemRepository problemRepository;

    @Test
    @DisplayName("Admin xem danh sách problem có paging")
    void shouldListProblemsForAdmin() {
        AdminProblemService service = service();
        when(problemRepository.findAll(anySpec(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(problem(UUID.randomUUID(), "Two Sum"))));

        var result = service.listProblems(principal(Role.ADMIN), "sum", Difficulty.EASY, true, 0, 20);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().getFirst().getTitle()).isEqualTo("Two Sum");
        assertThat(result.getItems().getFirst().getTestCases().getFirst().getExpectedOutput()).isEqualTo("3\n");
    }

    @Test
    @DisplayName("Admin tạo problem và lưu test cases đúng format judge")
    void shouldCreateProblem() {
        AdminProblemService service = service();
        when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> {
            Problem saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var result = service.createProblem(principal(Role.ADMIN), request("New Problem"));

        assertThat(result.getTitle()).isEqualTo("New Problem");
        ArgumentCaptor<Problem> captor = ArgumentCaptor.forClass(Problem.class);
        verify(problemRepository).save(captor.capture());
        assertThat(captor.getValue().getTestCases()).contains("\"expected\":\"3\\n\"");
    }

    @Test
    @DisplayName("Admin cập nhật problem")
    void shouldUpdateProblem() {
        AdminProblemService service = service();
        UUID problemId = UUID.randomUUID();
        Problem problem = problem(problemId, "Old");
        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem));
        when(problemRepository.save(any(Problem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.updateProblem(principal(Role.ADMIN), problemId, request("Updated"));

        assertThat(result.getTitle()).isEqualTo("Updated");
        assertThat(problem.getTitle()).isEqualTo("Updated");
    }

    @Test
    @DisplayName("User thường không được quản lý problem")
    void shouldRejectNonAdmin() {
        AdminProblemService service = service();

        assertThatThrownBy(() -> service.createProblem(principal(Role.USER), request("Nope")))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Admin role required");
    }

    @SuppressWarnings("unchecked")
    private Specification<Problem> anySpec() {
        return any(Specification.class);
    }

    private AdminProblemService service() {
        return new AdminProblemService(problemRepository, new ObjectMapper());
    }

    private AdminProblemRequest request(String title) {
        AdminProblemRequest request = new AdminProblemRequest();
        request.setTitle(title);
        request.setDescription("Solve it");
        request.setDifficulty(Difficulty.EASY);
        request.setTopic("Array");
        request.setTimeLimitMs(2000);
        request.setMemoryLimitKb(256000);
        request.setTestCases(List.of(new AdminProblemTestCaseDto("1 2\n", "3\n", false)));
        request.setSolutionCode("print(3)");
        request.setPublished(true);
        return request;
    }

    private Problem problem(UUID id, String title) {
        Problem problem = new Problem();
        problem.setId(id);
        problem.setTitle(title);
        problem.setDescription("Solve it");
        problem.setDifficulty(Difficulty.EASY);
        problem.setTopic("Array");
        problem.setTimeLimitMs(2000);
        problem.setMemoryLimitKb(256000);
        problem.setTestCases("{\"cases\":[{\"input\":\"1 2\\n\",\"expected\":\"3\\n\",\"hidden\":false}]}");
        problem.setSolutionCode("print(3)");
        problem.setPublished(true);
        problem.setCreatedAt(OffsetDateTime.now());
        problem.setUpdatedAt(OffsetDateTime.now());
        return problem;
    }

    private CustomUserDetails principal(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(role.name().toLowerCase() + "@example.com");
        user.setName(role.name());
        user.setRole(role);
        return new CustomUserDetails(user);
    }
}
