import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { apiRequest } from "../lib/api";
import { useMarketPrices } from "../lib/useMarketPrices";
import TradingChart from "./TradingChart";
import OrderForm from "./OrderForm";
import OrderBook from "./OrderBook";
import Portfolio from "./Portfolio";
import TradeHistory from "./TradeHistory";
import Balance from "./Balance";
import "./Dashboard.css";

const PAIR_DETAILS = {
  BTCUSDT: { symbol: "BTC/USDT", name: "Bitcoin" },
  ETHUSDT: { symbol: "ETH/USDT", name: "Ethereum" },
  BNBUSDT: { symbol: "BNB/USDT", name: "BNB" },
  SOLUSDT: { symbol: "SOL/USDT", name: "Solana" },
  ADAUSDT: { symbol: "ADA/USDT", name: "Cardano" },
};

const getPairDetail = (pair) =>
  PAIR_DETAILS[pair] || { symbol: pair, name: "Unknown Asset" };

const Dashboard = () => {
  const { user, logout, resetOnboarding } = useAuth();
  const {
    balance,
    portfolio,
    tradeHistory,
    transactions,
    executeTrade,
    initialBalance,
  } = useWallet();
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceChange, setPriceChange] = useState(0);
  const [marketSource, setMarketSource] = useState("Unknown");
  const [stats24h, setStats24h] = useState({
    change: 0,
    changePercent: 0,
    high: 0,
    low: 0,
    volumeBase: 0,
    volumeQuote: 0,
  });
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });

  const tradingPairs = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "ADAUSDT"];
  const priceMap = useMarketPrices();
  const selectedPairDetail = getPairDetail(selectedPair);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleOpenTutorial = () => {
    resetOnboarding();
    navigate("/onboarding?revisit=1");
  };

  useEffect(() => {
    let cancelled = false;

    const loadMarket = async () => {
      try {
        const response = await apiRequest(
          `/api/market/${selectedPair}?timeframe=${timeframe}`,
        );
        if (cancelled) {
          return;
        }

        const snapshot = response.data;
        setCurrentPrice(snapshot.currentPrice || 0);
        setPriceHistory(snapshot.history || []);
        setPriceChange(snapshot.changePercent || 0);
        setMarketSource(snapshot.source || "Unknown");
        setStats24h({
          change: snapshot.change24h || 0,
          changePercent: snapshot.change24hPercent || 0,
          high: snapshot.high24h || 0,
          low: snapshot.low24h || 0,
          volumeBase: snapshot.volume24hBase || 0,
          volumeQuote: snapshot.volume24hQuote || 0,
        });
        setOrderBook({
          bids: snapshot.bids || [],
          asks: snapshot.asks || [],
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load market data:", error);
        }
      }
    };

    loadMarket();
    const interval = setInterval(loadMarket, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [selectedPair, timeframe]);

  const handleTrade = async (order) => {
    const { type, amount, price } = order;
    const tradePair = selectedPair.includes("/")
      ? selectedPair
      : selectedPair.replace("USDT", "/USDT");

    const result = await executeTrade(tradePair, type, amount, price);
    if (!result.success) {
      throw new Error(result.message || "Trade failed");
    }

    return result;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>crypto-trading-sim</h1>
          <div className="user-info">
            {user && (
              <span className="user-welcome">Welcome, {user.name}!</span>
            )}
            {user?.isDemo && (
              <span className="demo-badge-header">DEMO MODE</span>
            )}
          </div>
        </div>
        <div className="pair-selector">
          {tradingPairs.map((pair) => (
            <button
              key={pair}
              className={`pair-btn ${selectedPair === pair ? "active" : ""}`}
              onClick={() => setSelectedPair(pair)}
            >
              {`${getPairDetail(pair).symbol} - ${getPairDetail(pair).name}`}
            </button>
          ))}
        </div>
        <div className="header-actions">
          <button className="nav-btn" onClick={handleOpenTutorial}>
            Tutorial
          </button>
          <button className="nav-btn" onClick={() => navigate("/portfolio")}>
            Portfolio
          </button>
          <button className="nav-btn" onClick={() => navigate("/wallet")}>
            Wallet
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="chart-section">
          <TradingChart
            pair={selectedPair}
            pairLabel={`${selectedPairDetail.name} (${selectedPairDetail.symbol})`}
            currentPrice={currentPrice}
            priceHistory={priceHistory}
            priceChange={priceChange}
            marketSource={marketSource}
            stats24h={stats24h}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
          />
        </div>

        <div className="order-section">
          <OrderForm
            pair={selectedPair}
            pairLabel={`${selectedPairDetail.name} (${selectedPairDetail.symbol})`}
            currentPrice={currentPrice}
            onTrade={handleTrade}
            balance={balance}
          />
        </div>

        <div className="orderbook-section">
          <OrderBook
            pair={selectedPair}
            pairLabel={`${selectedPairDetail.name} (${selectedPairDetail.symbol})`}
            currentPrice={currentPrice}
            bids={orderBook.bids}
            asks={orderBook.asks}
          />
        </div>

        <div className="balance-section">
          <Balance
            balance={balance}
            priceMap={priceMap}
            portfolio={portfolio}
            transactions={transactions}
            initialBalance={initialBalance}
          />
        </div>

        <div className="portfolio-section">
          <Portfolio portfolio={portfolio} priceMap={priceMap} />
        </div>

        <div className="history-section">
          <TradeHistory trades={tradeHistory} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
