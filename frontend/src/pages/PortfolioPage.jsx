import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useMarketPrices } from "../lib/useMarketPrices";
import "./PortfolioPage.css";

const PortfolioPage = () => {
  const { user } = useAuth();
  const { balance, portfolio, tradeHistory, getTotalValue } = useWallet();
  const [activeTab, setActiveTab] = useState("overview");
  const currentPrices = useMarketPrices();

  const totalValue = getTotalValue(currentPrices);
  const initialValue = user?.isDemo ? 500 : 10000;
  const profitLoss = totalValue - initialValue;
  const profitLossPercent = (profitLoss / initialValue) * 100;

  const portfolioWithValues = portfolio.map((item) => {
    const currentPrice = currentPrices[item.asset] || 0;
    const currentValue = item.amount * currentPrice;
    const pnl = currentValue - item.totalInvested;
    const pnlPercent = (pnl / item.totalInvested) * 100;

    return {
      ...item,
      currentPrice,
      currentValue,
      pnl,
      pnlPercent,
    };
  });

  return (
    <div className="portfolio-page">
      <header className="page-header">
        <div className="header-content">
          <Link to="/dashboard" className="back-link">
            {"<- Back to Dashboard"}
          </Link>
          <h1>Portfolio Overview</h1>
          {user?.isDemo && <span className="demo-badge-page">DEMO MODE</span>}
        </div>
      </header>

      <div className="portfolio-container">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card total-value">
            <div className="card-content">
              <span className="card-label">Total Portfolio Value</span>
              <span className="card-value">${totalValue.toFixed(2)}</span>
            </div>
          </div>

          <div
            className={`summary-card pnl ${profitLoss >= 0 ? "positive" : "negative"}`}
          >
            <div className="card-content">
              <span className="card-label">Total P&L</span>
              <span className="card-value">
                {profitLoss >= 0 ? "+" : ""}${profitLoss.toFixed(2)}
                <span className="pnl-percent">
                  ({profitLoss >= 0 ? "+" : ""}
                  {profitLossPercent.toFixed(2)}%)
                </span>
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-content">
              <span className="card-label">Total Trades</span>
              <span className="card-value">{tradeHistory.length}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-content">
              <span className="card-label">Assets Held</span>
              <span className="card-value">{portfolio.length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="portfolio-tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === "holdings" ? "active" : ""}`}
            onClick={() => setActiveTab("holdings")}
          >
            Holdings
          </button>
          <button
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Trade History
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview-content">
              <div className="balance-breakdown">
                <h3>Balance Breakdown</h3>
                <div className="balance-list">
                  {Object.entries(balance).map(([asset, amount]) => {
                    if (amount === 0 && asset !== "USDT") return null;
                    const price =
                      asset === "USDT" ? 1 : currentPrices[asset] || 0;
                    const value = amount * price;
                    const percentage =
                      totalValue > 0 ? (value / totalValue) * 100 : 0;

                    return (
                      <div key={asset} className="balance-item">
                        <div className="balance-info">
                          <span className="asset-name">{asset}</span>
                          <div className="balance-bar">
                            <div
                              className="balance-fill"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="balance-values">
                          <span className="amount">
                            {amount.toFixed(asset === "USDT" ? 2 : 6)}
                          </span>
                          <span className="value">
                            ${value.toFixed(2)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "holdings" && (
            <div className="holdings-content">
              {portfolioWithValues.length === 0 ? (
                <div className="empty-state">
                  <p>No holdings yet</p>
                  <Link to="/dashboard" className="btn-primary">
                    Start Trading
                  </Link>
                </div>
              ) : (
                <div className="holdings-table">
                  <div className="table-header">
                    <span>Asset</span>
                    <span>Amount</span>
                    <span>Avg Price</span>
                    <span>Current Price</span>
                    <span>Value</span>
                    <span>P&L</span>
                  </div>
                  {portfolioWithValues.map((item) => (
                    <div key={item.asset} className="table-row">
                      <span className="asset-cell">
                        <strong>{item.asset}</strong>
                      </span>
                      <span>{item.amount.toFixed(6)}</span>
                      <span>${item.avgPrice.toFixed(2)}</span>
                      <span>${item.currentPrice.toFixed(2)}</span>
                      <span>
                        <strong>${item.currentValue.toFixed(2)}</strong>
                      </span>
                      <span className={item.pnl >= 0 ? "positive" : "negative"}>
                        {item.pnl >= 0 ? "+" : ""}${item.pnl.toFixed(2)}
                        <br />
                        <small>
                          ({item.pnl >= 0 ? "+" : ""}
                          {item.pnlPercent.toFixed(2)}%)
                        </small>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="history-content">
              {tradeHistory.length === 0 ? (
                <div className="empty-state">
                  <p>No trade history</p>
                  <Link to="/dashboard" className="btn-primary">
                    Make Your First Trade
                  </Link>
                </div>
              ) : (
                <div className="history-table">
                  <div className="table-header">
                    <span>Time</span>
                    <span>Pair</span>
                    <span>Type</span>
                    <span>Amount</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                  {tradeHistory.map((trade) => (
                    <div key={trade.id} className="table-row">
                      <span>{new Date(trade.timestamp).toLocaleString()}</span>
                      <span>
                        <strong>{trade.pair}</strong>
                      </span>
                      <span
                        className={`type-badge ${trade.type.toLowerCase()}`}
                      >
                        {trade.type}
                      </span>
                      <span>{trade.amount.toFixed(6)}</span>
                      <span>${trade.price.toFixed(2)}</span>
                      <span>
                        <strong>${trade.total.toFixed(2)}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPage;
