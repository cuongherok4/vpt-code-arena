package com.vpt.arena.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.learn.ChapterDto;
import com.vpt.arena.dto.learn.LessonDetailDto;
import com.vpt.arena.dto.learn.LessonDto;
import com.vpt.arena.dto.learn.RunCodeRequest;
import com.vpt.arena.dto.learn.RunCodeResponse;
import com.vpt.arena.service.ChapterService;
import com.vpt.arena.service.LessonService;
import com.vpt.arena.service.ProgressService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.test.context.ActiveProfiles;

import org.springframework.context.annotation.Import;
import com.vpt.arena.config.SecurityConfig;
import com.vpt.arena.config.AppConfig;

@WebMvcTest(LearnController.class)
@Import({SecurityConfig.class, AppConfig.class})
@ActiveProfiles("test")
@DisplayName("LearnController Integration Tests")
class LearnControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean ChapterService chapterService;
    @MockitoBean LessonService lessonService;
    @MockitoBean ProgressService progressService;

    private static final String BASE = "/api/v1/learn";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID LESSON_ID = UUID.randomUUID();

    // ─── GET /chapters ────────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /chapters")
    class GetChapters {

        @Test
        @DisplayName("Trả 200 với danh sách chapters")
        void shouldReturn200WithChapters() throws Exception {
            LessonDto lesson = new LessonDto();
            lesson.setId(UUID.randomUUID());
            lesson.setTitle("Lesson 1");
            lesson.setOrder(1);

            ChapterDto chapter = new ChapterDto();
            chapter.setId(UUID.randomUUID());
            chapter.setTitle("Chapter 1");
            chapter.setOrder(1);
            chapter.setLessons(List.of(lesson));

            when(chapterService.getAllChaptersWithProgress(null)).thenReturn(List.of(chapter));

            mockMvc.perform(get(BASE + "/chapters"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Chapter 1"))
                .andExpect(jsonPath("$[0].lessons[0].title").value("Lesson 1"));
        }

        @Test
        @DisplayName("Truyền userId đúng khi có X-User-Id header")
        void shouldPassUserIdWhenHeaderPresent() throws Exception {
            when(chapterService.getAllChaptersWithProgress(USER_ID)).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/chapters")
                    .header("X-User-Id", USER_ID.toString()))
                .andExpect(status().isOk());

            verify(chapterService).getAllChaptersWithProgress(USER_ID);
        }

        @Test
        @DisplayName("Truyền null khi không có X-User-Id (guest)")
        void shouldPassNullForGuest() throws Exception {
            when(chapterService.getAllChaptersWithProgress(null)).thenReturn(List.of());

            mockMvc.perform(get(BASE + "/chapters"))
                .andExpect(status().isOk());

            verify(chapterService).getAllChaptersWithProgress(null);
        }
    }

    // ─── GET /lessons/{id} ────────────────────────────────────────────────────

    @Nested
    @DisplayName("GET /lessons/{id}")
    class GetLesson {

        @Test
        @DisplayName("Trả 200 với chi tiết bài học (guest)")
        void shouldReturn200WithLesson() throws Exception {
            LessonDetailDto dto = new LessonDetailDto();
            dto.setId(LESSON_ID);
            dto.setTitle("Java Basics");
            dto.setContent("Content here");
            dto.setChapterId(UUID.randomUUID());
            dto.setHasChallenge(true);

            when(lessonService.getLesson(LESSON_ID, null)).thenReturn(dto);

            mockMvc.perform(get(BASE + "/lessons/" + LESSON_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Java Basics"))
                .andExpect(jsonPath("$.hasChallenge").value(true))
                .andExpect(jsonPath("$.chapterId").exists());
        }

        @Test
        @DisplayName("Truyền userId đúng khi có X-User-Id header")
        void shouldPassUserIdWhenHeaderPresent() throws Exception {
            LessonDetailDto dto = new LessonDetailDto();
            dto.setId(LESSON_ID);
            dto.setTitle("Java Basics");

            when(lessonService.getLesson(LESSON_ID, USER_ID)).thenReturn(dto);

            mockMvc.perform(get(BASE + "/lessons/" + LESSON_ID)
                    .header("X-User-Id", USER_ID.toString()))
                .andExpect(status().isOk());

            verify(lessonService).getLesson(LESSON_ID, USER_ID);
        }
    }

    // ─── POST /lessons/{id}/complete ──────────────────────────────────────────

    @Nested
    @DisplayName("POST /lessons/{id}/complete")
    class CompleteLesson {

        @Test
        @DisplayName("Trả 200 khi có auth")
        void shouldReturn200WithAuth() throws Exception {
            doNothing().when(progressService).markCompleted(USER_ID, LESSON_ID);

            mockMvc.perform(post(BASE + "/lessons/" + LESSON_ID + "/complete")
                    .header("X-User-Id", USER_ID.toString()))
                .andExpect(status().isOk());

            verify(progressService).markCompleted(USER_ID, LESSON_ID);
        }

        @Test
        @DisplayName("Trả 401 khi không có X-User-Id")
        void shouldReturn401WithoutAuth() throws Exception {
            mockMvc.perform(post(BASE + "/lessons/" + LESSON_ID + "/complete"))
                .andExpect(status().isUnauthorized());

            verify(progressService, never()).markCompleted(any(), any());
        }

        @Test
        @DisplayName("Trả 401 khi X-User-Id không hợp lệ")
        void shouldReturn401WithInvalidUserId() throws Exception {
            mockMvc.perform(post(BASE + "/lessons/" + LESSON_ID + "/complete")
                    .header("X-User-Id", "not-a-uuid"))
                .andExpect(status().isUnauthorized());
        }
    }

    // ─── POST /lessons/{id}/challenge ─────────────────────────────────────────

    @Nested
    @DisplayName("POST /lessons/{id}/challenge")
    class SubmitChallenge {

        private RunCodeRequest validRequest() {
            RunCodeRequest req = new RunCodeRequest();
            req.setSourceCode("System.out.println(\"Hello\");");
            req.setLanguageId(62);
            return req;
        }

        @Test
        @DisplayName("Trả 200 với kết quả passed=true (guest)")
        void shouldReturn200ForGuest() throws Exception {
            RunCodeResponse res = RunCodeResponse.builder()
                .passed(true).status("Accepted").stdout("Hello\n").build();

            when(progressService.submitChallenge(eq(null), eq(LESSON_ID), any())).thenReturn(res);

            mockMvc.perform(post(BASE + "/lessons/" + LESSON_ID + "/challenge")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passed").value(true))
                .andExpect(jsonPath("$.status").value("Accepted"));
        }

        @Test
        @DisplayName("Trả 200 với userId khi có X-User-Id")
        void shouldReturn200WithUserId() throws Exception {
            RunCodeResponse res = RunCodeResponse.builder()
                .passed(false).status("Wrong Answer").build();

            when(progressService.submitChallenge(eq(USER_ID), eq(LESSON_ID), any())).thenReturn(res);

            mockMvc.perform(post(BASE + "/lessons/" + LESSON_ID + "/challenge")
                    .header("X-User-Id", USER_ID.toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passed").value(false));

            verify(progressService).submitChallenge(eq(USER_ID), eq(LESSON_ID), any());
        }

        @Test
        @DisplayName("Trả 400 khi sourceCode rỗng")
        void shouldReturn400WhenSourceCodeBlank() throws Exception {
            RunCodeRequest invalid = new RunCodeRequest();
            invalid.setSourceCode("");

            mockMvc.perform(post(BASE + "/lessons/" + LESSON_ID + "/challenge")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest());
        }
    }

    // ─── POST /run-code ───────────────────────────────────────────────────────

    @Nested
    @DisplayName("POST /run-code")
    class RunCode {

        @Test
        @DisplayName("Trả 200 với kết quả chạy code")
        void shouldReturn200WithResult() throws Exception {
            RunCodeRequest req = new RunCodeRequest();
            req.setSourceCode("System.out.println(\"Hello\");");
            req.setLanguageId(62);

            RunCodeResponse res = RunCodeResponse.builder()
                .stdout("Hello\n").status("Accepted").passed(true).build();

            when(progressService.runCode(any(), eq(null))).thenReturn(res);

            mockMvc.perform(post(BASE + "/run-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stdout").value("Hello\n"));
        }

        @Test
        @DisplayName("Trả 400 khi thiếu sourceCode")
        void shouldReturn400WhenMissingSourceCode() throws Exception {
            mockMvc.perform(post(BASE + "/run-code")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                .andExpect(status().isBadRequest());
        }
    }
}
