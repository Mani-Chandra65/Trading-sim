package com.crypto.sim.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthRequests {
    private AuthRequests() {
    }

    public record RegisterRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 120, message = "Name is too long")
        String name,
        @NotBlank(message = "Email is required")
        @Email(message = "Email format is invalid")
        String email,
        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        String password
    ) {
    }

    public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Email format is invalid")
        String email,
        @NotBlank(message = "Password is required")
        String password
    ) {
    }

    public record DemoLoginRequest(
        @Size(max = 120, message = "Name is too long")
        String name
    ) {
    }
}
