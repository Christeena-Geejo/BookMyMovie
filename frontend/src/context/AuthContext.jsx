import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const API_BASE_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('bmm_user');
    const storedTokens = localStorage.getItem('bmm_tokens');

    if (storedUser && storedTokens) {
      setUser(JSON.parse(storedUser));
      setTokens(JSON.parse(storedTokens));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await response.json();
      const userObj = data.user;
      const tokensObj = {
        access: data.access,
        refresh: data.refresh,
      };

      setUser(userObj);
      setTokens(tokensObj);
      localStorage.setItem('bmm_user', JSON.stringify(userObj));
      localStorage.setItem('bmm_tokens', JSON.stringify(tokensObj));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (username, email, password, isManager = false) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          is_customer: !isManager,
          is_cinema_manager: isManager,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const firstErrorKey = Object.keys(errorData)[0];
        const errorMsg = Array.isArray(errorData[firstErrorKey]) 
          ? errorData[firstErrorKey][0] 
          : errorData[firstErrorKey];
        throw new Error(`${firstErrorKey}: ${errorMsg}`);
      }

      // Automatically login after successful registration
      return await login(username, password);
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem('bmm_user');
    localStorage.removeItem('bmm_tokens');
  };

  // Helper to fetch with auth token and automatic refresh if expired
  const authFetch = async (url, options = {}) => {
    if (!tokens || !tokens.access) {
      throw new Error('Not authenticated');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${tokens.access}`,
    };

    let response = await fetch(url, { ...options, headers });

    // If unauthorized, token might have expired. Try to refresh.
    if (response.status === 401 && tokens.refresh) {
      const refreshedTokens = await refreshAccessToken();
      if (refreshedTokens) {
        const newHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${refreshedTokens.access}`,
        };
        response = await fetch(url, { ...options, headers: newHeaders });
      } else {
        logout();
        throw new Error('Session expired');
      }
    }

    return response;
  };

  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: tokens.refresh }),
      });

      if (!response.ok) {
        throw new Error('Refresh token invalid');
      }

      const data = await response.json();
      const newTokens = {
        access: data.access,
        refresh: data.refresh || tokens.refresh, // simplejwt might rotate refresh tokens
      };

      setTokens(newTokens);
      localStorage.setItem('bmm_tokens', JSON.stringify(newTokens));
      return newTokens;
    } catch (error) {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, tokens, loading, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
