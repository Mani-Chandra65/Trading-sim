package com.crypto.sim.api.model;

import java.time.Instant;

public record WalletTransaction(
        long id,
        String type,
        String currency,
        double amount,
        String description,
        Instant timestamp
) {
}
