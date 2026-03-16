import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Onboarding.css";

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const isRevisit = new URLSearchParams(location.search).get("revisit") === "1";

  const steps = useMemo(
    () => [
      {
        title: "Welcome to the Simulator",
        body: "This platform lets you practice crypto trading using virtual funds. You can place buy/sell orders, track your portfolio, and understand market behavior without risking real money.",
        bullets: [
          "You start with virtual USDT balance.",
          "Prices are sourced from live market data when available.",
          "Your wallet and history are saved to your account.",
        ],
      },
      {
        title: "Crypto Trading Basics",
        body: "Every order has a pair, price, and quantity. In BTC/USDT, BTC is the asset you trade and USDT is the quote currency used to pay or receive value.",
        bullets: [
          "Buy: spend USDT to receive the asset.",
          "Sell: give the asset to receive USDT.",
          "Market order uses current price; limit order uses your entered price.",
        ],
      },
      {
        title: "How This Product Helps",
        body: "Use the dashboard to learn execution flow, practice position sizing, and evaluate portfolio value changes over time.",
        bullets: [
          "Chart: observe price movement by timeframe.",
          "Order panel: place trades with quick presets.",
          "Wallet and portfolio: monitor balances, holdings, and P&L.",
        ],
      },
      {
        title: "Simulator vs Real World",
        body: "This simulator is for learning. Real exchanges include factors that can change your results.",
        bullets: [
          "No real capital at risk here; real trading can lose money.",
          "Real trading has fees, slippage, latency, and liquidity constraints.",
          "Risk management and compliance are critical in production environments.",
        ],
      },
    ],
    [],
  );

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      navigate("/dashboard", { replace: true });
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    if (!isRevisit) {
      completeOnboarding();
    }
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <header className="onboarding-header">
          <h1>crypto-trading-sim onboarding</h1>
          <p>
            Step {step + 1} of {steps.length}
          </p>
        </header>

        <div className="onboarding-progress">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`progress-dot ${idx <= step ? "active" : ""}`}
            />
          ))}
        </div>

        <section className="onboarding-content">
          <h2>{current.title}</h2>
          <p>{current.body}</p>
          <ul>
            {current.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <footer className="onboarding-actions">
          <button
            type="button"
            className="action-btn ghost"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="action-btn ghost"
            onClick={handleSkip}
          >
            Skip
          </button>
          <button
            type="button"
            className="action-btn primary"
            onClick={handleNext}
          >
            {isLast ? "Finish and Start Trading" : "Next"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Onboarding;
