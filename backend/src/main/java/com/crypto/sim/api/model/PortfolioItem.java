package com.crypto.sim.api.model;

public record PortfolioItem(
        String asset,
        double amount,
        double avgPrice,
        double totalInvested
) {
}
