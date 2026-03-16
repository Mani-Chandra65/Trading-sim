package com.crypto.sim.api.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.crypto.sim.api.model.MarketSnapshot;
import com.crypto.sim.api.model.OrderBookLevel;
import com.crypto.sim.api.model.PricePoint;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class MarketService {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String marketProvider;
    private final String binanceBaseUrl;

    private final Map<String, Double> currentPrices = new ConcurrentHashMap<>();
    private final Map<String, List<PricePoint>> historyByPair = new ConcurrentHashMap<>();
    private final Map<String, Double> basePrices = Map.of(
            "BTCUSDT", 70000.0,
            "ETHUSDT", 3500.0,
            "BNBUSDT", 600.0,
            "SOLUSDT", 150.0,
            "ADAUSDT", 1.0
    );

    public MarketService(ObjectMapper objectMapper,
                         @Value("${app.market.provider:binance}") String marketProvider,
                         @Value("${app.market.binance.base-url:https://api.binance.com}") String binanceBaseUrl,
                         @Value("${app.market.request-timeout-ms:5000}") int requestTimeoutMs) {
        this.objectMapper = objectMapper;
        this.marketProvider = marketProvider == null ? "binance" : marketProvider.trim().toLowerCase();
        this.binanceBaseUrl = stripTrailingSlash(binanceBaseUrl == null ? "https://api.binance.com" : binanceBaseUrl);
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(Math.max(1000, requestTimeoutMs)))
                .build();
    }

    public List<String> getPairs() {
        return basePrices.keySet().stream().sorted().toList();
    }

    public synchronized MarketSnapshot getSnapshot(String pair, String timeframe) {
        String normalizedPair = normalizePair(pair);
        String normalizedTimeframe = normalizeTimeframe(timeframe);

        if (useBinance()) {
            try {
                return getBinanceSnapshot(normalizedPair, normalizedTimeframe);
            } catch (Exception ex) {
                // Fall back to local simulation when remote API is unavailable.
            }
        }

        return getSimulatedSnapshot(normalizedPair, normalizedTimeframe);
    }

    public Map<String, Double> getCurrentPrices() {
        if (useBinance()) {
            try {
                return getBinancePrices();
            } catch (Exception ex) {
                // Fall back to simulated prices when remote API is unavailable.
            }
        }

        Map<String, Double> prices = new HashMap<>();
        for (String pair : basePrices.keySet()) {
            prices.put(pair.replace("USDT", ""), tickPrice(pair));
        }
        return prices;
    }

    private String normalizePair(String pair) {
        if (pair == null || !basePrices.containsKey(pair.toUpperCase())) {
            return "BTCUSDT";
        }
        return pair.toUpperCase();
    }

    private boolean useBinance() {
        return "binance".equals(marketProvider);
    }

    private MarketSnapshot getBinanceSnapshot(String pair, String timeframe) throws IOException, InterruptedException {
        double latestPrice = fetchBinanceTickerPrice(pair);
        List<PricePoint> history = fetchBinanceKlines(pair, timeframe);
        Map<String, List<OrderBookLevel>> orderBook = fetchBinanceOrderBook(pair);
        Market24hStats stats24h = fetchBinance24hStats(pair);
        double firstPrice = history.isEmpty() ? latestPrice : history.get(0).price();
        double changePercent = firstPrice == 0 ? 0 : ((latestPrice - firstPrice) / firstPrice) * 100;

        return new MarketSnapshot(
                pair,
                timeframe,
                "Binance",
                latestPrice,
                changePercent,
                stats24h.change(),
                stats24h.changePercent(),
                stats24h.high(),
                stats24h.low(),
                stats24h.volumeBase(),
                stats24h.volumeQuote(),
                history,
                orderBook.getOrDefault("bids", List.of()),
                orderBook.getOrDefault("asks", List.of())
        );
    }

    private Map<String, Double> getBinancePrices() throws IOException, InterruptedException {
        Map<String, Double> prices = new HashMap<>();
        for (String pair : basePrices.keySet()) {
            prices.put(pair.replace("USDT", ""), fetchBinanceTickerPrice(pair));
        }
        return prices;
    }

    private double fetchBinanceTickerPrice(String pair) throws IOException, InterruptedException {
        JsonNode node = getJson("/api/v3/ticker/price?symbol=" + encode(pair));
        JsonNode priceNode = node.get("price");
        if (priceNode == null) {
            throw new IllegalStateException("Missing price field from Binance ticker response");
        }
        return priceNode.asDouble();
    }

    private List<PricePoint> fetchBinanceKlines(String pair, String timeframe) throws IOException, InterruptedException {
        String normalizedTimeframe = normalizeTimeframe(timeframe);
        int limit = timeframeToHistoryLimit(normalizedTimeframe);
        String interval = timeframeToBinanceInterval(normalizedTimeframe);
        JsonNode root = getJson("/api/v3/klines?symbol=" + encode(pair) + "&interval=" + encode(interval) + "&limit=" + limit);

        List<PricePoint> history = new ArrayList<>();
        if (root.isArray()) {
            for (JsonNode candle : root) {
                if (!candle.isArray() || candle.size() < 5) {
                    continue;
                }

                long openTime = candle.get(0).asLong();
                double closePrice = parseDoubleNode(candle.get(4));
                history.add(new PricePoint(openTime, closePrice));
            }
        }

        return history;
    }

    private Market24hStats fetchBinance24hStats(String pair) throws IOException, InterruptedException {
        JsonNode node = getJson("/api/v3/ticker/24hr?symbol=" + encode(pair));
        return new Market24hStats(
                parseDoubleNode(node.get("priceChange")),
                parseDoubleNode(node.get("priceChangePercent")),
                parseDoubleNode(node.get("highPrice")),
                parseDoubleNode(node.get("lowPrice")),
                parseDoubleNode(node.get("volume")),
                parseDoubleNode(node.get("quoteVolume"))
        );
    }

    private Map<String, List<OrderBookLevel>> fetchBinanceOrderBook(String pair) throws IOException, InterruptedException {
        JsonNode root = getJson("/api/v3/depth?symbol=" + encode(pair) + "&limit=10");
        List<OrderBookLevel> bids = parseOrderBookLevels(root.get("bids"));
        List<OrderBookLevel> asks = parseOrderBookLevels(root.get("asks"));

        bids.sort(Comparator.comparingDouble(OrderBookLevel::price).reversed());
        asks.sort(Comparator.comparingDouble(OrderBookLevel::price));

        Map<String, List<OrderBookLevel>> result = new HashMap<>();
        result.put("bids", bids);
        result.put("asks", asks);
        return result;
    }

    private List<OrderBookLevel> parseOrderBookLevels(JsonNode levelsNode) {
        List<OrderBookLevel> levels = new ArrayList<>();
        if (levelsNode == null || !levelsNode.isArray()) {
            return levels;
        }

        for (JsonNode level : levelsNode) {
            if (!level.isArray() || level.size() < 2) {
                continue;
            }
            double price = parseDoubleNode(level.get(0));
            double amount = parseDoubleNode(level.get(1));
            levels.add(new OrderBookLevel(price, amount, price * amount));
        }

        return levels;
    }

    private double parseDoubleNode(JsonNode node) {
        if (node == null || node.isNull()) {
            return 0.0;
        }
        if (node.isNumber()) {
            return node.asDouble();
        }
        return Double.parseDouble(node.asText("0"));
    }

    private JsonNode getJson(String pathAndQuery) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(binanceBaseUrl + pathAndQuery))
                .timeout(Duration.ofSeconds(6))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Binance API request failed with status " + response.statusCode());
        }
        return objectMapper.readTree(response.body());
    }

    private String timeframeToBinanceInterval(String timeframe) {
        return switch (normalizeTimeframe(timeframe)) {
            case "1h" -> "1m";
            case "1d" -> "15m";
            case "1mon" -> "4h";
            case "1year" -> "1d";
            default -> "1m";
        };
    }

    private int timeframeToHistoryLimit(String timeframe) {
        return switch (normalizeTimeframe(timeframe)) {
            case "1h" -> 60;
            case "1d" -> 96;
            case "1mon" -> 180;
            case "1year" -> 365;
            default -> 60;
        };
    }

    private String normalizeTimeframe(String timeframe) {
        if (timeframe == null || timeframe.isBlank()) {
            return "1h";
        }

        String value = timeframe.trim().toLowerCase();
        return switch (value) {
            case "1h" -> "1h";
            case "1d" -> "1d";
            case "1mon", "1month", "1mo" -> "1mon";
            case "1year", "1y" -> "1year";
            default -> "1h";
        };
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String stripTrailingSlash(String raw) {
        String value = raw == null ? "" : raw.trim();
        while (value.endsWith("/")) {
            value = value.substring(0, value.length() - 1);
        }
        return value;
    }

    private MarketSnapshot getSimulatedSnapshot(String pair, String timeframe) {
        double latestPrice = tickPrice(pair);
        List<PricePoint> history = appendHistory(pair, latestPrice, timeframe);
        List<OrderBookLevel> bids = buildBook(latestPrice, false);
        List<OrderBookLevel> asks = buildBook(latestPrice, true);
        double firstPrice = history.isEmpty() ? latestPrice : history.get(0).price();
        double changePercent = firstPrice == 0 ? 0 : ((latestPrice - firstPrice) / firstPrice) * 100;
        double change24hPercent = ThreadLocalRandom.current().nextDouble(-2.2, 2.2);
        double open24h = latestPrice / (1 + (change24hPercent / 100.0));
        double change24h = latestPrice - open24h;
        double highMultiplier = ThreadLocalRandom.current().nextDouble(0.001, 0.02);
        double lowMultiplier = ThreadLocalRandom.current().nextDouble(0.001, 0.02);
        double high24h = Math.max(latestPrice, open24h) * (1 + highMultiplier);
        double low24h = Math.min(latestPrice, open24h) * (1 - lowMultiplier);
        double volume24hBase = ThreadLocalRandom.current().nextDouble(3000.0, 25000.0);
        double volume24hQuote = volume24hBase * latestPrice;
        String source = useBinance() ? "Simulated Fallback" : "Simulated";
        return new MarketSnapshot(
            pair,
            timeframe,
            source,
            latestPrice,
            changePercent,
            change24h,
            change24hPercent,
            high24h,
            low24h,
            volume24hBase,
            volume24hQuote,
            history,
            bids,
            asks
        );
    }

        private record Market24hStats(
            double change,
            double changePercent,
            double high,
            double low,
            double volumeBase,
            double volumeQuote
        ) {
        }

    private double tickPrice(String pair) {
        double current = currentPrices.getOrDefault(pair, basePrices.get(pair));
        double variation = ThreadLocalRandom.current().nextDouble(-0.004, 0.004);
        double next = current + (current * variation);
        currentPrices.put(pair, next);
        return next;
    }

    private List<PricePoint> appendHistory(String pair, double price, String timeframe) {
        String normalizedTimeframe = normalizeTimeframe(timeframe);
        int limit = timeframeToHistoryLimit(normalizedTimeframe);
        String historyKey = pair + "|" + normalizedTimeframe;

        List<PricePoint> history = new ArrayList<>(historyByPair.getOrDefault(historyKey, List.of()));
        history.add(new PricePoint(System.currentTimeMillis(), price));
        if (history.size() > limit) {
            history = new ArrayList<>(history.subList(history.size() - limit, history.size()));
        }
        historyByPair.put(historyKey, history);
        return history;
    }

    private List<OrderBookLevel> buildBook(double currentPrice, boolean asks) {
        List<OrderBookLevel> levels = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            double spreadFactor = (i + 1) * 0.0008;
            double price = asks
                    ? currentPrice * (1 + spreadFactor)
                    : currentPrice * (1 - spreadFactor);
            double amount = ThreadLocalRandom.current().nextDouble(0.1, 5.0);
            levels.add(new OrderBookLevel(price, amount, price * amount));
        }

        levels.sort(Comparator.comparingDouble(OrderBookLevel::price));
        if (!asks) {
            levels.sort(Comparator.comparingDouble(OrderBookLevel::price).reversed());
        }
        return levels;
    }
}
