package com.crypto.sim.api.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

import com.crypto.sim.api.dto.WalletRequests;
import com.crypto.sim.api.entity.WalletSnapshotEntity;
import com.crypto.sim.api.model.PortfolioItem;
import com.crypto.sim.api.model.TradeEntry;
import com.crypto.sim.api.model.UserSession;
import com.crypto.sim.api.model.WalletState;
import com.crypto.sim.api.model.WalletTransaction;
import com.crypto.sim.api.repository.WalletSnapshotRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WalletService {

    private final WalletSnapshotRepository walletSnapshotRepository;
    private final ObjectMapper objectMapper;
    private final AtomicLong idSequence = new AtomicLong(1);

    public WalletService(WalletSnapshotRepository walletSnapshotRepository, ObjectMapper objectMapper) {
        this.walletSnapshotRepository = walletSnapshotRepository;
        this.objectMapper = objectMapper;
    }

    public WalletState getOrInit(UserSession user) {
        return walletSnapshotRepository.findByUserKey(user.userKey())
                .map(this::toState)
                .orElseGet(() -> saveState(
                        user.userKey(),
                        initialState(user.isDemo()).balance(),
                        initialState(user.isDemo()).portfolio(),
                        initialState(user.isDemo()).tradeHistory(),
                        initialState(user.isDemo()).transactions()));
    }

    public WalletState deposit(UserSession user, WalletRequests.AmountRequest request) {
        validateAmountRequest(request);
        WalletState state = getOrInit(user);

        String currency = normalizeCurrency(request.currency());
        Map<String, Double> balance = new HashMap<>(state.balance());
        balance.put(currency, balance.getOrDefault(currency, 0.0) + request.amount());

        WalletTransaction tx = new WalletTransaction(
                idSequence.getAndIncrement(),
                "DEPOSIT",
                currency,
                request.amount(),
                "Deposited " + request.amount() + " " + currency,
                Instant.now());

        return saveState(user.userKey(), balance, state.portfolio(), state.tradeHistory(), prependTx(state.transactions(), tx));
    }

    public WalletState withdraw(UserSession user, WalletRequests.AmountRequest request) {
        validateAmountRequest(request);
        WalletState state = getOrInit(user);

        String currency = normalizeCurrency(request.currency());
        Map<String, Double> balance = new HashMap<>(state.balance());
        double available = balance.getOrDefault(currency, 0.0);
        if (available < request.amount()) {
            throw new IllegalArgumentException("Insufficient " + currency + " balance");
        }

        balance.put(currency, available - request.amount());

        WalletTransaction tx = new WalletTransaction(
                idSequence.getAndIncrement(),
                "WITHDRAW",
                currency,
                request.amount(),
                "Withdrew " + request.amount() + " " + currency,
                Instant.now());

        return saveState(user.userKey(), balance, state.portfolio(), state.tradeHistory(), prependTx(state.transactions(), tx));
    }

    public WalletState trade(UserSession user, WalletRequests.TradeRequest request) {
        validateTradeRequest(request);
        WalletState state = getOrInit(user);

        String pair = request.pair().toUpperCase();
        String type = request.type().toLowerCase();
        String asset = pair.split("/", 2)[0];
        double total = request.amount() * request.price();

        Map<String, Double> balance = new HashMap<>(state.balance());
        List<PortfolioItem> portfolio = new ArrayList<>(state.portfolio());

        switch (type) {
            case "buy" -> {
                double usdt = balance.getOrDefault("USDT", 0.0);
                if (usdt < total) {
                    throw new IllegalArgumentException("Insufficient USDT balance");
                }
                balance.put("USDT", usdt - total);
                balance.put(asset, balance.getOrDefault(asset, 0.0) + request.amount());
                portfolio = upsertPortfolioOnBuy(portfolio, asset, request.amount(), request.price(), total);
            }
            case "sell" -> {
                double held = balance.getOrDefault(asset, 0.0);
                if (held < request.amount()) {
                    throw new IllegalArgumentException("Insufficient " + asset + " balance");
                }
                balance.put(asset, held - request.amount());
                balance.put("USDT", balance.getOrDefault("USDT", 0.0) + total);
                portfolio = upsertPortfolioOnSell(portfolio, asset, request.amount());
            }
            default -> throw new IllegalArgumentException("Trade type must be buy or sell");
        }

        TradeEntry trade = new TradeEntry(
                idSequence.getAndIncrement(),
                pair,
                type.toUpperCase(),
                request.amount(),
                request.price(),
                total,
                Instant.now());

        return saveState(user.userKey(), balance, portfolio, prependTrade(state.tradeHistory(), trade), state.transactions());
    }

    public WalletState reset(UserSession user, boolean demo) {
        WalletState state = initialState(demo);
        return saveState(user.userKey(), state.balance(), state.portfolio(), state.tradeHistory(), state.transactions());
    }

    private WalletState initialState(boolean demo) {
        Map<String, Double> balance = new HashMap<>();
        balance.put("USDT", 100_000.0);
        balance.put("BTC", 0.0);
        balance.put("ETH", 0.0);
        balance.put("BNB", 0.0);
        balance.put("SOL", 0.0);
        balance.put("ADA", 0.0);

        return new WalletState(balance, List.of(), List.of(), List.of(), Instant.now());
    }

    private WalletState saveState(
            String userKey,
            Map<String, Double> balance,
            List<PortfolioItem> portfolio,
            List<TradeEntry> tradeHistory,
            List<WalletTransaction> transactions) {
        WalletSnapshotEntity entity = walletSnapshotRepository.findByUserKey(userKey)
            .orElseGet(WalletSnapshotEntity::new);

        entity.setUserKey(userKey);
        entity.setBalanceJson(writeJson(balance));
        entity.setPortfolioJson(writeJson(portfolio));
        entity.setTradeHistoryJson(writeJson(tradeHistory));
        entity.setTransactionsJson(writeJson(transactions));
        entity.setLastUpdated(Instant.now());

        return toState(walletSnapshotRepository.save(entity));
    }

    private void validateAmountRequest(WalletRequests.AmountRequest request) {
        if (request == null || request.amount() <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }
    }

    private void validateTradeRequest(WalletRequests.TradeRequest request) {
        if (request == null || request.amount() <= 0 || request.price() <= 0) {
            throw new IllegalArgumentException("Trade amount and price must be greater than zero");
        }
        if (request.pair() == null || !request.pair().toUpperCase().endsWith("USDT")) {
            throw new IllegalArgumentException("Only USDT trading pairs are supported in simulator");
        }
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            return "USDT";
        }
        return currency.toUpperCase();
    }

    private List<WalletTransaction> prependTx(List<WalletTransaction> previous, WalletTransaction tx) {
        List<WalletTransaction> result = new ArrayList<>();
        result.add(tx);
        result.addAll(previous);
        return result;
    }

    private List<TradeEntry> prependTrade(List<TradeEntry> previous, TradeEntry trade) {
        List<TradeEntry> result = new ArrayList<>();
        result.add(trade);
        result.addAll(previous);
        return result;
    }

    private List<PortfolioItem> upsertPortfolioOnBuy(
            List<PortfolioItem> portfolio,
            String asset,
            double amount,
            double price,
            double totalCost) {

        List<PortfolioItem> updated = new ArrayList<>(portfolio);
        int idx = findAsset(updated, asset);

        if (idx >= 0) {
            PortfolioItem old = updated.get(idx);
            double newAmount = old.amount() + amount;
            double newInvested = old.totalInvested() + totalCost;
            double newAvg = newInvested / newAmount;
            updated.set(idx, new PortfolioItem(asset, newAmount, newAvg, newInvested));
        } else {
            updated.add(new PortfolioItem(asset, amount, price, totalCost));
        }

        updated.sort(Comparator.comparing(PortfolioItem::asset));
        return updated;
    }

    private List<PortfolioItem> upsertPortfolioOnSell(List<PortfolioItem> portfolio, String asset, double amount) {
        List<PortfolioItem> updated = new ArrayList<>(portfolio);
        int idx = findAsset(updated, asset);
        if (idx < 0) {
            return updated;
        }

        PortfolioItem old = updated.get(idx);
        double remaining = old.amount() - amount;
        if (remaining <= 0.0000001) {
            updated.remove(idx);
            return updated;
        }

        double avg = old.avgPrice();
        updated.set(idx, new PortfolioItem(asset, remaining, avg, remaining * avg));
        return updated;
    }

    private int findAsset(List<PortfolioItem> list, String asset) {
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).asset().equalsIgnoreCase(asset)) {
                return i;
            }
        }
        return -1;
    }

    private WalletState toState(WalletSnapshotEntity entity) {
        return new WalletState(
                readJson(entity.getBalanceJson(), new TypeReference<>() {}, new HashMap<>()),
                readJson(entity.getPortfolioJson(), new TypeReference<>() {}, new ArrayList<>()),
                readJson(entity.getTradeHistoryJson(), new TypeReference<>() {}, new ArrayList<>()),
                readJson(entity.getTransactionsJson(), new TypeReference<>() {}, new ArrayList<>()),
                entity.getLastUpdated());
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize wallet state", ex);
        }
    }

    private <T> T readJson(String raw, TypeReference<T> typeReference, T fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }

        try {
            return objectMapper.readValue(raw, typeReference);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to deserialize wallet state", ex);
        }
    }
}
