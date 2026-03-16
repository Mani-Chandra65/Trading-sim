import { useState, useEffect } from "react";
import "./OrderForm.css";

const OrderForm = ({ pair, pairLabel, currentPrice, onTrade, balance }) => {
  const [orderType, setOrderType] = useState("market");
  const [side, setSide] = useState("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const asset = pair.includes("/")
    ? pair.split("/", 2)[0]
    : pair.replace("USDT", "");
  const quickPresets = {
    BTC: [0.001, 0.005, 0.01],
    ETH: [0.01, 0.05, 0.1],
    BNB: [0.1, 0.5, 1],
    SOL: [1, 5, 10],
    ADA: [100, 500, 1000],
  };
  const presetAmounts = quickPresets[asset] || [1, 5, 10];

  useEffect(() => {
    if (orderType === "market") {
      setPrice(currentPrice.toFixed(2));
    }
  }, [orderType, currentPrice]);

  useEffect(() => {
    const priceNum = parseFloat(price) || 0;
    const amountNum = parseFloat(amount) || 0;
    setTotal(priceNum * amountNum);
  }, [price, amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Enter a valid quantity to continue.");
      return;
    }

    const tradePrice =
      orderType === "market" ? currentPrice : parseFloat(price);

    if (!tradePrice || tradePrice <= 0) {
      setErrorMessage("Enter a valid price greater than zero.");
      return;
    }

    const tradeTotal = parseFloat(amount) * tradePrice;
    if (side === "buy" && tradeTotal > (balance.USDT || 0)) {
      setErrorMessage("Not enough USDT balance for this buy order.");
      return;
    }

    if (side === "sell" && parseFloat(amount) > (balance[asset] || 0)) {
      setErrorMessage(`Not enough ${asset} balance for this sell order.`);
      return;
    }

    try {
      await onTrade({
        type: side,
        amount: parseFloat(amount),
        price: tradePrice,
        orderType,
      });
    } catch (error) {
      setErrorMessage(error?.message || "Trade failed. Please try again.");
      return;
    }

    // Reset form
    setAmount("");
    if (orderType === "limit") {
      setPrice("");
    }
  };

  const setPercentage = (percent) => {
    setErrorMessage("");
    if (side === "buy") {
      const availableUSDT = balance.USDT * (percent / 100);
      const priceNum =
        orderType === "market"
          ? currentPrice
          : parseFloat(price) || currentPrice;
      setAmount((availableUSDT / priceNum).toFixed(6));
    } else {
      const availableAsset = (balance[asset] || 0) * (percent / 100);
      setAmount(availableAsset.toFixed(6));
    }
  };

  const setQuickAmount = (value) => {
    setErrorMessage("");
    if (side === "sell") {
      const maxAvailable = balance[asset] || 0;
      setAmount(Math.min(value, maxAvailable).toFixed(6));
      return;
    }
    setAmount(value.toFixed(6));
  };

  return (
    <div className="order-form">
      <div className="form-group">
        <label>Trading Pair</label>
        <div className="available-balance">{pairLabel || pair}</div>
      </div>

      <div className="order-help">
        <strong>{side === "buy" ? "Buying" : "Selling"} made simple:</strong>
        <span>
          Price = USDT for 1 {asset}. Quantity = how much {asset} to {side}.
        </span>
      </div>

      <div className="order-tabs">
        <button
          className={`tab ${side === "buy" ? "active buy" : ""}`}
          onClick={() => setSide("buy")}
        >
          Buy
        </button>
        <button
          className={`tab ${side === "sell" ? "active sell" : ""}`}
          onClick={() => setSide("sell")}
        >
          Sell
        </button>
      </div>

      <div className="order-type-selector">
        <button
          className={`type-btn ${orderType === "limit" ? "active" : ""}`}
          onClick={() => setOrderType("limit")}
        >
          Limit
        </button>
        <button
          className={`type-btn ${orderType === "market" ? "active" : ""}`}
          onClick={() => setOrderType("market")}
        >
          Market
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Available</label>
          <div className="available-balance">
            {side === "buy"
              ? `${balance.USDT.toFixed(2)} USDT`
              : `${(balance[asset] || 0).toFixed(6)} ${asset}`}
          </div>
        </div>

        {orderType === "limit" && (
          <div className="form-group">
            <label>Limit Price (USDT per {asset})</label>
            <div className="input-wrapper">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
              <span className="input-suffix">USDT</span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Quantity ({asset})</label>
          <div className="input-wrapper">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.000001"
            />
            <span className="input-suffix">{asset}</span>
          </div>
        </div>

        <div className="percentage-buttons">
          {[25, 50, 75, 100].map((percent) => (
            <button
              key={percent}
              type="button"
              className="percent-btn"
              onClick={() => setPercentage(percent)}
            >
              {percent}%
            </button>
          ))}
        </div>

        <div className="quick-presets">
          {presetAmounts.map((preset) => (
            <button
              key={preset}
              type="button"
              className="preset-btn"
              onClick={() => setQuickAmount(preset)}
            >
              {preset} {asset}
            </button>
          ))}
        </div>

        <div className="form-group">
          <label>
            {side === "buy" ? "Estimated Cost" : "Estimated Receive"} (USDT)
          </label>
          <div className="total-display">{total.toFixed(2)} USDT</div>
        </div>

        <button type="submit" className={`submit-btn ${side}`}>
          {side === "buy" ? `Buy ${asset}` : `Sell ${asset}`}
        </button>

        {errorMessage && <div className="form-error">{errorMessage}</div>}
      </form>
    </div>
  );
};

export default OrderForm;
