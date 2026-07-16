package com.vpt.arena.service;

import com.vpt.arena.dto.battle.BattleRoomCreateRequest;
import com.vpt.arena.dto.battle.BattleRoomDto;
import com.vpt.arena.dto.battle.BattleSubmitRequest;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.Room;
import com.vpt.arena.entity.RoomResult;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.entity.enums.RoomStatus;
import com.vpt.arena.repository.BattleRoomProblemRepository;
import com.vpt.arena.repository.BattleSubmissionRepository;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.RoomMemberRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.RoomResultRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@DisplayName("Battle lifecycle integration tests")
class BattleLifecycleIntegrationTest {

    @Autowired private BattleService battleService;
    @Autowired private BattleJudgeService battleJudgeService;
    @Autowired private UserRepository userRepository;
    @Autowired private ProblemRepository problemRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private RoomMemberRepository roomMemberRepository;
    @Autowired private BattleRoomProblemRepository battleRoomProblemRepository;
    @Autowired private BattleSubmissionRepository battleSubmissionRepository;
    @Autowired private RoomResultRepository roomResultRepository;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        roomResultRepository.deleteAll();
        battleSubmissionRepository.deleteAll();
        battleRoomProblemRepository.deleteAll();
        roomMemberRepository.deleteAll();
        roomRepository.deleteAll();
        problemRepository.deleteAll();
        userRepository.deleteAll();

        alice = userRepository.save(user("alice@test.com", "Alice"));
        bob = userRepository.save(user("bob@test.com", "Bob"));
        problemRepository.save(problem("A. Sum"));
        problemRepository.save(problem("B. Echo"));
    }

    @Test
    @DisplayName("create -> join -> start -> submit -> score -> finish persists final ranking")
    void shouldCompleteBattleLifecycleAndPersistFinalRanking() {
        BattleRoomDto created = battleService.createRoom(alice.getId(), createRequest());
        BattleRoomDto joined = battleService.joinRoom(created.getId(), bob.getId());
        BattleRoomDto started = battleService.startRoom(joined.getId(), alice.getId());

        assertThat(started.getStatus()).isEqualTo(RoomStatus.IN_PROGRESS);
        assertThat(started.getMemberCount()).isEqualTo(2);
        assertThat(started.getProblems()).hasSize(2);

        UUID firstProblemId = started.getProblems().get(0).getId();
        UUID secondProblemId = started.getProblems().get(1).getId();
        var aliceFirst = battleJudgeService.submit(started.getId(), alice.getId(), submitRequest(firstProblemId));
        var bobFirst = battleJudgeService.submit(started.getId(), bob.getId(), submitRequest(firstProblemId));
        var bobSecond = battleJudgeService.submit(started.getId(), bob.getId(), submitRequest(secondProblemId));

        battleJudgeService.applyJudgeResult(aliceFirst.getId(), JudgeResult.AC, 100);
        battleJudgeService.applyJudgeResult(bobFirst.getId(), JudgeResult.AC, 90);
        battleJudgeService.applyJudgeResult(bobSecond.getId(), JudgeResult.AC, 80);

        List<?> liveLeaderboard = battleJudgeService.leaderboard(started.getId());
        assertThat(liveLeaderboard).hasSize(2);

        var finalLeaderboard = battleJudgeService.finishRoom(started.getId());

        assertThat(finalLeaderboard).hasSize(2);
        assertThat(finalLeaderboard.get(0).getUserId()).isEqualTo(bob.getId());
        assertThat(finalLeaderboard.get(0).getRank()).isEqualTo(1);
        assertThat(finalLeaderboard.get(0).getTotalPoints()).isEqualTo(100);
        assertThat(finalLeaderboard.get(0).getAcceptedCount()).isEqualTo(2);
        assertThat(finalLeaderboard.get(1).getUserId()).isEqualTo(alice.getId());
        assertThat(finalLeaderboard.get(1).getRank()).isEqualTo(2);
        assertThat(finalLeaderboard.get(1).getTotalPoints()).isEqualTo(50);

        Room finished = roomRepository.findById(started.getId()).orElseThrow();
        assertThat(finished.getStatus()).isEqualTo(RoomStatus.FINISHED);
        List<RoomResult> persistedResults = roomResultRepository.findByRoomIdOrderByRankAsc(started.getId());
        assertThat(persistedResults).hasSize(2);
        assertThat(persistedResults.get(0).getUser().getId()).isEqualTo(bob.getId());
        assertThat(persistedResults.get(0).getTotalPoints()).isEqualTo(100);
        assertThat(battleSubmissionRepository.findByRoomIdOrderBySubmittedAtAsc(started.getId())).hasSize(3);

        assertThatThrownBy(() -> battleJudgeService.submit(started.getId(), alice.getId(), submitRequest(firstProblemId)))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Room is not in progress");
    }

    @Test
    @DisplayName("scheduler finishes expired in-progress room and stores result rows")
    void shouldFinishExpiredRoomsThroughSchedulerService() {
        BattleRoomDto created = battleService.createRoom(alice.getId(), createRequest());
        battleService.joinRoom(created.getId(), bob.getId());
        BattleRoomDto started = battleService.startRoom(created.getId(), alice.getId());
        UUID problemId = started.getProblems().get(0).getId();
        var submission = battleJudgeService.submit(started.getId(), alice.getId(), submitRequest(problemId));
        battleJudgeService.applyJudgeResult(submission.getId(), JudgeResult.AC, 120);

        Room room = roomRepository.findById(started.getId()).orElseThrow();
        room.setEndTime(OffsetDateTime.now().minusSeconds(1));
        roomRepository.saveAndFlush(room);

        int finished = battleJudgeService.finishExpiredRooms();

        assertThat(finished).isEqualTo(1);
        assertThat(roomRepository.findById(started.getId()).orElseThrow().getStatus()).isEqualTo(RoomStatus.FINISHED);
        assertThat(roomResultRepository.findByRoomIdOrderByRankAsc(started.getId())).hasSize(2);
    }

    private BattleRoomCreateRequest createRequest() {
        BattleRoomCreateRequest request = new BattleRoomCreateRequest();
        request.setName("Integration Battle");
        request.setPublic(true);
        request.setMaxMembers(4);
        request.setNumProblems(2);
        request.setTimeLimitMin(30);
        request.setDifficulty(Difficulty.EASY);
        request.setTopic("math");
        return request;
    }

    private BattleSubmitRequest submitRequest(UUID problemId) {
        BattleSubmitRequest request = new BattleSubmitRequest();
        request.setProblemId(problemId);
        request.setSourceCode("print('ok')");
        request.setLanguage("python");
        return request;
    }

    private User user(String email, String name) {
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPasswordHash("hash");
        user.setEmailVerified(true);
        return user;
    }

    private Problem problem(String title) {
        Problem problem = new Problem();
        problem.setTitle(title);
        problem.setDescription(title);
        problem.setDifficulty(Difficulty.EASY);
        problem.setTopic("math");
        problem.setPublished(true);
        problem.setTimeLimitMs(1000);
        problem.setMemoryLimitKb(128000);
        problem.setTestCases("{\"cases\":[{\"input\":\"\",\"expected\":\"ok\\n\"}]}");
        return problem;
    }
}
