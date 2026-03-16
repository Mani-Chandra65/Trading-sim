package com.crypto.sim.api.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.crypto.sim.api.dto.ApiResponse;
import com.crypto.sim.api.dto.WalletRequests;
import com.crypto.sim.api.model.UserSession;
import com.crypto.sim.api.model.WalletState;
import com.crypto.sim.api.service.AuthService;
import com.crypto.sim.api.service.WalletService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final AuthService authService;
    private final WalletService walletService;

    public WalletController(AuthService authService, WalletService walletService) {
        this.authService = authService;
        this.walletService = walletService;
    }

    @GetMapping("/me")
    public ApiResponse<WalletState> getWalletMe(@RequestHeader("Authorization") String authorizationHeader) {
        UserSession user = authService.authorize(authorizationHeader);
        return ApiResponse.ok("Wallet loaded", walletService.getOrInit(user));
    }

    @PostMapping("/me/deposit")
    public ApiResponse<WalletState> depositMe(@RequestHeader("Authorization") String authorizationHeader,
                                              @Valid @RequestBody WalletRequests.AmountRequest request) {
        UserSession user = authService.authorize(authorizationHeader);
        return ApiResponse.ok("Deposit successful", walletService.deposit(user, request));
    }

    @PostMapping("/me/withdraw")
    public ApiResponse<WalletState> withdrawMe(@RequestHeader("Authorization") String authorizationHeader,
                                               @Valid @RequestBody WalletRequests.AmountRequest request) {
        UserSession user = authService.authorize(authorizationHeader);
        return ApiResponse.ok("Withdraw successful", walletService.withdraw(user, request));
    }

    @PostMapping("/me/trade")
    public ApiResponse<WalletState> tradeMe(@RequestHeader("Authorization") String authorizationHeader,
                                            @Valid @RequestBody WalletRequests.TradeRequest request) {
        UserSession user = authService.authorize(authorizationHeader);
        return ApiResponse.ok("Trade executed", walletService.trade(user, request));
    }

    @PostMapping("/me/reset")
    public ApiResponse<WalletState> resetMe(@RequestHeader("Authorization") String authorizationHeader,
                                            @RequestBody(required = false) WalletRequests.ResetWalletRequest request) {
        UserSession user = authService.authorize(authorizationHeader);
        boolean demo = request != null ? request.demo() : user.isDemo();
        return ApiResponse.ok("Wallet reset", walletService.reset(user, demo));
    }
}
