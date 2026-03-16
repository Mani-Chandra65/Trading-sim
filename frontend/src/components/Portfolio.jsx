import "./Portfolio.css";

const Portfolio = ({ portfolio, priceMap }) => {
  const totalValue = portfolio.reduce((sum, item) => {
    const currentPrice = priceMap[item.asset] || item.avgPrice;
    return sum + item.amount * currentPrice;
  }, 0);

  return (
    <div className="portfolio">
      <h3>Portfolio</h3>

      {portfolio.length === 0 ? (
        <div className="empty-state">
          <p>No assets in portfolio</p>
          <small>Start trading to build your portfolio</small>
        </div>
      ) : (
        <>
          <div className="portfolio-summary">
            <div className="summary-item">
              <span className="label">Total Value</span>
              <span className="value">${totalValue.toFixed(2)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Assets</span>
              <span className="value">{portfolio.length}</span>
            </div>
          </div>

          <div className="portfolio-list">
            <div className="portfolio-header">
              <span>Asset</span>
              <span>Amount</span>
              <span>Avg Price</span>
              <span>Value</span>
            </div>

            {portfolio.map((item) => {
              const currentPrice = priceMap[item.asset] || item.avgPrice;
              const value = item.amount * currentPrice;
              const allocation = (value / totalValue) * 100;

              return (
                <div key={item.asset} className="portfolio-item">
                  <div className="portfolio-row">
                    <span className="asset">
                      <strong>{item.asset}</strong>
                    </span>
                    <span className="amount">{item.amount.toFixed(6)}</span>
                    <span className="avg-price">
                      ${currentPrice.toFixed(2)}
                    </span>
                    <span className="value">${value.toFixed(2)}</span>
                  </div>
                  <div className="allocation-bar">
                    <div
                      className="allocation-fill"
                      style={{ width: `${allocation}%` }}
                    />
                    <span className="allocation-text">
                      {allocation.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Portfolio;
