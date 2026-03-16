package com.crypto.sim.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public final class WalletRequests {
    private WalletRequests() {
    }

    public record AmountRequest(
        @Positive(message = "Amount must be greater than zero")
        double amount,
        @NotBlank(message = "Currency is required")
        @Pattern(regexp = "^[A-Z]{2,10}$", message = "Currency format is invalid")
        String currency
    ) {
    }

    public record TradeRequest(
        @NotBlank(message = "Pair is required")
        @Pattern(regexp = "^[A-Z]{2,10}/[A-Z]{2,10}$", message = "Pair format should look like BTC/USDT")
        String pair,
        @NotBlank(message = "Type is required")
        @Pattern(regexp = "(?i)BUY|SELL", message = "Type must be BUY or SELL")
        String type,
        @Positive(message = "Amount must be greater than zero")
        double amount,
        @Positive(message = "Price must be greater than zero")
        double price
    ) {
    }

    public record ResetWalletRequest(boolean demo) {
    }
}
