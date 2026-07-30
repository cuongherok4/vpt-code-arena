package com.vpt.arena.service;

import com.vpt.arena.dto.admin.AdminBanUserRequest;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.repository.UserRepository;
import com.vpt.arena.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
@DisplayName("AdminUserService Unit Tests")
class AdminUserServiceTest {
    @Mock private UserRepository userRepository;

    @Test
    @DisplayName("Admin xem danh sách user có search và paging")
    void shouldListUsersForAdmin() {
        AdminUserService service = new AdminUserService(userRepository);
        User user = user(UUID.randomUUID(), "bob@example.com", Role.USER);
        when(userRepository.searchForAdmin(eq("bob"), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(user)));

        var result = service.listUsers(principal(Role.ADMIN), " bob ", 0, 20);

        assertThat(result.getItems()).hasSize(1);
        assertThat(result.getItems().getFirst().getEmail()).isEqualTo("bob@example.com");
        assertThat(result.getPage()).isZero();
        verify(userRepository).searchForAdmin(eq("bob"), any(Pageable.class));
    }

    @Test
    @DisplayName("User thường không được xem admin users")
    void shouldRejectNonAdmin() {
        AdminUserService service = new AdminUserService(userRepository);

        assertThatThrownBy(() -> service.listUsers(principal(Role.USER), null, 0, 20))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Admin role required");
    }

    @Test
    @DisplayName("Admin ban user")
    void shouldBanUser() {
        AdminUserService service = new AdminUserService(userRepository);
        UUID targetId = UUID.randomUUID();
        User target = user(targetId, "target@example.com", Role.USER);
        AdminBanUserRequest request = new AdminBanUserRequest();
        request.setBanned(true);

        when(userRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.updateBanStatus(principal(Role.ADMIN), targetId, request);

        assertThat(result.isBanned()).isTrue();
        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().isBanned()).isTrue();
    }

    @Test
    @DisplayName("Admin không tự ban chính mình")
    void shouldRejectSelfBan() {
        UUID adminId = UUID.randomUUID();
        AdminUserService service = new AdminUserService(userRepository);
        AdminBanUserRequest request = new AdminBanUserRequest();
        request.setBanned(true);

        assertThatThrownBy(() -> service.updateBanStatus(principal(adminId, Role.ADMIN), adminId, request))
            .isInstanceOf(ResponseStatusException.class)
            .hasMessageContaining("Admin cannot ban self");
    }

    private CustomUserDetails principal(Role role) {
        return principal(UUID.randomUUID(), role);
    }

    private CustomUserDetails principal(UUID id, Role role) {
        return new CustomUserDetails(user(id, role.name().toLowerCase() + "@example.com", role));
    }

    private User user(UUID id, String email, Role role) {
        User user = new User();
        user.setId(id);
        user.setPublicId("1000000001");
        user.setEmail(email);
        user.setName(email.substring(0, email.indexOf('@')));
        user.setRole(role);
        user.setEmailVerified(true);
        user.setCreatedAt(OffsetDateTime.now());
        user.setUpdatedAt(OffsetDateTime.now());
        return user;
    }
}
