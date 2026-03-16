import { useState } from "react";
import "./TradingChart.css";

const TradingChart = ({
  pair,
  pairLabel,
  currentPrice,
  priceHistory,
  priceChange,
  marketSource,
  stats24h,
  timeframe,
  onTimeframeChange,
}) => {
  const [hoverState, setHoverState] = useState(null);
  const maxPrice = Math.max(...priceHistory.map((p) => p.price), currentPrice);
  const minPrice = Math.min(...priceHistory.map((p) => p.price), currentPrice);
  const priceRange = maxPrice - minPrice || 1;
  const pointCount = Math.max(priceHistory.length - 1, 1);

  const getY = (price) => {
    return 200 - ((price - minPrice) / priceRange) * 180;
  };

  const pathData = priceHistory
    .map((point, index) => {
      const x = (index / pointCount) * 580 + 10;
      const y = getY(point.price);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const handleChartMouseMove = (event) => {
    if (priceHistory.length === 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const xScale = 600 / rect.width;
    const yScale = 220 / rect.height;

    const svgX = (event.clientX - rect.left) * xScale;
    const clampedX = Math.max(10, Math.min(590, svgX));
    const rawIndex = Math.round(((clampedX - 10) / 580) * pointCount);
    const index = Math.max(0, Math.min(priceHistory.length - 1, rawIndex));
    const point = priceHistory[index];

    const x = (index / pointCount) * 580 + 10;
    const y = getY(point.price);

    setHoverState({ x, y, point });
  };

  const clearHover = () => {
    setHoverState(null);
  };

  const formatPointTime = (epochMillis) => {
    const date = new Date(epochMillis);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatVolume = (value) =>
    Number(value || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <div className="trading-chart">
      <div className="chart-header">
        <h2>{pairLabel || pair}</h2>
        <div className="price-info">
          <span className="current-price">${currentPrice.toFixed(2)}</span>
          <span
            className={`price-change ${priceChange >= 0 ? "positive" : "negative"}`}
          >
            {priceChange >= 0 ? "+" : "-"} {Math.abs(priceChange).toFixed(2)}%
          </span>
          <span
            className={`market-source source-${(marketSource || "unknown").toLowerCase().replace(/\s+/g, "-")}`}
          >
            Source: {marketSource || "Unknown"}
          </span>
        </div>
        <div className="timeframe-selector">
          {["1h", "1d", "1mon", "1year"].map((tf) => (
            <button
              key={tf}
              className={`tf-btn ${timeframe === tf ? "active" : ""}`}
              onClick={() => onTimeframeChange(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
        <div className="price-info">
          <span className="price-change">
            Showing {priceHistory.length} candles ({timeframe})
          </span>
        </div>
        <div className="stats-strip">
          <div className="stat-item">
            <span className="stat-label">24h Chg</span>
            <span
              className={`stat-value ${stats24h?.changePercent >= 0 ? "positive" : "negative"}`}
            >
              {stats24h?.change >= 0 ? "+" : "-"}
              {formatPrice(Math.abs(stats24h?.change))}
              <small>
                {stats24h?.changePercent >= 0 ? "+" : "-"}
                {Math.abs(stats24h?.changePercent || 0).toFixed(2)}%
              </small>
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">24h High</span>
            <span className="stat-value">{formatPrice(stats24h?.high)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">24h Low</span>
            <span className="stat-value">{formatPrice(stats24h?.low)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">24h Vol(BTC)</span>
            <span className="stat-value">
              {formatVolume(stats24h?.volumeBase)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">24h Vol(USDT)</span>
            <span className="stat-value">
              {formatVolume(stats24h?.volumeQuote)}
            </span>
          </div>
        </div>
      </div>

      <div className="chart-container">
        <svg
          width="600"
          height="220"
          viewBox="0 0 600 220"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={clearHover}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <line
                x1="10"
                y1={10 + i * 50}
                x2="590"
                y2={10 + i * 50}
                stroke="#2a2e39"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <text
                x="595"
                y={15 + i * 50}
                fill="#848e9c"
                fontSize="10"
                textAnchor="start"
              >
                ${(maxPrice - (priceRange * i) / 4).toFixed(2)}
              </text>
            </g>
          ))}

          {/* Price line */}
          {priceHistory.length > 1 && (
            <>
              <path
                d={pathData}
                fill="none"
                stroke={priceChange >= 0 ? "#0ecb81" : "#f6465d"}
                strokeWidth="2"
              />
              {/* Area fill */}
              <path
                d={`${pathData} L 590 200 L 10 200 Z`}
                fill={
                  priceChange >= 0
                    ? "rgba(14, 203, 129, 0.1)"
                    : "rgba(246, 70, 93, 0.1)"
                }
              />
            </>
          )}

          {/* Current price indicator */}
          {priceHistory.length > 0 && (
            <circle
              cx={590}
              cy={getY(currentPrice)}
              r="4"
              fill={priceChange >= 0 ? "#0ecb81" : "#f6465d"}
            />
          )}

          {/* Hover crosshair */}
          {hoverState && (
            <>
              <line
                x1={hoverState.x}
                y1="10"
                x2={hoverState.x}
                y2="200"
                stroke="#848e9c"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <circle
                cx={hoverState.x}
                cy={hoverState.y}
                r="4"
                fill="#fcd535"
                stroke="#1e2329"
                strokeWidth="1.5"
              />
            </>
          )}
        </svg>

        {hoverState && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hoverState.x / 600) * 100}%`,
              top: `${(hoverState.y / 220) * 100}%`,
            }}
          >
            <div>{formatPointTime(hoverState.point.time)}</div>
            <div>${hoverState.point.price.toFixed(2)}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingChart;
