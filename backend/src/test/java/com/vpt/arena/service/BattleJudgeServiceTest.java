package com.vpt.arena.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.dto.battle.BattleLeaderboardEntryDto;
import com.vpt.arena.dto.battle.BattleSubmitRequest;
import com.vpt.arena.entity.BattleRoomProblem;
import com.vpt.arena.entity.BattleSubmission;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.Room;
import com.vpt.arena.entity.RoomMember;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.JudgeResult;
import com.vpt.arena.entity.enums.RoomStatus;
import com.vpt.arena.repository.BattleRoomProblemRepository;
import com.vpt.arena.repository.BattleSubmissionRepository;
import com.vpt.arena.repository.RoomMemberRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.RoomResultRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestTemplate;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("BattleJudgeService Unit Tests")
class BattleJudgeServiceTest {

    @Mock private BattleSubmissionRepository battleSubmissionRepository;
    @Mock private BattleRoomProblemRepository battleRoomProblemRepository;
    @Mock private RoomMemberRepository roomMemberRepository;
    @Mock private RoomRepository roomRepository;
    @Mock private RoomResultRepository roomResultRepository;
    @Mock private UserRepository userRepository;
    @Mock private RestTemplate restTemplate;
    @Mock private ObjectMapper objectMapper;
    @Mock private BattleRealtimeNotifier battleRealtimeNotifier;
    @Mock private TransactionTemplate transactionTemplate;

    @InjectMocks
    private BattleJudgeService battleJudgeService;

    @BeforeEach
    void runTransactionCallbacks() {
        lenient().when(transactionTemplate.execute(any())).thenAnswer(invocation -> {
            TransactionCallback<?> callback = invocation.getArgument(0);
            return callback.doInTransaction(null);
        });
    }

    private User user(UUID id, String name) {
        User user = new User();
        user.setId(id);
        user.setEmail(name.toLowerCase() + "@test.com");
        user.setName(name);
        return user;
    }

    private Problem problem(UUID id, String title) {
        Problem problem = new Problem();
        problem.setId(id);
        problem.setTitle(title);
        problem.setDifficulty(Difficulty.EASY);
        problem.setTopic("math");
        problem.setPublished(true);
        problem.setDescription("desc");
        problem.setTimeLimitMs(1000);
        problem.setMemoryLimitKb(128000);
        problem.setTestCases("{\"cases\":[{\"input\":\"\",\"expected\":\"ok\\n\"}]}");
        return problem;
    }

    private Room room(UUID id, User creator, int numProblems) {
        Room room = new Room();
        room.setId(id);
        room.setCreator(creator);
        room.setName("Battle");
        room.setStatus(RoomStatus.IN_PROGRESS);
        room.setNumProblems(numProblems);
        room.setTimeLimitMin(30);
        room.setEndTime(OffsetDateTime.now().plusMinutes(10));
        room.setMembers(new ArrayList<>());
        return room;
    }

    private RoomMember member(Room room, User user) {
        RoomMember member = new RoomMember();
        member.setId(UUID.randomUUID());
        member.setRoom(room);
        member.setUser(user);
        member.setJoinedAt(OffsetDateTime.now());
        return member;
    }

    private BattleSubmission submission(UUID id, Room room, User user, Problem problem, OffsetDateTime submittedAt) {
        BattleSubmission submission = new BattleSubmission();
        submission.setId(id);
        submission.setRoom(room);
        submission.setUser(user);
        submission.setProblem(problem);
        submission.setCode("print('ok')");
        submission.setLanguage("python");
        submission.setResult(JudgeResult.PENDING);
        submission.setSubmittedAt(submittedAt);
        return submission;
    }

    private BattleRoomProblem roomProblem(Room room, Problem problem) {
        BattleRoomProblem roomProblem = new BattleRoomProblem();
        roomProblem.setId(UUID.randomUUID());
        roomProblem.setRoom(room);
        roomProblem.setProblem(problem);
        roomProblem.setOrder(1);
        return roomProblem;
    }

    @Test
    @DisplayName("AC đầu tiên nhận điểm theo độ khó bài")
    void shouldAwardPointsForFirstAcceptedSubmission() {
        UUID submissionId = UUID.randomUUID();
        User user = user(UUID.randomUUID(), "Alice");
        Room room = room(UUID.randomUUID(), user, 2);
        Problem problem = problem(UUID.randomUUID(), "A");
        BattleSubmission submission = submission(submissionId, room, user, problem, OffsetDateTime.now());
        when(battleSubmissionRepository.findWithRoomAndProblemAndUserById(submissionId)).thenReturn(Optional.of(submission));
        when(roomRepository.findDetailedByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(roomRepository.findDetailedById(room.getId())).thenReturn(Optional.of(room));
        when(battleSubmissionRepository.findLeaderboardSubmissions(room.getId())).thenReturn(List.of(submission));
        when(battleSubmissionRepository.maxPointsByRoomUserProblemAndResult(room.getId(), user.getId(), problem.getId(), JudgeResult.AC))
            .thenReturn(0);
        when(battleSubmissionRepository.save(any(BattleSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = battleJudgeService.applyJudgeResult(submissionId, JudgeResult.AC, 120);

        assertThat(dto.getResult()).isEqualTo(JudgeResult.AC);
        assertThat(dto.getPoints()).isEqualTo(100);
        assertThat(dto.getExecutionTime()).isEqualTo(120);
    }

    @Test
    @DisplayName("AC lặp lại cùng bài chỉ nhận điểm nếu cao hơn điểm cũ")
    void shouldNotAwardDuplicateAcceptedSubmission() {
        UUID submissionId = UUID.randomUUID();
        User user = user(UUID.randomUUID(), "Alice");
        Room room = room(UUID.randomUUID(), user, 2);
        Problem problem = problem(UUID.randomUUID(), "A");
        BattleSubmission submission = submission(submissionId, room, user, problem, OffsetDateTime.now());
        when(battleSubmissionRepository.findWithRoomAndProblemAndUserById(submissionId)).thenReturn(Optional.of(submission));
        when(roomRepository.findDetailedByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(roomRepository.findDetailedById(room.getId())).thenReturn(Optional.of(room));
        when(battleSubmissionRepository.findLeaderboardSubmissions(room.getId())).thenReturn(List.of(submission));
        when(battleSubmissionRepository.maxPointsByRoomUserProblemAndResult(room.getId(), user.getId(), problem.getId(), JudgeResult.AC))
            .thenReturn(100);
        when(battleSubmissionRepository.save(any(BattleSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = battleJudgeService.applyJudgeResult(submissionId, JudgeResult.AC, 120);

        assertThat(dto.getPoints()).isZero();
    }

    @Test
    @DisplayName("AC mới nâng điểm nếu dữ liệu cũ có điểm thấp hơn")
    void shouldUpgradeAcceptedSubmissionScoreWhenNewRuleIsHigher() {
        UUID submissionId = UUID.randomUUID();
        User user = user(UUID.randomUUID(), "Alice");
        Room room = room(UUID.randomUUID(), user, 2);
        Problem problem = problem(UUID.randomUUID(), "A");
        BattleSubmission submission = submission(submissionId, room, user, problem, OffsetDateTime.now());
        BattleSubmission oldAccepted = submission(UUID.randomUUID(), room, user, problem, OffsetDateTime.now().minusMinutes(1));
        oldAccepted.setResult(JudgeResult.AC);
        oldAccepted.setPoints(33);
        when(battleSubmissionRepository.findWithRoomAndProblemAndUserById(submissionId)).thenReturn(Optional.of(submission));
        when(roomRepository.findDetailedByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(roomRepository.findDetailedById(room.getId())).thenReturn(Optional.of(room));
        when(battleSubmissionRepository.findLeaderboardSubmissions(room.getId())).thenReturn(List.of(oldAccepted, submission));
        when(battleSubmissionRepository.maxPointsByRoomUserProblemAndResult(room.getId(), user.getId(), problem.getId(), JudgeResult.AC))
            .thenReturn(33);
        when(battleSubmissionRepository.save(any(BattleSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = battleJudgeService.applyJudgeResult(submissionId, JudgeResult.AC, 120);
        List<BattleLeaderboardEntryDto> leaderboard = battleJudgeService.leaderboard(room.getId());

        assertThat(dto.getPoints()).isEqualTo(100);
        assertThat(leaderboard.getFirst().getTotalPoints()).isEqualTo(100);
    }

    @Test
    @DisplayName("Judge result đã xử lý rồi thì không ghi đè điểm khi worker retry")
    void shouldKeepExistingResultWhenJudgeWorkerRetries() {
        UUID submissionId = UUID.randomUUID();
        User user = user(UUID.randomUUID(), "Alice");
        Room room = room(UUID.randomUUID(), user, 2);
        Problem problem = problem(UUID.randomUUID(), "A");
        BattleSubmission submission = submission(submissionId, room, user, problem, OffsetDateTime.now());
        submission.setResult(JudgeResult.AC);
        submission.setPoints(50);
        when(battleSubmissionRepository.findWithRoomAndProblemAndUserById(submissionId)).thenReturn(Optional.of(submission));
        when(roomRepository.findDetailedByIdForUpdate(room.getId())).thenReturn(Optional.of(room));

        var dto = battleJudgeService.applyJudgeResult(submissionId, JudgeResult.WA, 200);

        assertThat(dto.getResult()).isEqualTo(JudgeResult.AC);
        assertThat(dto.getPoints()).isEqualTo(50);
        verify(battleSubmissionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Judge failure lưu error output để FE hiển thị")
    void shouldExposeJudgeFailureErrorOutput() {
        UUID submissionId = UUID.randomUUID();
        User user = user(UUID.randomUUID(), "Alice");
        Room room = room(UUID.randomUUID(), user, 1);
        Problem problem = problem(UUID.randomUUID(), "A");
        BattleSubmission submission = submission(submissionId, room, user, problem, OffsetDateTime.now());
        when(battleSubmissionRepository.findWithRoomAndProblemAndUserById(submissionId)).thenReturn(Optional.of(submission));
        when(roomRepository.findDetailedByIdForUpdate(room.getId())).thenReturn(Optional.of(room));
        when(roomRepository.findDetailedById(room.getId())).thenReturn(Optional.of(room));
        when(battleSubmissionRepository.findLeaderboardSubmissions(room.getId())).thenReturn(List.of(submission));
        when(battleSubmissionRepository.save(any(BattleSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var dto = battleJudgeService.markJudgeFailure(submissionId);

        assertThat(dto.getResult()).isEqualTo(JudgeResult.RE);
        assertThat(dto.getErrorOutput()).isEqualTo("Judge service failed");
        verify(battleRealtimeNotifier).publishSubmissionResult(dto);
    }

    @Test
    @DisplayName("Submit battle lock phòng trước khi kiểm tra trạng thái và lưu submission")
    void shouldLockRoomBeforeAcceptingSubmission() {
        UUID roomId = UUID.randomUUID();
        UUID problemId = UUID.randomUUID();
        User user = user(UUID.randomUUID(), "Alice");
        Room room = room(roomId, user, 1);
        Problem problem = problem(problemId, "A");
        BattleSubmitRequest request = new BattleSubmitRequest();
        request.setProblemId(problemId);
        request.setSourceCode("print('ok')");
        request.setLanguage("python");
        when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(roomMemberRepository.existsByRoomIdAndUserId(roomId, user.getId())).thenReturn(true);
        when(battleRoomProblemRepository.findByRoomIdAndProblemId(roomId, problemId)).thenReturn(Optional.of(roomProblem(room, problem)));
        when(battleSubmissionRepository.save(any(BattleSubmission.class))).thenAnswer(invocation -> {
            BattleSubmission submission = invocation.getArgument(0);
            submission.setId(UUID.randomUUID());
            return submission;
        });

        var dto = battleJudgeService.submit(roomId, user.getId(), request);

        assertThat(dto.getResult()).isEqualTo(JudgeResult.PENDING);
        verify(roomRepository).findDetailedByIdForUpdate(roomId);
    }

    @Test
    @DisplayName("Leaderboard xếp theo tổng điểm rồi thời gian AC cuối")
    void shouldRankLeaderboardByPointsAndLastAcceptedTime() {
        UUID roomId = UUID.randomUUID();
        User alice = user(UUID.randomUUID(), "Alice");
        User bob = user(UUID.randomUUID(), "Bob");
        Room room = room(roomId, alice, 2);
        room.getMembers().add(member(room, alice));
        room.getMembers().add(member(room, bob));
        Problem a = problem(UUID.randomUUID(), "A");
        Problem b = problem(UUID.randomUUID(), "B");
        OffsetDateTime t1 = OffsetDateTime.now().minusMinutes(5);
        OffsetDateTime t2 = OffsetDateTime.now().minusMinutes(1);
        BattleSubmission aliceA = submission(UUID.randomUUID(), room, alice, a, t1);
        aliceA.setResult(JudgeResult.AC);
        aliceA.setPoints(50);
        BattleSubmission bobA = submission(UUID.randomUUID(), room, bob, a, t2);
        bobA.setResult(JudgeResult.AC);
        bobA.setPoints(50);
        BattleSubmission bobB = submission(UUID.randomUUID(), room, bob, b, t2.plusSeconds(1));
        bobB.setResult(JudgeResult.AC);
        bobB.setPoints(50);
        when(roomRepository.findDetailedById(roomId)).thenReturn(Optional.of(room));
        when(battleSubmissionRepository.findLeaderboardSubmissions(roomId)).thenReturn(List.of(aliceA, bobA, bobB));

        List<BattleLeaderboardEntryDto> leaderboard = battleJudgeService.leaderboard(roomId);

        assertThat(leaderboard).hasSize(2);
        assertThat(leaderboard.getFirst().getUserId()).isEqualTo(bob.getId());
        assertThat(leaderboard.getFirst().getTotalPoints()).isEqualTo(100);
        assertThat(leaderboard.get(1).getUserId()).isEqualTo(alice.getId());
    }

    @Test
    @DisplayName("Scheduler service finish các phòng quá hạn")
    void shouldFinishExpiredRooms() {
        UUID roomId = UUID.randomUUID();
        User alice = user(UUID.randomUUID(), "Alice");
        Room room = room(roomId, alice, 1);
        room.setEndTime(OffsetDateTime.now().minusSeconds(1));
        room.getMembers().add(member(room, alice));
        when(roomRepository.findByStatusAndEndTimeBefore(any(), any())).thenReturn(List.of(room));
        when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
        when(roomRepository.findDetailedById(roomId)).thenReturn(Optional.of(room));
        when(battleSubmissionRepository.findLeaderboardSubmissions(roomId)).thenReturn(List.of());
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));

        int finished = battleJudgeService.finishExpiredRooms();

        assertThat(finished).isEqualTo(1);
        assertThat(room.getStatus()).isEqualTo(RoomStatus.FINISHED);
        verify(roomResultRepository).save(any());
    }
}
