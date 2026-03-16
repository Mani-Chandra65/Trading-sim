const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080";

const isTokenExpired = (tokenExpiresAt) => {
  if (!tokenExpiresAt) {
    return true;
  }

  const expiresAtMs = new Date(tokenExpiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return true;
  }

  return expiresAtMs <= Date.now();
};

const getStoredToken = () => {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (isTokenExpired(parsed?.tokenExpiresAt)) {
      localStorage.removeItem("user");
      return null;
    }

    return parsed?.token || null;
  } catch {
    return null;
  }
};

export const apiRequest = async (path, options = {}) => {
  const token = getStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401) {
    localStorage.removeItem("user");
  }

  if (!response.ok || body?.success === false) {
    const message = body?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return body;
};

export { API_BASE_URL };
