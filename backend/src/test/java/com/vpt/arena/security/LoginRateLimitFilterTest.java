package com.vpt.arena.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("LoginRateLimitFilter Unit Tests")
class LoginRateLimitFilterTest {

    @Test
    @DisplayName("Cho phép 5 lần login mỗi phút cho cùng IP")
    void shouldAllowConfiguredNumberOfLoginAttempts() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(5, 60);
        AtomicInteger calls = new AtomicInteger();
        FilterChain chain = (request, response) -> calls.incrementAndGet();

        for (int i = 0; i < 5; i++) {
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilter(request("10.0.0.1"), response, chain);

            assertThat(response.getStatus()).isEqualTo(200);
        }

        assertThat(calls).hasValue(5);
    }

    @Test
    @DisplayName("Chặn lần login thứ 6 cùng IP")
    void shouldBlockSixthLoginAttempt() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(5, 60);
        FilterChain chain = (request, response) -> {};

        for (int i = 0; i < 5; i++) {
            filter.doFilter(request("10.0.0.2"), new MockHttpServletResponse(), chain);
        }

        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request("10.0.0.2"), response, chain);

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isNotBlank();
        assertThat(response.getContentAsString()).contains("Too many login attempts");
    }

    @Test
    @DisplayName("IP khác có bucket độc lập")
    void shouldUseSeparateBucketPerIp() throws Exception {
        LoginRateLimitFilter filter = new LoginRateLimitFilter(1, 60);
        AtomicInteger calls = new AtomicInteger();
        FilterChain chain = (request, response) -> calls.incrementAndGet();

        filter.doFilter(request("10.0.0.3"), new MockHttpServletResponse(), chain);
        filter.doFilter(request("10.0.0.4"), new MockHttpServletResponse(), chain);

        assertThat(calls).hasValue(2);
    }

    private MockHttpServletRequest request(String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        request.setRemoteAddr(ip);
        return request;
    }
}
