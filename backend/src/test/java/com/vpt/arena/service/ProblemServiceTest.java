package com.vpt.arena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.exam.ProblemDetailDto;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.repository.ProblemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProblemService Unit Tests")
class ProblemServiceTest {

    @Mock private ProblemRepository problemRepository;

    @InjectMocks
    private ProblemService problemService;

    @Test
    @DisplayName("Filter danh sách problem đã publish")
    void shouldFindPublishedProblemsByFilters() {
        Problem problem = problem(UUID.randomUUID(), true);
        when(problemRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(problem));

        assertThat(problemService.findPublished("easy", "math", "sum")).hasSize(1);
    }

    @Test
    @DisplayName("Trả detail kèm sample cases")
    void shouldReturnProblemDetailWithSamples() {
        ReflectionTestUtils.setField(problemService, "objectMapper", new ObjectMapper());
        UUID problemId = UUID.randomUUID();
        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem(problemId, true)));

        ProblemDetailDto detail = problemService.getPublished(problemId);

        assertThat(detail.getTitle()).isEqualTo("Sum");
        assertThat(detail.getSampleCases()).hasSize(2);
        assertThat(detail.getSampleCases().getFirst().getExpected()).isEqualTo("3\n");
    }

    @Test
    @DisplayName("Ẩn problem chưa publish")
    void shouldHideUnpublishedProblem() {
        UUID problemId = UUID.randomUUID();
        when(problemRepository.findById(problemId)).thenReturn(Optional.of(problem(problemId, false)));

        assertThatThrownBy(() -> problemService.getPublished(problemId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Problem not found");
    }

    @Test
    @DisplayName("Reject difficulty không hợp lệ")
    void shouldRejectInvalidDifficulty() {
        assertThatThrownBy(() -> problemService.findPublished("expert", null, null))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Invalid difficulty");

        org.mockito.Mockito.verify(problemRepository, org.mockito.Mockito.never()).findAll(any(Specification.class), any(Sort.class));
    }

    private Problem problem(UUID id, boolean published) {
        Problem problem = new Problem();
        problem.setId(id);
        problem.setTitle("Sum");
        problem.setDescription("Cho hai so, in tong.");
        problem.setDifficulty(Difficulty.EASY);
        problem.setTopic("math");
        problem.setTimeLimitMs(1000);
        problem.setMemoryLimitKb(128000);
        problem.setTestCases("{\"cases\":[{\"input\":\"1 2\\n\",\"expected\":\"3\\n\"},{\"input\":\"4 5\\n\",\"expected\":\"9\\n\"},{\"input\":\"0 0\\n\",\"expected\":\"0\\n\"}]}");
        problem.setPublished(published);
        return problem;
    }
}
