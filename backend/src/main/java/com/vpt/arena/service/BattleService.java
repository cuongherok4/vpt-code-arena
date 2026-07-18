package com.vpt.arena.service;

import com.vpt.arena.dto.battle.BattleInviteDto;
import com.vpt.arena.dto.battle.BattleMemberDto;
import com.vpt.arena.dto.battle.BattleProblemDto;
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
import com.vpt.arena.repository.FriendshipRepository;
import com.vpt.arena.repository.ProblemRepository;
import com.vpt.arena.repository.RoomMemberRepository;
import com.vpt.arena.repository.RoomRepository;
import com.vpt.arena.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BattleService {

    private final RoomRepository roomRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final BattleRoomProblemRepository battleRoomProblemRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final BattleRealtimeNotifier battleRealtimeNotifier;
    private final FriendshipRepository friendshipRepository;

    @Transactional(readOnly = true)
    public List<BattleRoomDto> listPublicWaitingRooms() {
        return roomRepository.findByIsPublicTrueAndStatusOrderByCreatedAtDesc(RoomStatus.WAITING)
            .stream()
            .map(this::toDtoWithoutProblems)
            .toList();
    }

    @Transactional(readOnly = true)
    public BattleRoomDto getRoom(UUID roomId) {
        Room room = findRoom(roomId);
        return toDto(room);
    }

    @Transactional
    public BattleRoomDto createRoom(UUID userId, BattleRoomCreateRequest request) {
        User creator = findUser(userId);

        Room room = new Room();
        room.setCreator(creator);
        room.setName(request.getName().trim());
        room.setPublic(request.isPublic());
        room.setMaxMembers(request.getMaxMembers());
        room.setNumProblems(request.getNumProblems());
        room.setTimeLimitMin(request.getTimeLimitMin());
        room.setDifficulty(request.getDifficulty());
        room.setTopic(blankToNull(request.getTopic()));
        room = roomRepository.save(room);

        RoomMember creatorMember = new RoomMember();
        creatorMember.setRoom(room);
        creatorMember.setUser(creator);
        creatorMember.setReady(true);
        roomMemberRepository.save(creatorMember);
        room.getMembers().add(creatorMember);

        return toDto(room);
    }

    @Transactional
    public BattleRoomDto joinRoom(UUID roomId, UUID userId) {
        Room room = findRoomForUpdate(roomId);
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room already started");
        }
        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            return toDto(room);
        }
        if (roomMemberRepository.countByRoomId(roomId) >= room.getMaxMembers()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is full");
        }

        User user = findUser(userId);
        RoomMember member = new RoomMember();
        member.setRoom(room);
        member.setUser(user);
        member = roomMemberRepository.save(member);
        room.getMembers().add(member);

        return toDto(room);
    }

    @Transactional
    public Optional<BattleRoomDto> leaveRoom(UUID roomId, UUID userId) {
        Room room = findRoomForUpdate(roomId);

        Optional<RoomMember> member = roomMemberRepository.findByRoomIdAndUserId(roomId, userId);
        if (member.isEmpty()) {
            return Optional.of(toDto(room));
        }

        room.getMembers().removeIf(item -> item.getUser().getId().equals(userId));
        roomMemberRepository.delete(member.get());

        if (room.getMembers().isEmpty()) {
            if (room.getStatus() == RoomStatus.WAITING) {
                roomRepository.delete(room);
                return Optional.empty();
            }
            room.setStatus(RoomStatus.FINISHED);
            return Optional.of(toDto(roomRepository.save(room)));
        }

        if (room.getCreator().getId().equals(userId)) {
            RoomMember nextCreator = room.getMembers().stream()
                .min(Comparator.comparing(RoomMember::getJoinedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElseThrow();
            nextCreator.setReady(true);
            room.setCreator(nextCreator.getUser());
        }

        return Optional.of(toDto(roomRepository.save(room)));
    }

    @Transactional
    public BattleRoomDto updateRoom(UUID roomId, UUID userId, BattleRoomCreateRequest request) {
        Room room = findRoomForUpdate(roomId);
        ensureCreator(room, userId);
        ensureWaiting(room);

        room.setName(request.getName().trim());
        room.setPublic(request.isPublic());
        room.setMaxMembers(request.getMaxMembers());
        room.setNumProblems(request.getNumProblems());
        room.setTimeLimitMin(request.getTimeLimitMin());
        room.setDifficulty(request.getDifficulty());
        room.setTopic(blankToNull(request.getTopic()));
        Room saved = roomRepository.save(room);

        return toDto(saved);
    }

    @Transactional
    public void deleteRoom(UUID roomId, UUID userId) {
        Room room = findRoomForUpdate(roomId);
        ensureCreator(room, userId);
        ensureWaiting(room);
        roomRepository.delete(room);
    }

    @Transactional
    public BattleRoomDto startRoom(UUID roomId, UUID userId) {
        Room room = findRoomForUpdate(roomId);
        ensureCreator(room, userId);
        ensureWaiting(room);
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a room member");
        }
        if (roomMemberRepository.countByRoomId(roomId) < 2) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "At least 2 members are required to start the room");
        }

        List<Problem> problems = selectProblems(room.getDifficulty(), room.getTopic(), room.getNumProblems());
        if (problems.size() < room.getNumProblems()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Not enough published problems for room filters");
        }

        OffsetDateTime now = OffsetDateTime.now();
        room.setStatus(RoomStatus.IN_PROGRESS);
        room.setStartTime(now);
        room.setEndTime(now.plusMinutes(room.getTimeLimitMin()));
        Room saved = roomRepository.save(room);

        if (!battleRoomProblemRepository.existsByRoomId(roomId)) {
            for (int i = 0; i < problems.size(); i++) {
                BattleRoomProblem roomProblem = new BattleRoomProblem();
                roomProblem.setRoom(saved);
                roomProblem.setProblem(problems.get(i));
                roomProblem.setOrder(i + 1);
                battleRoomProblemRepository.save(roomProblem);
            }
        }

        BattleRoomDto dto = toDto(saved);
        battleRealtimeNotifier.publishStarted(dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public BattleInviteDto inviteFriend(UUID roomId, UUID inviterId, UUID inviteeId) {
        if (inviterId.equals(inviteeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot invite yourself");
        }
        Room room = findRoom(roomId);
        ensureCreator(room, inviterId);
        ensureWaiting(room);
        if (!friendshipRepository.existsByUserIdAndFriendId(inviterId, inviteeId)
                && !friendshipRepository.existsByUserIdAndFriendId(inviteeId, inviterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only friends can be invited to battle rooms");
        }
        if (roomMemberRepository.existsByRoomIdAndUserId(roomId, inviteeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User is already in this room");
        }
        if (roomMemberRepository.countByRoomId(roomId) >= room.getMaxMembers()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is full");
        }
        User invitee = findUser(inviteeId);
        BattleInviteDto invite = new BattleInviteDto(room.getId(), room.getName(), room.getCreator().getId(), room.getCreator().getName(), invitee.getId());
        battleRealtimeNotifier.publishInvite(invite);
        return invite;
    }

    @Transactional
    public BattleRoomDto kickMember(UUID roomId, UUID creatorId, UUID targetUserId) {
        if (creatorId.equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Creator cannot kick themselves");
        }
        Room room = findRoomForUpdate(roomId);
        ensureCreator(room, creatorId);
        ensureWaiting(room);

        RoomMember target = roomMemberRepository.findByRoomIdAndUserId(roomId, targetUserId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found"));
        room.getMembers().removeIf(member -> member.getUser().getId().equals(targetUserId));
        roomMemberRepository.delete(target);
        battleRealtimeNotifier.publishMemberKicked(roomId, targetUserId);

        return toDto(roomRepository.save(room));
    }

    @Transactional(readOnly = true)
    public void assertCanSubmit(UUID roomId, UUID userId) {
        Room room = findRoom(roomId);
        if (room.getStatus() != RoomStatus.IN_PROGRESS) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is not in progress");
        }
        if (room.getEndTime() != null && OffsetDateTime.now().isAfter(room.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room time is over");
        }
        if (!roomMemberRepository.existsByRoomIdAndUserId(roomId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is not a room member");
        }
    }

    private Room findRoom(UUID roomId) {
        return roomRepository.findDetailedById(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    private Room findRoomForUpdate(UUID roomId) {
        return roomRepository.findDetailedByIdForUpdate(roomId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private void ensureCreator(Room room, UUID userId) {
        if (!room.getCreator().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only room creator can perform this action");
        }
    }

    private void ensureWaiting(Room room) {
        if (room.getStatus() != RoomStatus.WAITING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room already started");
        }
    }

    private List<Problem> selectProblems(Difficulty difficulty, String topic, int limit) {
        return problemRepository.findAll(
            publishedProblems(difficulty, topic),
            PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "difficulty", "title"))
        ).getContent();
    }

    private Specification<Problem> publishedProblems(Difficulty difficulty, String topic) {
        return (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isTrue(root.get("isPublished")));
            if (difficulty != null) {
                predicates.add(criteriaBuilder.equal(root.get("difficulty"), difficulty));
            }
            if (topic != null) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("topic")), topic.toLowerCase(Locale.ROOT)));
            }
            return criteriaBuilder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }

    private BattleRoomDto toDto(Room room) {
        List<BattleProblemDto> problems = battleRoomProblemRepository.findByRoomIdOrderByOrderAsc(room.getId())
            .stream()
            .map(this::toProblemDto)
            .toList();
        return toDto(room, problems);
    }

    private BattleRoomDto toDtoWithoutProblems(Room room) {
        return toDto(room, List.of());
    }

    private BattleRoomDto toDto(Room room, List<BattleProblemDto> problems) {
        List<BattleMemberDto> members = room.getMembers().stream()
            .sorted(Comparator.comparing(RoomMember::getJoinedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(member -> toMemberDto(member, room.getCreator().getId()))
            .toList();
        return new BattleRoomDto(
            room.getId(),
            room.getName(),
            room.getStatus(),
            room.isPublic(),
            room.getMaxMembers(),
            room.getNumProblems(),
            room.getTimeLimitMin(),
            room.getDifficulty(),
            room.getTopic(),
            room.getStartTime(),
            room.getEndTime(),
            room.getCreator().getId(),
            room.getCreator().getName(),
            members.size(),
            members,
            problems
        );
    }

    private BattleMemberDto toMemberDto(RoomMember member, UUID creatorId) {
        User user = member.getUser();
        return new BattleMemberDto(
            user.getId(),
            user.getName(),
            member.isReady(),
            user.getId().equals(creatorId),
            member.getJoinedAt()
        );
    }

    private BattleProblemDto toProblemDto(BattleRoomProblem roomProblem) {
        Problem problem = roomProblem.getProblem();
        return new BattleProblemDto(
            problem.getId(),
            problem.getTitle(),
            problem.getDifficulty(),
            problem.getTopic(),
            roomProblem.getOrder()
        );
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
