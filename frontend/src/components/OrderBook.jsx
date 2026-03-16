import "./OrderBook.css";

const OrderBook = ({ pair, pairLabel, currentPrice, bids = [], asks = [] }) => {
  const maxTotal = Math.max(
    ...bids.map((b) => parseFloat(b.total)),
    ...asks.map((a) => parseFloat(a.total)),
    1,
  );

  return (
    <div className="order-book">
      <h3>Order Book</h3>
      <div className="current-price">
        <span className="price-label">Pair</span>
        <span className="price-value">{pairLabel || pair}</span>
      </div>

      <div className="orderbook-header">
        <span>Price (USDT)</span>
        <span>Amount</span>
        <span>Total</span>
      </div>

      <div className="asks">
        {[...asks].reverse().map((ask, index) => (
          <div key={`ask-${index}`} className="order-row ask">
            <div
              className="order-row-background"
              style={{ width: `${(parseFloat(ask.total) / maxTotal) * 100}%` }}
            />
            <span className="price">{ask.price.toFixed(2)}</span>
            <span className="amount">{ask.amount}</span>
            <span className="total">{ask.total}</span>
          </div>
        ))}
      </div>

      <div className="current-price">
        <span className="price-label">Current Price</span>
        <span className="price-value">{currentPrice.toFixed(2)}</span>
      </div>

      <div className="bids">
        {bids.map((bid, index) => (
          <div key={`bid-${index}`} className="order-row bid">
            <div
              className="order-row-background"
              style={{ width: `${(parseFloat(bid.total) / maxTotal) * 100}%` }}
            />
            <span className="price">{bid.price.toFixed(2)}</span>
            <span className="amount">{bid.amount}</span>
            <span className="total">{bid.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderBook;
