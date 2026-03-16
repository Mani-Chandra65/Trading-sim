import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useMarketPrices } from "../lib/useMarketPrices";
import "./WalletPage.css";

const WalletPage = () => {
  const { user } = useAuth();
  const { balance, transactions, deposit, withdraw, resetWallet } = useWallet();
  const [activeTab, setActiveTab] = useState("balance");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [message, setMessage] = useState({ type: "", text: "" });
  const currentPrices = useMarketPrices();

  const currencies = ["USDT", "BTC", "ETH", "BNB", "SOL", "ADA"];

  const handleDeposit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    try {
      await deposit(amount, selectedCurrency);
      setMessage({
        type: "success",
        text: `Successfully deposited ${amount} ${selectedCurrency}`,
      });
      setDepositAmount("");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }

    try {
      await withdraw(amount, selectedCurrency);
      setMessage({
        type: "success",
        text: `Successfully withdrew ${amount} ${selectedCurrency}`,
      });
      setWithdrawAmount("");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset your wallet? This will clear all balances and history.",
      )
    ) {
      await resetWallet();
      setMessage({ type: "success", text: "Wallet has been reset" });
    }
  };

  const totalBalance = Object.entries(balance).reduce(
    (sum, [currency, amount]) => {
      const rate = currency === "USDT" ? 1 : currentPrices[currency] || 0;
      return sum + amount * rate;
    },
    0,
  );

  return (
    <div className="wallet-page">
      <header className="page-header">
        <div className="header-content">
          <Link to="/dashboard" className="back-link">
            {"<- Back to Dashboard"}
          </Link>
          <h1>Wallet Management</h1>
          {user?.isDemo && <span className="demo-badge-page">DEMO MODE</span>}
        </div>
      </header>

      <div className="wallet-container">
        {/* Total Balance Card */}
        <div className="total-balance-card">
          <div className="balance-icon">Wallet</div>
          <div className="balance-content">
            <span className="balance-label">Total Wallet Balance</span>
            <span className="balance-amount">${totalBalance.toFixed(2)}</span>
            <span className="balance-note">Estimated value in USDT</span>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`message-banner ${message.type}`}>{message.text}</div>
        )}

        {/* Tabs */}
        <div className="wallet-tabs">
          <button
            className={`tab ${activeTab === "balance" ? "active" : ""}`}
            onClick={() => setActiveTab("balance")}
          >
            Balances
          </button>
          <button
            className={`tab ${activeTab === "deposit" ? "active" : ""}`}
            onClick={() => setActiveTab("deposit")}
          >
            Deposit
          </button>
          <button
            className={`tab ${activeTab === "withdraw" ? "active" : ""}`}
            onClick={() => setActiveTab("withdraw")}
          >
            Withdraw
          </button>
          <button
            className={`tab ${activeTab === "transactions" ? "active" : ""}`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "balance" && (
            <div className="balance-content">
              <div className="balance-grid">
                {currencies.map((currency) => (
                  <div key={currency} className="balance-card">
                    <div className="currency-header">
                      <span className="currency-name">{currency}</span>
                      <span className="currency-badge">{currency}</span>
                    </div>
                    <div className="currency-amount">
                      {(balance[currency] || 0).toFixed(
                        currency === "USDT" ? 2 : 6,
                      )}
                    </div>
                    <div className="currency-actions">
                      <button
                        className="action-btn deposit-btn"
                        onClick={() => {
                          setSelectedCurrency(currency);
                          setActiveTab("deposit");
                        }}
                      >
                        Deposit
                      </button>
                      <button
                        className="action-btn withdraw-btn"
                        onClick={() => {
                          setSelectedCurrency(currency);
                          setActiveTab("withdraw");
                        }}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="wallet-actions">
                <button className="reset-btn" onClick={handleReset}>
                  Reset Wallet
                </button>
              </div>
            </div>
          )}

          {activeTab === "deposit" && (
            <div className="transaction-form">
              <h3>Deposit Funds</h3>
              <form onSubmit={handleDeposit}>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="currency-select"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    step="0.000001"
                    min="0"
                  />
                </div>

                <div className="quick-amounts">
                  {[100, 500, 1000, 5000].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      className="quick-amount-btn"
                      onClick={() => setDepositAmount(amount.toString())}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>

                <button type="submit" className="submit-btn deposit">
                  Deposit {selectedCurrency}
                </button>
              </form>

              <div className="info-box">
                <p>
                  This is a simulated wallet. In a real application, you would
                  connect your bank or payment method.
                </p>
              </div>
            </div>
          )}

          {activeTab === "withdraw" && (
            <div className="transaction-form">
              <h3>Withdraw Funds</h3>
              <form onSubmit={handleWithdraw}>
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="currency-select"
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>
                        {curr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="available-balance">
                  Available: {(balance[selectedCurrency] || 0).toFixed(6)}{" "}
                  {selectedCurrency}
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    step="0.000001"
                    min="0"
                    max={balance[selectedCurrency] || 0}
                  />
                </div>

                <div className="quick-amounts">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      className="quick-amount-btn"
                      onClick={() => {
                        const amount =
                          ((balance[selectedCurrency] || 0) * percent) / 100;
                        setWithdrawAmount(amount.toFixed(6));
                      }}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                <button type="submit" className="submit-btn withdraw">
                  Withdraw {selectedCurrency}
                </button>
              </form>

              <div className="info-box">
                <p>Withdrawals are instant in this simulation.</p>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="transactions-content">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="transactions-table">
                  <div className="table-header">
                    <span>Time</span>
                    <span>Type</span>
                    <span>Currency</span>
                    <span>Amount</span>
                    <span>Description</span>
                  </div>
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="table-row">
                      <span>
                        {new Date(transaction.timestamp).toLocaleString()}
                      </span>
                      <span
                        className={`type-badge ${transaction.type.toLowerCase()}`}
                      >
                        {transaction.type}
                      </span>
                      <span>
                        <strong>{transaction.currency}</strong>
                      </span>
                      <span
                        className={
                          transaction.type === "DEPOSIT"
                            ? "positive"
                            : "negative"
                        }
                      >
                        {transaction.type === "DEPOSIT" ? "+" : "-"}
                        {transaction.amount.toFixed(6)}
                      </span>
                      <span>{transaction.description}</span>
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

export default WalletPage;
