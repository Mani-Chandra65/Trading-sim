package com.crypto.sim.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crypto.sim.api.dto.ApiResponse;
import com.crypto.sim.api.dto.AuthRequests;
import com.crypto.sim.api.model.AuthSession;
import com.crypto.sim.api.model.UserSession;
import com.crypto.sim.api.service.AuthService;
import com.crypto.sim.api.service.WalletService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final WalletService walletService;

    public AuthController(AuthService authService, WalletService walletService) {
        this.authService = authService;
        this.walletService = walletService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthSession> register(@Valid @RequestBody AuthRequests.RegisterRequest request) {
        AuthSession session = authService.register(request);
        walletService.getOrInit(session.user());
        return ApiResponse.ok("Registered successfully", session);
    }

    @PostMapping("/login")
    public ApiResponse<AuthSession> login(@Valid @RequestBody AuthRequests.LoginRequest request) {
        AuthSession session = authService.login(request);
        walletService.getOrInit(session.user());
        return ApiResponse.ok("Login successful", session);
    }

    @PostMapping("/demo")
    public ApiResponse<AuthSession> demo(@Valid @RequestBody(required = false) AuthRequests.DemoLoginRequest request) {
        AuthSession session = authService.demo(request);
        walletService.getOrInit(session.user());
        return ApiResponse.ok("Demo login successful", session);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestHeader("Authorization") String authorizationHeader) {
        authService.logout(authorizationHeader);
        return ApiResponse.ok("Logout successful", null);
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthSession> refresh(@RequestHeader("Authorization") String authorizationHeader) {
        return ApiResponse.ok("Session refreshed", authService.refreshSession(authorizationHeader));
    }

    @GetMapping("/me")
    public ApiResponse<UserSession> me(@RequestHeader("Authorization") String authorizationHeader) {
        return ApiResponse.ok("Session found", authService.authorize(authorizationHeader));
    }
}
