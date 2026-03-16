import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WalletProvider } from "./context/WalletContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./components/Dashboard";
import PortfolioPage from "./pages/PortfolioPage";
import WalletPage from "./pages/WalletPage";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RequireOnboardingComplete = ({ children }) => {
  const { user, loading, hasCompletedOnboarding } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return hasCompletedOnboarding(user.userKey) ? (
    children
  ) : (
    <Navigate to="/onboarding" replace />
  );
};

const OnboardingRoute = ({ children }) => {
  const { user, loading, hasCompletedOnboarding } = useAuth();
  const location = useLocation();
  const isRevisit = new URLSearchParams(location.search).get("revisit") === "1";

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return hasCompletedOnboarding(user.userKey) && !isRevisit ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <Onboarding />
          </OnboardingRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RequireOnboardingComplete>
              <Dashboard />
            </RequireOnboardingComplete>
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <RequireOnboardingComplete>
              <PortfolioPage />
            </RequireOnboardingComplete>
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <RequireOnboardingComplete>
              <WalletPage />
            </RequireOnboardingComplete>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <WalletProvider>
          <div className="App">
            <AppRoutes />
          </div>
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
