package com.crypto.sim.api.model;

import java.util.List;

public record MarketSnapshot(
        String pair,
        String timeframe,
        String source,
        double currentPrice,
        double changePercent,
        double change24h,
        double change24hPercent,
        double high24h,
        double low24h,
        double volume24hBase,
        double volume24hQuote,
        List<PricePoint> history,
        List<OrderBookLevel> bids,
        List<OrderBookLevel> asks
) {
}
