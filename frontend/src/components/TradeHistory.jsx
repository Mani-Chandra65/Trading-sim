import "./TradeHistory.css";

const TradeHistory = ({ trades }) => {
  return (
    <div className="trade-history">
      <h3>Trade History</h3>

      {trades.length === 0 ? (
        <div className="empty-state">
          <p>No trades yet</p>
          <small>Your trade history will appear here</small>
        </div>
      ) : (
        <div className="trades-list">
          <div className="trades-header">
            <span>Time</span>
            <span>Pair</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Price</span>
            <span>Total</span>
          </div>

          <div className="trades-body">
            {trades.map((trade) => (
              <div key={trade.id} className="trade-row">
                <span className="time">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </span>
                <span className="pair">{trade.pair}</span>
                <span className={`type ${trade.type.toLowerCase()}`}>
                  {trade.type}
                </span>
                <span className="amount">{trade.amount.toFixed(6)}</span>
                <span className="price">${trade.price.toFixed(2)}</span>
                <span className="total">${trade.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeHistory;
