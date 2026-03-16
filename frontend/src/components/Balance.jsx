import "./Balance.css";

const Balance = ({
  balance,
  priceMap,
  portfolio = [],
  transactions = [],
  initialBalance = 10000,
}) => {
  const avgPriceByAsset = portfolio.reduce((acc, item) => {
    acc[item.asset] = item.avgPrice;
    return acc;
  }, {});

  const calculateTotalValue = () => {
    let total = balance.USDT || 0;
    Object.entries(balance).forEach(([asset, amount]) => {
      if (asset !== "USDT" && amount > 0) {
        const estimatedPrice = priceMap[asset] || avgPriceByAsset[asset] || 0;
        total += amount * estimatedPrice;
      }
    });
    return total;
  };

  const calculateTransferAdjustedBaseline = () => {
    const transferDelta = transactions.reduce((sum, tx) => {
      const amount = Number(tx?.amount || 0);
      if (tx?.type === "DEPOSIT") {
        return sum + amount;
      }
      if (tx?.type === "WITHDRAW") {
        return sum - amount;
      }
      return sum;
    }, 0);

    return initialBalance + transferDelta;
  };

  const totalValue = calculateTotalValue();
  const baselineValue = calculateTransferAdjustedBaseline();
  const profitLoss = totalValue - baselineValue;
  const profitLossPercent =
    baselineValue > 0 ? (profitLoss / baselineValue) * 100 : 0;

  return (
    <div className="balance">
      <h3>Account Balance</h3>

      <div className="balance-summary">
        <div className="total-balance">
          <span className="label">Total Value</span>
          <span className="value">${totalValue.toFixed(2)}</span>
        </div>

        <div className={`profit-loss ${profitLoss >= 0 ? "profit" : "loss"}`}>
          <span className="label">P&L</span>
          <span className="value">
            {profitLoss >= 0 ? "+" : ""}
            {profitLoss.toFixed(2)}({profitLoss >= 0 ? "+" : ""}
            {profitLossPercent.toFixed(2)}%)
          </span>
        </div>

        <div className="total-balance">
          <span className="label">P&L Baseline</span>
          <span className="value">${baselineValue.toFixed(2)}</span>
        </div>
      </div>

      <div className="balances-list">
        <div className="balance-header">
          <span>Asset</span>
          <span>Available</span>
          <span>Value (USDT)</span>
        </div>

        {Object.entries(balance).map(([asset, amount]) => {
          if (amount === 0 && asset !== "USDT") return null;

          const estimatedPrice =
            asset === "USDT"
              ? 1
              : priceMap[asset] || avgPriceByAsset[asset] || 0;
          const value = amount * estimatedPrice;

          return (
            <div key={asset} className="balance-item">
              <span className="asset">
                <strong>{asset}</strong>
              </span>
              <span className="amount">
                {amount.toFixed(asset === "USDT" ? 2 : 6)}
              </span>
              <span className="value">${value.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Balance;
