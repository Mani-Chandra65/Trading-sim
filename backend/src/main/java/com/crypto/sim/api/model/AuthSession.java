package com.crypto.sim.api.model;

import java.time.Instant;

public record AuthSession(
        UserSession user,
        String token,
        Instant tokenExpiresAt
) {
}