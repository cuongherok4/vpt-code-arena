package com.vpt.arena.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.config.AppConfig;
import com.vpt.arena.config.SecurityConfig;
import com.vpt.arena.dto.battle.BattleLeaderboardEntryDto;
import com.vpt.arena.dto.battle.BattleRoomCreateRequest;
import com.vpt.arena.dto.battle.BattleRoomDto;
import com.vpt.arena.dto.battle.BattleSubmissionDto;
import com.vpt.arena.dto.battle.BattleSubmitRequest;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.entity.enums.RoomStatus;
import com.vpt.arena.service.BattleJudgeService;
import com.vpt.arena.service.BattleJudgeWorker;
import com.vpt.arena.service.BattleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BattleController.class)
@Import({SecurityConfig.class, AppConfig.class})
@ActiveProfiles("test")
@DisplayName("BattleController Tests")
class BattleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean BattleService battleService;
    @MockitoBean BattleJudgeService battleJudgeService;
    @MockitoBean BattleJudgeWorker battleJudgeWorker;

    private static final String BASE = "/api/v1/battle";
    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID ROOM_ID = UUID.randomUUID();

    @Test
    @DisplayName("GET /rooms trả danh sách phòng public")
    void shouldListPublicRooms() throws Exception {
        when(battleService.listPublicWaitingRooms()).thenReturn(List.of(roomDto()));

        mockMvc.perform(get(BASE + "/rooms"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].name").value("Battle Room"))
            .andExpect(jsonPath("$[0].isPublic").value(true));
    }

    @Test
    @DisplayName("POST /rooms cần X-User-Id")
    void shouldRequireUserIdToCreateRoom() throws Exception {
        mockMvc.perform(post(BASE + "/rooms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest())))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /rooms tạo phòng")
    void shouldCreateRoom() throws Exception {
        BattleRoomCreateRequest request = createRequest();
        when(battleService.createRoom(eq(USER_ID), any())).thenReturn(roomDto());

        mockMvc.perform(post(BASE + "/rooms")
                .header("X-User-Id", USER_ID.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("WAITING"));

        verify(battleService).createRoom(eq(USER_ID), any());
    }

    @Test
    @DisplayName("POST /rooms validate timeLimitMin tối thiểu 10 phút")
    void shouldRejectTooShortTimeLimit() throws Exception {
        BattleRoomCreateRequest request = createRequest();
        request.setTimeLimitMin(5);

        mockMvc.perform(post(BASE + "/rooms")
                .header("X-User-Id", USER_ID.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /rooms/{id}/join truyền userId đúng")
    void shouldJoinRoom() throws Exception {
        when(battleService.joinRoom(ROOM_ID, USER_ID)).thenReturn(roomDto());

        mockMvc.perform(post(BASE + "/rooms/" + ROOM_ID + "/join")
                .header("X-User-Id", USER_ID.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(ROOM_ID.toString()));

        verify(battleService).joinRoom(ROOM_ID, USER_ID);
    }

    @Test
    @DisplayName("POST /rooms/{id}/start truyền userId đúng")
    void shouldStartRoom() throws Exception {
        BattleRoomDto dto = roomDto();
        dto.setStatus(RoomStatus.IN_PROGRESS);
        when(battleService.startRoom(ROOM_ID, USER_ID)).thenReturn(dto);

        mockMvc.perform(post(BASE + "/rooms/" + ROOM_ID + "/start")
                .header("X-User-Id", USER_ID.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        verify(battleService).startRoom(ROOM_ID, USER_ID);
    }

    @Test
    @DisplayName("PUT /rooms/{id} cập nhật phòng")
    void shouldUpdateRoom() throws Exception {
        when(battleService.updateRoom(eq(ROOM_ID), eq(USER_ID), any())).thenReturn(roomDto());

        mockMvc.perform(put(BASE + "/rooms/" + ROOM_ID)
                .header("X-User-Id", USER_ID.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(ROOM_ID.toString()));

        verify(battleService).updateRoom(eq(ROOM_ID), eq(USER_ID), any());
    }

    @Test
    @DisplayName("DELETE /rooms/{id} xóa phòng")
    void shouldDeleteRoom() throws Exception {
        mockMvc.perform(delete(BASE + "/rooms/" + ROOM_ID)
                .header("X-User-Id", USER_ID.toString()))
            .andExpect(status().isNoContent());

        verify(battleService).deleteRoom(ROOM_ID, USER_ID);
    }

    @Test
    @DisplayName("POST /rooms/{id}/submissions submit async và trigger worker")
    void shouldSubmitBattleCode() throws Exception {
        UUID submissionId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        BattleSubmissionDto submission = BattleSubmissionDto.builder()
            .id(submissionId)
            .roomId(ROOM_ID)
            .userId(USER_ID)
            .problemId(problemId)
            .language("python")
            .result(JudgeResult.PENDING)
            .points(0)
            .submittedAt(OffsetDateTime.now())
            .build();
        when(battleJudgeService.submit(eq(ROOM_ID), eq(USER_ID), any())).thenReturn(submission);

        mockMvc.perform(post(BASE + "/rooms/" + ROOM_ID + "/submit")
                .header("X-User-Id", USER_ID.toString())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "problemId": "%s",
                      "code": "print('ok')",
                      "language": "python"
                    }
                    """.formatted(problemId)))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.id").value(submissionId.toString()))
            .andExpect(jsonPath("$.submissionId").value(submissionId.toString()))
            .andExpect(jsonPath("$.status").value("PENDING"))
            .andExpect(jsonPath("$.result").value("PENDING"));

        verify(battleJudgeService).submit(eq(ROOM_ID), eq(USER_ID), any());
        verify(battleJudgeWorker).judgeSubmission(submissionId);
    }

    @Test
    @DisplayName("GET /rooms/{id}/leaderboard trả bảng điểm battle")
    void shouldGetBattleLeaderboard() throws Exception {
        when(battleJudgeService.leaderboard(ROOM_ID)).thenReturn(List.of(
            new BattleLeaderboardEntryDto(USER_ID, "Alice", 1, 100, 2, OffsetDateTime.now())
        ));

        mockMvc.perform(get(BASE + "/rooms/" + ROOM_ID + "/leaderboard"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].rank").value(1))
            .andExpect(jsonPath("$[0].totalPoints").value(100));
    }

    @Test
    @DisplayName("POST /rooms/{id}/finish kết thúc phòng bởi creator")
    void shouldFinishBattleRoom() throws Exception {
        when(battleJudgeService.finishRoomAsUser(ROOM_ID, USER_ID)).thenReturn(List.of(
            new BattleLeaderboardEntryDto(USER_ID, "Alice", 1, 100, 2, OffsetDateTime.now())
        ));

        mockMvc.perform(post(BASE + "/rooms/" + ROOM_ID + "/finish")
                .header("X-User-Id", USER_ID.toString()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].userId").value(USER_ID.toString()));

        verify(battleJudgeService).finishRoomAsUser(ROOM_ID, USER_ID);
    }

    private BattleRoomCreateRequest createRequest() {
        BattleRoomCreateRequest request = new BattleRoomCreateRequest();
        request.setName("Battle Room");
        request.setPublic(true);
        request.setMaxMembers(4);
        request.setNumProblems(2);
        request.setTimeLimitMin(30);
        request.setDifficulty(Difficulty.EASY);
        request.setTopic("math");
        return request;
    }

    private BattleRoomDto roomDto() {
        return new BattleRoomDto(
            ROOM_ID,
            "Battle Room",
            RoomStatus.WAITING,
            true,
            4,
            2,
            30,
            Difficulty.EASY,
            "math",
            null,
            null,
            USER_ID,
            "Alice",
            1,
            List.of(),
            List.of()
        );
    }
}
