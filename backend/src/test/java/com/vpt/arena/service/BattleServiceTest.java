package com.vpt.arena.service;

import com.vpt.arena.dto.battle.BattleRoomCreateRequest;
import com.vpt.arena.dto.battle.BattleRoomDto;
import com.vpt.arena.entity.BattleRoomProblem;
import com.vpt.arena.entity.Problem;
import com.vpt.arena.entity.Room;
import com.vpt.arena.entity.RoomMember;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Difficulty;
import com.vpt.arena.entity.enums.RoomStatus;
import com.vpt.arena.repository.BattleRoomProblemRepository;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.RoomMemberRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("BattleService Unit Tests")
class BattleServiceTest {

    @Mock private RoomRepository roomRepository;
    @Mock private RoomMemberRepository roomMemberRepository;
    @Mock private BattleRoomProblemRepository battleRoomProblemRepository;
    @Mock private ProblemRepository problemRepository;
    @Mock private UserRepository userRepository;
    @Mock private BattleRealtimeNotifier battleRealtimeNotifier;

    @InjectMocks
    private BattleService battleService;

    private User user(UUID id, String name) {
        User user = new User();
        user.setId(id);
        user.setEmail(name.toLowerCase() + "@test.com");
        user.setName(name);
        return user;
    }

    private Room room(UUID id, User creator, RoomStatus status) {
        Room room = new Room();
        room.setId(id);
        room.setCreator(creator);
        room.setName("Battle Room");
        room.setStatus(status);
        room.setPublic(true);
        room.setMaxMembers(2);
        room.setNumProblems(2);
        room.setTimeLimitMin(30);
        room.setDifficulty(Difficulty.EASY);
        room.setTopic("math");
        room.setMembers(new ArrayList<>());
        return room;
    }

    private RoomMember member(Room room, User user, boolean ready) {
        RoomMember member = new RoomMember();
        member.setId(UUID.randomUUID());
        member.setRoom(room);
        member.setUser(user);
        member.setReady(ready);
        member.setJoinedAt(OffsetDateTime.now());
        return member;
    }

    private Problem problem(String title) {
        Problem problem = new Problem();
        problem.setId(UUID.randomUUID());
        problem.setTitle(title);
        problem.setDifficulty(Difficulty.EASY);
        problem.setTopic("math");
        problem.setPublished(true);
        problem.setDescription("desc");
        problem.setTestCases("{\"cases\":[]}");
        return problem;
    }

    private BattleRoomCreateRequest createRequest() {
        BattleRoomCreateRequest request = new BattleRoomCreateRequest();
        request.setName("Daily Battle");
        request.setPublic(true);
        request.setMaxMembers(4);
        request.setNumProblems(2);
        request.setTimeLimitMin(30);
        request.setDifficulty(Difficulty.EASY);
        request.setTopic("math");
        return request;
    }

    @Nested
    @DisplayName("createRoom")
    class CreateRoom {
        @Test
        @DisplayName("Tạo phòng và tự thêm creator vào member list")
        void shouldCreateRoomAndAddCreatorAsMember() {
            UUID userId = UUID.randomUUID();
            User creator = user(userId, "Alice");
            when(userRepository.findById(userId)).thenReturn(Optional.of(creator));
            when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
                Room saved = invocation.getArgument(0);
                saved.setId(UUID.randomUUID());
                return saved;
            });
            when(roomMemberRepository.save(any(RoomMember.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(battleRoomProblemRepository.findByRoomIdOrderByOrderAsc(any())).thenReturn(List.of());

            BattleRoomDto dto = battleService.createRoom(userId, createRequest());

            assertThat(dto.getName()).isEqualTo("Daily Battle");
            assertThat(dto.getStatus()).isEqualTo(RoomStatus.WAITING);
            assertThat(dto.getMemberCount()).isEqualTo(1);
            assertThat(dto.getMembers().getFirst().isCreator()).isTrue();
            assertThat(dto.getMembers().getFirst().isReady()).isTrue();
        }
    }

    @Nested
    @DisplayName("joinRoom")
    class JoinRoom {
        @Test
        @DisplayName("Chặn join sau khi phòng đã start")
        void shouldRejectJoinAfterStart() {
            UUID roomId = UUID.randomUUID();
            UUID userId = UUID.randomUUID();
            Room room = room(roomId, user(UUID.randomUUID(), "Alice"), RoomStatus.IN_PROGRESS);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));

            assertThatThrownBy(() -> battleService.joinRoom(roomId, userId))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Room already started");

            verify(roomMemberRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("leaveRoom")
    class LeaveRoom {
        @Test
        @DisplayName("Xóa phòng WAITING khi thành viên cuối cùng rời phòng")
        void shouldDeleteWaitingRoomWhenLastMemberLeaves() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.WAITING);
            RoomMember creatorMember = member(room, creator, true);
            room.getMembers().add(creatorMember);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomMemberRepository.findByRoomIdAndUserId(roomId, creator.getId())).thenReturn(Optional.of(creatorMember));

            Optional<BattleRoomDto> dto = battleService.leaveRoom(roomId, creator.getId());

            assertThat(dto).isEmpty();
            verify(roomMemberRepository).delete(creatorMember);
            verify(roomRepository).delete(room);
        }

        @Test
        @DisplayName("Chuyển chủ phòng khi creator rời nhưng vẫn còn member")
        void shouldTransferCreatorWhenCreatorLeaves() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            User bob = user(UUID.randomUUID(), "Bob");
            Room room = room(roomId, creator, RoomStatus.WAITING);
            RoomMember creatorMember = member(room, creator, true);
            RoomMember bobMember = member(room, bob, false);
            room.getMembers().add(creatorMember);
            room.getMembers().add(bobMember);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomMemberRepository.findByRoomIdAndUserId(roomId, creator.getId())).thenReturn(Optional.of(creatorMember));
            when(roomRepository.save(room)).thenReturn(room);
            when(battleRoomProblemRepository.findByRoomIdOrderByOrderAsc(roomId)).thenReturn(List.of());

            Optional<BattleRoomDto> dto = battleService.leaveRoom(roomId, creator.getId());

            assertThat(dto).isPresent();
            assertThat(dto.get().getCreatorId()).isEqualTo(bob.getId());
            assertThat(dto.get().getMemberCount()).isEqualTo(1);
            assertThat(dto.get().getMembers().getFirst().isCreator()).isTrue();
            assertThat(dto.get().getMembers().getFirst().isReady()).isTrue();
            verify(roomMemberRepository).delete(creatorMember);
            verify(roomRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Kết thúc phòng IN_PROGRESS khi thành viên cuối cùng rời trận")
        void shouldFinishInProgressRoomWhenLastMemberLeaves() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.IN_PROGRESS);
            RoomMember creatorMember = member(room, creator, true);
            room.getMembers().add(creatorMember);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomMemberRepository.findByRoomIdAndUserId(roomId, creator.getId())).thenReturn(Optional.of(creatorMember));
            when(roomRepository.save(room)).thenReturn(room);
            when(battleRoomProblemRepository.findByRoomIdOrderByOrderAsc(roomId)).thenReturn(List.of());

            Optional<BattleRoomDto> dto = battleService.leaveRoom(roomId, creator.getId());

            assertThat(dto).isPresent();
            assertThat(dto.get().getStatus()).isEqualTo(RoomStatus.FINISHED);
            assertThat(dto.get().getMemberCount()).isZero();
            verify(roomMemberRepository).delete(creatorMember);
            verify(roomRepository, never()).delete(any());
        }

        @Test
        @DisplayName("Cho phép rời phòng đã FINISHED")
        void shouldAllowLeavingFinishedRoom() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            User bob = user(UUID.randomUUID(), "Bob");
            Room room = room(roomId, creator, RoomStatus.FINISHED);
            RoomMember creatorMember = member(room, creator, true);
            RoomMember bobMember = member(room, bob, false);
            room.getMembers().add(creatorMember);
            room.getMembers().add(bobMember);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomMemberRepository.findByRoomIdAndUserId(roomId, bob.getId())).thenReturn(Optional.of(bobMember));
            when(roomRepository.save(room)).thenReturn(room);
            when(battleRoomProblemRepository.findByRoomIdOrderByOrderAsc(roomId)).thenReturn(List.of());

            Optional<BattleRoomDto> dto = battleService.leaveRoom(roomId, bob.getId());

            assertThat(dto).isPresent();
            assertThat(dto.get().getStatus()).isEqualTo(RoomStatus.FINISHED);
            assertThat(dto.get().getMemberCount()).isEqualTo(1);
            verify(roomMemberRepository).delete(bobMember);
        }
    }

    @Nested
    @DisplayName("startRoom")
    class StartRoom {
        @Test
        @DisplayName("Chỉ creator được start phòng")
        void shouldRejectStartByNonCreator() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.WAITING);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));

            assertThatThrownBy(() -> battleService.startRoom(roomId, UUID.randomUUID()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Only room creator");
        }

        @Test
        @DisplayName("Start phòng, set thời gian và gán problem")
        void shouldStartRoomAndAssignProblems() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.WAITING);
            room.getMembers().add(member(room, creator, true));
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomMemberRepository.existsByRoomIdAndUserId(roomId, creator.getId())).thenReturn(true);
            when(roomMemberRepository.countByRoomId(roomId)).thenReturn(2L);
            when(problemRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(problem("A"), problem("B"))));
            when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(battleRoomProblemRepository.existsByRoomId(roomId)).thenReturn(false);
            when(battleRoomProblemRepository.save(any(BattleRoomProblem.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(battleRoomProblemRepository.findByRoomIdOrderByOrderAsc(roomId)).thenReturn(List.of());

            BattleRoomDto dto = battleService.startRoom(roomId, creator.getId());

            assertThat(dto.getStatus()).isEqualTo(RoomStatus.IN_PROGRESS);
            assertThat(dto.getStartTime()).isNotNull();
            assertThat(dto.getEndTime()).isAfter(dto.getStartTime());
            verify(battleRoomProblemRepository, times(2)).save(any(BattleRoomProblem.class));
        }

        @Test
        @DisplayName("Báo lỗi khi không đủ problem published")
        void shouldRejectWhenNotEnoughProblems() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.WAITING);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomMemberRepository.existsByRoomIdAndUserId(roomId, creator.getId())).thenReturn(true);
            when(roomMemberRepository.countByRoomId(roomId)).thenReturn(2L);
            when(problemRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(problem("A"))));

            assertThatThrownBy(() -> battleService.startRoom(roomId, creator.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Not enough published problems");
        }

        @Test
        @DisplayName("Cần ít nhất 2 thành viên để start phòng")
        void shouldRequireAtLeastTwoMembersToStart() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.WAITING);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomMemberRepository.existsByRoomIdAndUserId(roomId, creator.getId())).thenReturn(true);
            when(roomMemberRepository.countByRoomId(roomId)).thenReturn(1L);

            assertThatThrownBy(() -> battleService.startRoom(roomId, creator.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("At least 2 members");
        }
    }

    @Nested
    @DisplayName("update/delete")
    class UpdateDelete {
        @Test
        @DisplayName("Creator có thể cập nhật phòng đang WAITING")
        void shouldUpdateWaitingRoom() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.WAITING);
            BattleRoomCreateRequest request = createRequest();
            request.setName("Updated Battle");
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));
            when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(battleRoomProblemRepository.findByRoomIdOrderByOrderAsc(roomId)).thenReturn(List.of());

            BattleRoomDto dto = battleService.updateRoom(roomId, creator.getId(), request);

            assertThat(dto.getName()).isEqualTo("Updated Battle");
        }

        @Test
        @DisplayName("Không cho xóa phòng đã start")
        void shouldRejectDeleteStartedRoom() {
            UUID roomId = UUID.randomUUID();
            User creator = user(UUID.randomUUID(), "Alice");
            Room room = room(roomId, creator, RoomStatus.IN_PROGRESS);
            when(roomRepository.findDetailedByIdForUpdate(roomId)).thenReturn(Optional.of(room));

            assertThatThrownBy(() -> battleService.deleteRoom(roomId, creator.getId()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Room already started");

            verify(roomRepository, never()).delete(any());
        }
    }

    @Test
    @DisplayName("Chặn submit khi phòng đã hết giờ")
    void shouldRejectSubmitAfterRoomEndTime() {
        UUID roomId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Room room = room(roomId, user(UUID.randomUUID(), "Alice"), RoomStatus.IN_PROGRESS);
        room.setEndTime(OffsetDateTime.now().minusSeconds(1));
        when(roomRepository.findDetailedById(roomId)).thenReturn(Optional.of(room));

        assertThatThrownBy(() -> battleService.assertCanSubmit(roomId, userId))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Room time is over");
    }
}
