package com.crypto.sim.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.crypto.sim.api.dto.ApiResponse;
import com.crypto.sim.api.model.MarketSnapshot;
import com.crypto.sim.api.service.MarketService;

@RestController
@RequestMapping("/api/market")
public class MarketController {

    private final MarketService marketService;

    public MarketController(MarketService marketService) {
        this.marketService = marketService;
    }

    @GetMapping("/pairs")
    public ApiResponse<List<String>> getPairs() {
        return ApiResponse.ok("Pairs loaded", marketService.getPairs());
    }

    @GetMapping("/prices")
    public ApiResponse<Map<String, Double>> getPrices() {
        return ApiResponse.ok("Prices loaded", marketService.getCurrentPrices());
    }

    @GetMapping("/{pair}")
    public ApiResponse<MarketSnapshot> getSnapshot(
            @PathVariable String pair,
            @RequestParam(defaultValue = "1h") String timeframe) {
        return ApiResponse.ok("Market snapshot loaded", marketService.getSnapshot(pair, timeframe));
    }
}
