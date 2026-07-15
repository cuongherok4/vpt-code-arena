package com.vpt.arena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.learn.RunCodeRequest;
import com.vpt.arena.dto.learn.RunCodeResponse;
import com.vpt.arena.entity.Chapter;
import com.vpt.arena.entity.Lesson;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.UserProgress;
import com.vpt.arena.repository.LessonRepository;
import com.vpt.arena.repository.UserProgressRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProgressService Unit Tests")
class ProgressServiceTest {

    @Mock private UserProgressRepository userProgressRepository;
    @Mock private LessonRepository lessonRepository;
    @Mock private UserRepository userRepository;
    @Mock private RestTemplate restTemplate;

    @InjectMocks
    private ProgressService progressService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(progressService, "objectMapper", objectMapper);
        ReflectionTestUtils.setField(progressService, "judge0Url", "http://localhost:2358");
        ReflectionTestUtils.setField(progressService, "judge0PollIntervalMs", 1L);
        ReflectionTestUtils.setField(progressService, "judge0TimeoutMs", 1000L);
        ReflectionTestUtils.setField(progressService, "judge0DefaultMemoryLimitKb", 256000);
        ReflectionTestUtils.setField(progressService, "judge0JavaMemoryLimitKb", 2048000);
        ReflectionTestUtils.setField(progressService, "judge0JavaMaxProcessesAndThreads", 512);
    }

    // ─── Fixtures ─────────────────────────────────────────────────────────────

    private Lesson buildLesson(boolean hasChallenge, String testCasesJson) {
        Chapter chapter = new Chapter();
        chapter.setId(UUID.randomUUID());

        Lesson lesson = new Lesson();
        lesson.setId(UUID.randomUUID());
        lesson.setTitle("Test Lesson");
        lesson.setContent("Content");
        lesson.setOrder(1);
        lesson.setHasChallenge(hasChallenge);
        lesson.setChallengeTestCases(testCasesJson);
        lesson.setChapter(chapter);
        return lesson;
    }

    private User buildUser() {
        User user = new User();
        user.setId(UUID.randomUUID());
        return user;
    }

    private RunCodeRequest buildRequest() {
        RunCodeRequest req = new RunCodeRequest();
        req.setSourceCode("System.out.println(\"Hello\");");
        req.setLanguageId(62);
        return req;
    }

    private String judge0Token() {
        return "{\"token\":\"token-123\"}";
    }

    private String judge0Response(String status, String stdout) {
        return String.format(
            "{\"status\":{\"description\":\"%s\"},\"stdout\":\"%s\",\"stderr\":null,\"compile_output\":null,\"time\":\"0.1\",\"memory\":\"1024\"}",
            status, stdout
        );
    }

    // ─── markCompleted ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("markCompleted")
    class MarkCompleted {

        @Test
        @DisplayName("Tạo mới UserProgress khi chưa có")
        void shouldCreateProgressWhenNotExists() {
            UUID userId = UUID.randomUUID();
            Lesson lesson = buildLesson(false, null);
            User user = buildUser();

            when(lessonRepository.findByIdWithChapter(lesson.getId())).thenReturn(Optional.of(lesson));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(userProgressRepository.findByUserIdAndLessonId(userId, lesson.getId())).thenReturn(Optional.empty());

            progressService.markCompleted(userId, lesson.getId());

            ArgumentCaptor<UserProgress> captor = ArgumentCaptor.forClass(UserProgress.class);
            verify(userProgressRepository).save(captor.capture());
            assertThat(captor.getValue().isCompleted()).isTrue();
            assertThat(captor.getValue().getCompletedAt()).isNotNull();
        }

        @Test
        @DisplayName("Cập nhật UserProgress khi đã tồn tại")
        void shouldUpdateExistingProgress() {
            UUID userId = UUID.randomUUID();
            Lesson lesson = buildLesson(false, null);
            User user = buildUser();
            UserProgress existing = new UserProgress();
            existing.setCompleted(false);

            when(lessonRepository.findByIdWithChapter(lesson.getId())).thenReturn(Optional.of(lesson));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(userProgressRepository.findByUserIdAndLessonId(userId, lesson.getId())).thenReturn(Optional.of(existing));

            progressService.markCompleted(userId, lesson.getId());

            verify(userProgressRepository).save(existing);
            assertThat(existing.isCompleted()).isTrue();
        }

        @Test
        @DisplayName("Throw 404 khi lesson không tồn tại")
        void shouldThrow404WhenLessonNotFound() {
            UUID userId = UUID.randomUUID();
            UUID lessonId = UUID.randomUUID();
            when(lessonRepository.findByIdWithChapter(lessonId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> progressService.markCompleted(userId, lessonId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Lesson not found");
        }
    }

    // ─── runCode ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("runCode")
    class RunCode {

        @Test
        @DisplayName("Trả về passed=true khi Judge0 trả Accepted")
        void shouldReturnPassedWhenAccepted() {
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));

            RunCodeResponse res = progressService.runCode(buildRequest(), null);

            assertThat(res.getPassed()).isTrue();
            assertThat(res.getStatus()).isEqualTo("Accepted");
            assertThat(res.getTime()).isEqualTo("0.1");
            assertThat(res.getMemory()).isEqualTo("1024");
        }

        @Test
        @DisplayName("Trả về passed=false khi Judge0 trả Wrong Answer")
        void shouldReturnFailedWhenWrongAnswer() {
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Wrong Answer", "")));

            RunCodeResponse res = progressService.runCode(buildRequest(), null);

            assertThat(res.getPassed()).isFalse();
            assertThat(res.getStatus()).isEqualTo("Wrong Answer");
        }

        @Test
        @DisplayName("Trả về stderr khi Judge0 có lỗi compile")
        void shouldReturnStderrWhenCompileError() {
            String compileErr = "{\"status\":{\"description\":\"Compilation Error\"},\"stdout\":null,\"stderr\":null,\"compile_output\":\"error msg\",\"time\":null,\"memory\":null}";
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(compileErr));

            RunCodeResponse res = progressService.runCode(buildRequest(), null);

            assertThat(res.getPassed()).isFalse();
            assertThat(res.getStatus()).isEqualTo("Compilation Error");
            assertThat(res.getCompileOutput()).isEqualTo("error msg");
        }

        @Test
        @DisplayName("Decode compile output base64 có xuống dòng từ Judge0")
        void shouldDecodeMultilineBase64CompileOutput() {
            String compileErr = "{\"status\":{\"description\":\"Compilation Error\"},\"stdout\":null,\"stderr\":null,"
                + "\"compile_output\":\"ZXJyb3I6IGV4cGVjdGVkIDsK\\nbWFpbi5jOjM6MjY=\",\"time\":null,\"memory\":null}";
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(compileErr));

            RunCodeResponse res = progressService.runCode(buildRequest(), null);

            assertThat(res.getPassed()).isFalse();
            assertThat(res.getCompileOutput()).isEqualTo("error: expected ;\nmain.c:3:26");
        }

        @Test
        @DisplayName("Gửi flags tránh cgroup v1 khi chạy trong Docker Desktop")
        void shouldDisableJudge0CgroupModeForDockerDesktopCompatibility() throws Exception {
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));

            progressService.runCode(buildRequest(), null);

            ArgumentCaptor<HttpEntity<String>> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).postForEntity(anyString(), captor.capture(), eq(String.class));

            var root = objectMapper.readTree(captor.getValue().getBody());
            assertThat(root.get("enable_per_process_and_thread_time_limit").asBoolean()).isTrue();
            assertThat(root.get("enable_per_process_and_thread_memory_limit").asBoolean()).isTrue();
        }

        @Test
        @DisplayName("Gửi memory limit cao hơn cho Java để JVM khởi động được")
        void shouldUseHigherMemoryLimitForJava() throws Exception {
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));

            progressService.runCode(buildRequest(), null);

            ArgumentCaptor<HttpEntity<String>> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).postForEntity(anyString(), captor.capture(), eq(String.class));

            var root = objectMapper.readTree(captor.getValue().getBody());
            assertThat(root.get("memory_limit").asInt()).isEqualTo(2048000);
        }

        @Test
        @DisplayName("Gửi JVM compiler options nhỏ hơn cho Java")
        void shouldSendJavaCompilerOptions() throws Exception {
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));

            progressService.runCode(buildRequest(), null);

            ArgumentCaptor<HttpEntity<String>> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).postForEntity(anyString(), captor.capture(), eq(String.class));

            var root = objectMapper.readTree(captor.getValue().getBody());
            assertThat(root.get("max_processes_and_or_threads").asInt()).isEqualTo(512);
            assertThat(root.get("compiler_options").asText())
                .contains("-J-Xmx256m")
                .contains("-J-XX:MaxMetaspaceSize=256m");
        }

        @Test
        @DisplayName("Giữ memory limit mặc định cho C/Python")
        void shouldUseDefaultMemoryLimitForNonJava() throws Exception {
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));
            RunCodeRequest cRequest = buildRequest();
            cRequest.setLanguageId(50);

            progressService.runCode(cRequest, null);

            ArgumentCaptor<HttpEntity<String>> captor = ArgumentCaptor.forClass(HttpEntity.class);
            verify(restTemplate).postForEntity(anyString(), captor.capture(), eq(String.class));

            var root = objectMapper.readTree(captor.getValue().getBody());
            assertThat(root.get("memory_limit").asInt()).isEqualTo(256000);
        }

        @Test
        @DisplayName("Throw 500 khi Judge0 không kết nối được")
        void shouldThrow500WhenJudge0Fails() {
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenThrow(new ResourceAccessException("Connection refused"));

            assertThatThrownBy(() -> progressService.runCode(buildRequest(), null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Judge0 service is unavailable");
        }
    }

    // ─── submitChallenge ──────────────────────────────────────────────────────

    @Nested
    @DisplayName("submitChallenge")
    class SubmitChallenge {

        private static final String TEST_CASES_JSON = "{\"cases\":[{\"expected\":\"Hello\\n\"},{\"expected\":\"Hello\\n\"}]}";

        @Test
        @DisplayName("Lưu progress khi tất cả test cases pass")
        void shouldSaveProgressWhenAllCasesPass() {
            UUID userId = UUID.randomUUID();
            Lesson lesson = buildLesson(true, TEST_CASES_JSON);
            User user = buildUser();

            when(lessonRepository.findByIdWithChapter(lesson.getId())).thenReturn(Optional.of(lesson));
            when(userRepository.findById(userId)).thenReturn(Optional.of(user));
            when(userProgressRepository.findByUserIdAndLessonId(userId, lesson.getId())).thenReturn(Optional.empty());
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));

            RunCodeResponse res = progressService.submitChallenge(userId, lesson.getId(), buildRequest());

            assertThat(res.getPassed()).isTrue();
            ArgumentCaptor<UserProgress> captor = ArgumentCaptor.forClass(UserProgress.class);
            verify(userProgressRepository).save(captor.capture());
            assertThat(captor.getValue().isChallengePassed()).isTrue();
            assertThat(captor.getValue().isCompleted()).isTrue();
        }

        @Test
        @DisplayName("Không lưu progress khi có test case fail")
        void shouldNotSaveProgressWhenAnyTestCaseFails() {
            UUID userId = UUID.randomUUID();
            Lesson lesson = buildLesson(true, TEST_CASES_JSON);

            when(lessonRepository.findByIdWithChapter(lesson.getId())).thenReturn(Optional.of(lesson));
            // Case 1 pass, case 2 fail
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()))
                .thenReturn(ResponseEntity.ok(judge0Token()))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")))
                .thenReturn(ResponseEntity.ok(judge0Response("Wrong Answer", "")))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));

            RunCodeResponse res = progressService.submitChallenge(userId, lesson.getId(), buildRequest());

            assertThat(res.getPassed()).isFalse();
            verify(userProgressRepository, never()).save(any());
        }

        @Test
        @DisplayName("Không lưu progress khi userId null (guest)")
        void shouldNotSaveProgressForGuest() {
            Lesson lesson = buildLesson(true, TEST_CASES_JSON);

            when(lessonRepository.findByIdWithChapter(lesson.getId())).thenReturn(Optional.of(lesson));
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));

            RunCodeResponse res = progressService.submitChallenge(null, lesson.getId(), buildRequest());

            assertThat(res.getPassed()).isTrue();
            verify(userProgressRepository, never()).save(any());
        }

        @Test
        @DisplayName("Throw 404 khi user không tồn tại")
        void shouldThrow404WhenUserNotFound() {
            UUID userId = UUID.randomUUID();
            Lesson lesson = buildLesson(true, TEST_CASES_JSON);

            when(lessonRepository.findByIdWithChapter(lesson.getId())).thenReturn(Optional.of(lesson));
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "Hello")));
            when(userRepository.findById(userId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> progressService.submitChallenge(userId, lesson.getId(), buildRequest()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("User not found");
        }

        @Test
        @DisplayName("Không crash khi lesson không có test cases")
        void shouldHandleNoTestCases() {
            UUID userId = UUID.randomUUID();
            Lesson lesson = buildLesson(true, null); // no test cases

            when(lessonRepository.findByIdWithChapter(lesson.getId())).thenReturn(Optional.of(lesson));
            when(userRepository.findById(userId)).thenReturn(Optional.of(new User()));
            when(userProgressRepository.findByUserIdAndLessonId(any(), any())).thenReturn(Optional.empty());
            when(restTemplate.postForEntity(anyString(), any(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Token()));
            when(restTemplate.getForEntity(anyString(), eq(String.class)))
                .thenReturn(ResponseEntity.ok(judge0Response("Accepted", "")));

            RunCodeResponse res = progressService.submitChallenge(userId, lesson.getId(), buildRequest());

            assertThat(res.getPassed()).isTrue(); // no cases = all pass
        }
    }
}
