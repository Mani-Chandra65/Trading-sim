import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const features = [
    {
      title: "Real-Time Trading",
      description: "Practice trading with live market simulations",
    },
    {
      title: "Virtual Portfolio",
      description: "Manage your virtual assets risk-free",
    },
    {
      title: "Advanced Charts",
      description: "Analyze markets with professional tools",
    },
    {
      title: "Order Management",
      description: "Place market and limit orders like a pro",
    },
    {
      title: "Responsive Design",
      description: "Trade on any device, anywhere",
    },
    {
      title: "Safe Practice",
      description: "Learn without risking real money",
    },
  ];

  const cryptos = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      price: "$70,245.30",
      change: "+2.45%",
      positive: true,
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      price: "$3,521.80",
      change: "+1.82%",
      positive: true,
    },
    {
      symbol: "BNB",
      name: "Binance Coin",
      price: "$598.40",
      change: "-0.54%",
      positive: false,
    },
    {
      symbol: "SOL",
      name: "Solana",
      price: "$152.75",
      change: "+5.23%",
      positive: true,
    },
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            <span>crypto-trading-sim</span>
          </h1>
          <p className="hero-subtitle">
            Master cryptocurrency trading without risking real money
          </p>
          <p className="hero-description">
            Practice trading strategies, learn market dynamics, and build
            confidence in a risk-free environment with real-time market
            simulations.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary">
              Log In
            </Link>
          </div>
          <div className="demo-badge">
            <Link to="/login" className="demo-link">
              Try Demo Account - No signup needed
            </Link>
          </div>
        </div>
      </section>

      {/* Crypto Ticker */}
      <section className="crypto-ticker">
        <div className="ticker-content">
          {cryptos.map((crypto) => (
            <div key={crypto.symbol} className="ticker-item">
              <span className="ticker-symbol">{crypto.symbol}</span>
              <span className="ticker-price">{crypto.price}</span>
              <span
                className={`ticker-change ${crypto.positive ? "positive" : "negative"}`}
              >
                {crypto.change}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-header">
          <h2>Why Choose Our Platform?</h2>
          <p>Everything you need to become a successful trader</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Start Trading?</h2>
          <p>
            Join thousands of traders learning and practicing on our platform
          </p>
          <Link to="/register" className="btn btn-primary btn-large">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2026 crypto-trading-sim. For educational purposes only.</p>
        <p className="footer-disclaimer">
          This is a simulation platform. No real money or cryptocurrencies are
          involved.
        </p>
      </footer>
    </div>
  );
};

export default Home;
