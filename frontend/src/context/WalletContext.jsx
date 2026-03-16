import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { apiRequest } from "../lib/api";

const WalletContext = createContext();

const EMPTY_BALANCE = {
  USDT: 0,
  BTC: 0,
  ETH: 0,
  BNB: 0,
  SOL: 0,
  ADA: 0,
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(EMPTY_BALANCE);
  const [portfolio, setPortfolio] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);

  const applyWalletState = (walletState) => {
    setBalance(walletState?.balance || EMPTY_BALANCE);
    setPortfolio(walletState?.portfolio || []);
    setTradeHistory(walletState?.tradeHistory || []);
    setTransactions(walletState?.transactions || []);
  };

  const clearWalletState = () => {
    setBalance(EMPTY_BALANCE);
    setPortfolio([]);
    setTradeHistory([]);
    setTransactions([]);
  };

  const loadWallet = async () => {
    if (!user?.token) {
      clearWalletState();
      return;
    }

    setWalletLoading(true);
    try {
      const response = await apiRequest("/api/wallet/me");
      applyWalletState(response.data);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    loadWallet().catch((error) => {
      console.error("Failed to load wallet:", error);
      clearWalletState();
    });
  }, [user?.userKey, user?.token]);

  const deposit = async (amount, currency = "USDT") => {
    if (!user?.token) {
      throw new Error("Please login first");
    }

    const response = await apiRequest("/api/wallet/me/deposit", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    });

    applyWalletState(response.data);
    return response.data;
  };

  const withdraw = async (amount, currency = "USDT") => {
    if (!user?.token) {
      throw new Error("Please login first");
    }

    const response = await apiRequest("/api/wallet/me/withdraw", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    });

    applyWalletState(response.data);
    return response.data;
  };

  const executeTrade = async (pair, type, amount, price) => {
    if (!user?.token) {
      throw new Error("Please login first");
    }

    const response = await apiRequest("/api/wallet/me/trade", {
      method: "POST",
      body: JSON.stringify({ pair, type, amount, price }),
    });

    applyWalletState(response.data);
    return { success: true, message: "Trade executed", data: response.data };
  };

  const resetWallet = async () => {
    if (!user?.token) {
      throw new Error("Please login first");
    }

    const response = await apiRequest("/api/wallet/me/reset", {
      method: "POST",
      body: JSON.stringify({ demo: !!user.isDemo }),
    });

    applyWalletState(response.data);
    return response.data;
  };

  const getTotalValue = (prices = {}) => {
    let total = balance.USDT || 0;
    Object.entries(balance).forEach(([asset, amount]) => {
      if (asset !== "USDT" && amount > 0) {
        const price = prices[asset] || 0;
        total += amount * price;
      }
    });
    return total;
  };

  const value = {
    balance,
    portfolio,
    tradeHistory,
    transactions,
    deposit,
    withdraw,
    executeTrade,
    resetWallet,
    getTotalValue,
    loadWallet,
    walletLoading,
    initialBalance: 100000,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
