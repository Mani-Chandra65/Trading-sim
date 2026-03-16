package com.crypto.sim.api.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.crypto.sim.api.dto.AuthRequests;
import com.crypto.sim.api.entity.AuthTokenEntity;
import com.crypto.sim.api.entity.UserAccountEntity;
import com.crypto.sim.api.exception.ConflictException;
import com.crypto.sim.api.exception.NotFoundException;
import com.crypto.sim.api.exception.UnauthorizedException;
import com.crypto.sim.api.model.AuthSession;
import com.crypto.sim.api.model.UserSession;
import com.crypto.sim.api.repository.AuthTokenRepository;
import com.crypto.sim.api.repository.UserAccountRepository;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final AuthTokenRepository authTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final long tokenTtlHours;
    private final long rollingRefreshMinutes;

    public AuthService(UserAccountRepository userAccountRepository,
                       AuthTokenRepository authTokenRepository,
                       PasswordEncoder passwordEncoder,
                       @Value("${app.auth.token-ttl-hours:12}") long tokenTtlHours,
                       @Value("${app.auth.rolling-refresh-minutes:30}") long rollingRefreshMinutes) {
        this.userAccountRepository = userAccountRepository;
        this.authTokenRepository = authTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenTtlHours = tokenTtlHours;
        this.rollingRefreshMinutes = rollingRefreshMinutes;
    }

    public AuthSession register(AuthRequests.RegisterRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.name()) || isBlank(request.password())) {
            throw new IllegalArgumentException("Name and email are required");
        }

        if (userAccountRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("Email already registered. Please login instead.");
        }

        UserAccountEntity entity = new UserAccountEntity();
        entity.setUserKey("user_" + UUID.randomUUID());
        entity.setName(request.name());
        entity.setEmail(request.email().toLowerCase());
        entity.setPassword(passwordEncoder.encode(request.password()));
        entity.setDemo(false);
        entity.setCreatedAt(Instant.now());
        UserSession session = toSession(userAccountRepository.save(entity));
        return toAuthSession(session, issueToken(session.userKey()));
    }

    public AuthSession login(AuthRequests.LoginRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.password())) {
            throw new IllegalArgumentException("Email is required");
        }

        UserAccountEntity entity = userAccountRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (entity.isDemo() || !passwordMatches(entity, request.password())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        UserSession session = toSession(entity);
        return toAuthSession(session, issueToken(session.userKey()));
    }

    public AuthSession demo(AuthRequests.DemoLoginRequest request) {
        String name = request != null && !isBlank(request.name()) ? request.name() : "Demo Trader";
        UserAccountEntity entity = new UserAccountEntity();
        entity.setUserKey("demo_" + UUID.randomUUID());
        entity.setName(name);
        entity.setEmail(null);
        entity.setPassword(null);
        entity.setDemo(true);
        entity.setCreatedAt(Instant.now());
        UserSession session = toSession(userAccountRepository.save(entity));
        return toAuthSession(session, issueToken(session.userKey()));
    }

    public UserSession getByKey(String userKey) {
        return userAccountRepository.findByUserKey(userKey)
                .map(this::toSession)
                .orElseThrow(() -> new NotFoundException("User session not found"));
    }

    public UserSession authorize(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        AuthTokenEntity authToken = requireActiveToken(token);
        maybeRollExpiry(authToken);
        return getByKey(authToken.getUserKey());
    }

    public AuthSession refreshSession(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        AuthTokenEntity authToken = requireActiveToken(token);
        AuthTokenEntity refreshed = extendExpiry(authToken);
        UserSession user = getByKey(refreshed.getUserKey());
        return toAuthSession(user, refreshed);
    }

    public void logout(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        authTokenRepository.deleteByToken(token);
    }

    private UserSession toSession(UserAccountEntity entity) {
        return new UserSession(
                entity.getUserKey(),
                entity.getName(),
                entity.getEmail(),
                entity.isDemo(),
                entity.getCreatedAt());
    }

    private boolean passwordMatches(UserAccountEntity entity, String rawPassword) {
        String storedPassword = entity.getPassword();
        if (storedPassword == null || storedPassword.isBlank()) {
            return false;
        }

        if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2y$")) {
            try {
                return passwordEncoder.matches(rawPassword, storedPassword);
            } catch (IllegalArgumentException ex) {
                // Treat malformed password hashes as invalid credentials for login UX consistency.
                return false;
            }
        }

        if (rawPassword.equals(storedPassword)) {
            entity.setPassword(passwordEncoder.encode(rawPassword));
            userAccountRepository.save(entity);
            return true;
        }

        return false;
    }

    private AuthTokenEntity issueToken(String userKey) {
        authTokenRepository.deleteByUserKey(userKey);
        authTokenRepository.flush();

        AuthTokenEntity entity = new AuthTokenEntity();
        entity.setUserKey(userKey);
        entity.setToken("sim_" + UUID.randomUUID());

        try {
            return extendExpiry(entity);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent login/register can race on unique userKey token row.
            return authTokenRepository.findByUserKey(userKey)
                    .map(this::extendExpiry)
                    .orElseThrow(() -> ex);
        }
    }

    private AuthTokenEntity requireActiveToken(String token) {
        AuthTokenEntity authToken = authTokenRepository.findByToken(token)
                .orElseThrow(() -> new UnauthorizedException("Invalid authorization token"));

        if (authToken.getExpiresAt() == null || authToken.getExpiresAt().isBefore(Instant.now())) {
            authTokenRepository.deleteByToken(token);
            throw new UnauthorizedException("Session expired. Please login again");
        }

        return authToken;
    }

    private void maybeRollExpiry(AuthTokenEntity authToken) {
        Instant threshold = Instant.now().plus(rollingRefreshMinutes, ChronoUnit.MINUTES);
        if (authToken.getExpiresAt() != null && authToken.getExpiresAt().isBefore(threshold)) {
            extendExpiry(authToken);
        }
    }

    private AuthTokenEntity extendExpiry(AuthTokenEntity authToken) {
        Instant now = Instant.now();
        authToken.setIssuedAt(now);
        authToken.setExpiresAt(now.plus(tokenTtlHours, ChronoUnit.HOURS));
        return authTokenRepository.save(authToken);
    }

    private AuthSession toAuthSession(UserSession userSession, AuthTokenEntity authToken) {
        return new AuthSession(userSession, authToken.getToken(), authToken.getExpiresAt());
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new UnauthorizedException("Missing authorization token");
        }

        if (!authorizationHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Authorization header must use Bearer token");
        }

        String token = authorizationHeader.substring("Bearer ".length()).trim();
        if (token.isBlank()) {
            throw new UnauthorizedException("Authorization token is empty");
        }
        return token;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
