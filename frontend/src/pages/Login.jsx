import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        setError("Invalid credentials. Please check your email and password.");
      } else if (err?.status >= 500) {
        setError("Server error during login. Please try again in a moment.");
      } else {
        setError(err.message || "Login failed");
      }
    }
  };

  const handleDemoLogin = async () => {
    setError("");
    try {
      await demoLogin("Demo User");
      navigate("/onboarding");
    } catch (err) {
      setError(err.message || "Demo login failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>crypto-trading-sim</h1>
          <h2>Welcome Back</h2>
          <p>Log in to continue trading</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-button">
            Log In
          </button>
        </form>

        <div className="demo-section">
          <div className="divider">
            <span>OR</span>
          </div>
          <button onClick={handleDemoLogin} className="demo-button">
            Try Demo Account
          </button>
          <p className="demo-note">No registration required - Instant access</p>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
