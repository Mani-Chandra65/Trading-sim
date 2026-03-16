import { useEffect, useState } from "react";
import { apiRequest } from "./api";

const EMPTY_PRICES = {
  BTC: 70000,
  ETH: 3500,
  BNB: 600,
  SOL: 150,
  ADA: 1,
};

export const useMarketPrices = (pollInterval = 4000) => {
  const [prices, setPrices] = useState(EMPTY_PRICES);

  useEffect(() => {
    let cancelled = false;

    const loadPrices = async () => {
      try {
        const response = await apiRequest("/api/market/prices");
        if (!cancelled && response?.data) {
          setPrices((prev) => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load market prices:", error);
        }
      }
    };

    loadPrices();
    const interval = setInterval(loadPrices, pollInterval);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pollInterval]);

  return prices;
};
