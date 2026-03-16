package com.crypto.sim.api.model;

public record OrderBookLevel(
        double price,
        double amount,
        double total
) {
}
