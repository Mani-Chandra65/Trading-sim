package com.crypto.sim.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "wallet_snapshots")
public class WalletSnapshotEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String userKey;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String balanceJson;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String portfolioJson;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String tradeHistoryJson;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String transactionsJson;

    @Column(nullable = false)
    private Instant lastUpdated;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserKey() {
        return userKey;
    }

    public void setUserKey(String userKey) {
        this.userKey = userKey;
    }

    public String getBalanceJson() {
        return balanceJson;
    }

    public void setBalanceJson(String balanceJson) {
        this.balanceJson = balanceJson;
    }

    public String getPortfolioJson() {
        return portfolioJson;
    }

    public void setPortfolioJson(String portfolioJson) {
        this.portfolioJson = portfolioJson;
    }

    public String getTradeHistoryJson() {
        return tradeHistoryJson;
    }

    public void setTradeHistoryJson(String tradeHistoryJson) {
        this.tradeHistoryJson = tradeHistoryJson;
    }

    public String getTransactionsJson() {
        return transactionsJson;
    }

    public void setTransactionsJson(String transactionsJson) {
        this.transactionsJson = transactionsJson;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
