import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../lib/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const onboardingStorageKey = (userKey) => `onboarding_completed_${userKey}`;

  const isExpired = (tokenExpiresAt) => {
    if (!tokenExpiresAt) {
      return true;
    }

    const expiry = new Date(tokenExpiresAt).getTime();
    if (Number.isNaN(expiry)) {
      return true;
    }

    return expiry <= Date.now();
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  useEffect(() => {
    // Restore and refresh an existing session if a non-expired token is present.
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }

    let parsed = null;
    try {
      parsed = JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing stored user:", error);
      clearUser();
      setLoading(false);
      return;
    }

    if (
      !parsed?.userKey ||
      !parsed?.token ||
      isExpired(parsed?.tokenExpiresAt)
    ) {
      clearUser();
      setLoading(false);
      return;
    }

    setUser(parsed);

    const refreshExistingSession = async () => {
      try {
        const response = await apiRequest("/api/auth/refresh", {
          method: "POST",
        });
        storeUser(response.data);
      } catch {
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    refreshExistingSession();
  }, []);

  const storeUser = (sessionData) => {
    const sessionUser = sessionData.user || sessionData;
    const mapped = {
      userKey: sessionUser.userKey,
      name: sessionUser.name,
      email: sessionUser.email,
      isDemo: sessionUser.isDemo,
      createdAt: sessionUser.createdAt,
      token: sessionData.token,
      tokenExpiresAt: sessionData.tokenExpiresAt,
    };

    setUser(mapped);
    localStorage.setItem("user", JSON.stringify(mapped));
    return mapped;
  };

  const login = async (credentials) => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    return storeUser(response.data);
  };

  const register = async (payload) => {
    const response = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return storeUser(response.data);
  };

  const demoLogin = async (name = "Demo Trader") => {
    const response = await apiRequest("/api/auth/demo", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    return storeUser(response.data);
  };

  const logout = async () => {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout API errors and always clear local session.
    }
    clearUser();
  };

  const hasCompletedOnboarding = (userKey = user?.userKey) => {
    if (!userKey) {
      return false;
    }
    return localStorage.getItem(onboardingStorageKey(userKey)) === "true";
  };

  const completeOnboarding = () => {
    if (!user?.userKey) {
      return;
    }
    localStorage.setItem(onboardingStorageKey(user.userKey), "true");
  };

  const resetOnboarding = () => {
    if (!user?.userKey) {
      return;
    }
    localStorage.removeItem(onboardingStorageKey(user.userKey));
  };

  const value = {
    user,
    login,
    register,
    demoLogin,
    logout,
    hasCompletedOnboarding,
    completeOnboarding,
    resetOnboarding,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
