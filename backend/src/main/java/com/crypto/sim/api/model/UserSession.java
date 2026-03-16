package com.crypto.sim.api.model;

import java.time.Instant;

public record UserSession(
        String userKey,
        String name,
        String email,
        boolean isDemo,
        Instant createdAt
) {
}
