package com.crypto.sim.api.model;

import java.time.Instant;

public record TradeEntry(
        long id,
        String pair,
        String type,
        double amount,
        double price,
        double total,
        Instant timestamp
) {
}
