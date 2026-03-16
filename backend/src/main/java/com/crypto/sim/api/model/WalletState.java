package com.crypto.sim.api.model;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record WalletState(
        Map<String, Double> balance,
        List<PortfolioItem> portfolio,
        List<TradeEntry> tradeHistory,
        List<WalletTransaction> transactions,
        Instant lastUpdated
) {
}
