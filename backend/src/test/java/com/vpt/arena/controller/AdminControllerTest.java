package com.vpt.arena.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vpt.arena.config.AppConfig;
import com.vpt.arena.config.SecurityConfig;
import com.vpt.arena.dto.admin.AdminBanUserRequest;
import com.vpt.arena.dto.admin.AdminUserDto;
import com.vpt.arena.dto.admin.AdminUserListResponse;
import com.vpt.arena.entity.User;
import com.vpt.arena.entity.enums.Role;
import com.vpt.arena.security.CustomUserDetails;
import com.vpt.arena.service.AdminUserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, AppConfig.class})
@ActiveProfiles("test")
@DisplayName("AdminController Tests")
class AdminControllerTest {
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean AdminUserService adminUserService;

    private static final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("GET /admin/users trả danh sách user")
    void shouldListUsers() throws Exception {
        when(adminUserService.listUsers(any(), eq("alice"), eq(0), eq(20)))
            .thenReturn(new AdminUserListResponse(List.of(adminUser(false)), 0, 20, 1, 1));

        mockMvc.perform(get("/api/v1/admin/users")
                .with(authenticated(Role.ADMIN))
                .param("search", "alice"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.items[0].email").value("alice@example.com"))
            .andExpect(jsonPath("$.totalItems").value(1));
    }

    @Test
    @DisplayName("PUT /admin/users/{id}/ban cập nhật banned")
    void shouldBanUser() throws Exception {
        AdminBanUserRequest request = new AdminBanUserRequest();
        request.setBanned(true);
        request.setReason("Spam");
        when(adminUserService.updateBanStatus(any(), eq(USER_ID), any())).thenReturn(adminUser(true));

        mockMvc.perform(put("/api/v1/admin/users/" + USER_ID + "/ban")
                .with(authenticated(Role.ADMIN))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.banned").value(true));
    }

    @Test
    @DisplayName("User thường bị chặn khỏi admin API")
    void shouldRejectNonAdmin() throws Exception {
        when(adminUserService.listUsers(any(), any(), any(Integer.class), any(Integer.class)))
            .thenThrow(new ResponseStatusException(FORBIDDEN, "Admin role required"));

        mockMvc.perform(get("/api/v1/admin/users").with(authenticated(Role.USER)))
            .andExpect(status().isForbidden());
    }

    private AdminUserDto adminUser(boolean banned) {
        return AdminUserDto.builder()
            .id(USER_ID)
            .publicId("1000000001")
            .email("alice@example.com")
            .name("Alice")
            .role(Role.USER)
            .emailVerified(true)
            .banned(banned)
            .createdAt(OffsetDateTime.now())
            .updatedAt(OffsetDateTime.now())
            .build();
    }

    private org.springframework.test.web.servlet.request.RequestPostProcessor authenticated(Role role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(role.name().toLowerCase() + "@example.com");
        user.setName(role.name());
        user.setRole(role);
        CustomUserDetails principal = new CustomUserDetails(user);
        return authentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
            principal,
            null,
            principal.getAuthorities()
        ));
    }
}
