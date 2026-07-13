# Auth Flow — JWT + OAuth2 (Google/GitHub)

> **Thư viện**: Spring Security + JJWT + Spring OAuth2 Client
> **Chiến lược**: Stateless JWT — access token (15 phút) + refresh token (7 ngày, lưu Redis)

---

## 1. Flow Đăng ký + Xác thực Email

```
[Client]                  [Spring Boot]                [PostgreSQL]  [Redis]  [Email]
   │                           │                             │           │       │
   │──POST /auth/register──────►│                             │           │       │
   │                           │── check email unique ───────►│           │       │
   │                           │◄─ OK ───────────────────────│           │       │
   │                           │── hash password (BCrypt)     │           │       │
   │                           │── INSERT user ───────────────►│           │       │
   │                           │── tạo EmailVerifyToken ───────►│           │       │
   │                           │── gửi email xác thực ──────────────────────────────►│
   │◄─ 201 "Check your email" ─│                             │           │       │
   │                           │                             │           │       │
   │──POST /auth/verify-email──►│                             │           │       │
   │  { token: "abc..." }      │── tìm token, check expiry ──►│           │       │
   │                           │── set is_email_verified=true─►│           │       │
   │◄─ 200 "Email verified" ───│                             │           │       │
```

### Code mẫu: AuthService.register()

```java
public void register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
        throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    User user = User.builder()
        .email(request.email())
        .passwordHash(passwordEncoder.encode(request.password()))
        .name(request.name())
        .role(Role.USER)
        .isEmailVerified(false)
        .build();
    userRepository.save(user);

    // Tạo token xác thực, lưu DB, gửi email
    String token = UUID.randomUUID().toString();
    emailVerifyTokenRepository.save(
        EmailVerifyToken.builder()
            .userId(user.getId())
            .token(token)
            .expiresAt(OffsetDateTime.now().plusHours(24))
            .build()
    );
    emailService.sendVerificationEmail(user.getEmail(), token);
}
```

---

## 2. Flow Đăng nhập (Email/Password)

```
[Client]                  [Spring Boot]                          [Redis]
   │                           │                                    │
   │──POST /auth/login─────────►│                                    │
   │  {email, password}        │── tìm user theo email              │
   │                           │── verify password (BCrypt.matches) │
   │                           │── check isEmailVerified = true     │
   │                           │── check isBanned = false           │
   │                           │── generate accessToken (15 min)    │
   │                           │── generate refreshToken            │
   │                           │── lưu refreshToken vào Redis ──────►│
   │                           │   key: session:refresh:{userId}    │
   │◄─ 200 {accessToken,       │                                    │
   │         refreshToken}     │                                    │
```

### JWT Token Structure

```java
// Access Token — expires 15 phút
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "USER",
  "iat": 1720893600,
  "exp": 1720894500   // +900 seconds
}

// JwtService.java
public String generateAccessToken(User user) {
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("email", user.getEmail())
        .claim("role", user.getRole().name())
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + accessExpiryMs))
        .signWith(getSigningKey())
        .compact();
}
```

### JwtAuthFilter — Request Filter

```java
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtService.validateAndExtract(token);
            UUID userId = UUID.fromString(claims.getSubject());

            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(
                    new CustomUserDetails(userId, claims.get("role", String.class)),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + claims.get("role")))
                );
            SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (JwtException e) {
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid token");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
```

---

## 3. Flow OAuth2 (Google / GitHub)

```
[Browser]           [Spring Boot]           [Google/GitHub]       [Redis]
   │                     │                        │                  │
   │──GET /auth/google───►│                        │                  │
   │                     │── redirect ──────────────►│                 │
   │                     │            [User đăng nhập Google]          │
   │◄── redirect ─────────│◄── auth code ───────────│                 │
   │ /login/oauth2/code/google                                         │
   │                     │── exchange code → access_token ───────────►│
   │                     │◄── user profile (email, name, avatar) ──────│
   │                     │                                             │
   │                     │── [OAuth2SuccessHandler]                    │
   │                     │   1. Tìm user theo email                    │
   │                     │   2. Nếu chưa có → tạo User mới            │
   │                     │      (oauth_provider, oauth_id, is_email_verified=true)
   │                     │   3. Generate JWT access + refresh token    │
   │                     │   4. Lưu refresh token vào Redis ───────────►│
   │                     │   5. Redirect FE kèm token trong URL        │
   │◄── redirect ─────────│                                             │
   │ http://localhost:5173/auth/callback?token=eyJ...&refresh=dGhp...  │
```

### OAuth2SuccessHandler.java

```java
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                         HttpServletResponse response,
                                         Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email    = extractEmail(oAuth2User);
        String name     = extractName(oAuth2User);
        String avatar   = extractAvatar(oAuth2User);
        String provider = extractProvider(authentication);
        String oauthId  = extractOAuthId(oAuth2User);

        // Upsert user
        User user = userRepository.findByEmail(email)
            .orElseGet(() -> userRepository.save(
                User.builder()
                    .email(email).name(name).avatar(avatar)
                    .oauthProvider(provider).oauthId(oauthId)
                    .isEmailVerified(true)  // OAuth email đã verified bởi provider
                    .role(Role.USER)
                    .build()
            ));

        String accessToken  = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        redisService.saveRefreshToken(user.getId(), refreshToken);

        String redirectUrl = frontendUrl + "/auth/callback"
            + "?token="   + accessToken
            + "&refresh=" + refreshToken;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
```

---

## 4. Flow Refresh Token

```
[Client]                  [Spring Boot]            [Redis]
   │                           │                      │
   │──POST /auth/refresh────────►│                      │
   │  { refreshToken: "..." }  │── parse userId từ refresh token
   │                           │── check Redis: session:refresh:{userId} ──►│
   │                           │◄─ stored token ─────────────────────────────│
   │                           │── compare tokens (chống reuse)              │
   │                           │── generate mới accessToken                  │
   │                           │── (rotate) generate mới refreshToken        │
   │                           │── update Redis với refreshToken mới ────────►│
   │◄─ 200 { accessToken }─────│                                              │
```

---

## 5. Flow Quên/Đặt lại mật khẩu

```
[Client]          [Spring Boot]          [DB]  [Email]
   │                   │                   │      │
   │──POST /forgot──────►│                   │      │
   │  {email}           │── tạo reset token ──►│      │
   │                   │── gửi email ─────────────────►│
   │◄─ 200 ────────────│                   │      │
   │                   │                   │      │
   │──POST /reset───────►│                   │      │
   │  {token, newPwd}  │── validate token (not expired, not used) ──►│
   │                   │── update password_hash ──────────────────────►│
   │                   │── mark token as used_at = NOW() ─────────────►│
   │                   │── xóa tất cả refresh tokens của user ──────────►Redis
   │◄─ 200 ────────────│                   │      │
```

---

## 6. Security Rules tóm tắt

| Endpoint pattern | Auth required | Role |
|---|---|---|
| `POST /auth/**` | ❌ Không | — |
| `GET /auth/google`, `GET /auth/github` | ❌ Không | — |
| `GET /exam/problems` | ❌ Không (public) | — |
| `GET /learn/chapters` | ❌ Không (public) | — |
| `POST /exam/problems/:id/submit` | ✅ Có | USER |
| `POST /battle/rooms` | ✅ Có | USER |
| `GET /users/me` | ✅ Có | USER |
| `GET /admin/**` | ✅ Có | ADMIN |
| Mọi API còn lại | ✅ Có | USER |
