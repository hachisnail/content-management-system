import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import socket from "../lib/socket";
import api from "../lib/api";
import { useRealtimeResource } from "../hooks/useRealtimeResource";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // --- STATE ---
  // Track intentional logout to suppress 401 errors during the process
  const isLoggingOut = useRef(false);

  // 1. Initialize State from Local Storage
  const [session, setSession] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  // 2. Fetch Fresh Data (Real-time)
  const {
    data: liveUser,
    error: liveError,
  } = useRealtimeResource("users", {
    id: session?.id,
    isEnabled: !!session?.id,
  });

  // 3. SYNC: Merge Real-time Data into Session
  useEffect(() => {
    if (liveUser && !Array.isArray(liveUser)) {
      setSession((prev) => {
        const newSessionData = { ...prev, ...liveUser };
        if (JSON.stringify(prev) !== JSON.stringify(newSessionData)) {
          localStorage.setItem("user", JSON.stringify(newSessionData));
          return newSessionData;
        }
        return prev;
      });
    }
  }, [liveUser]);

  const loading = false;

  // --- ACTIONS ---

  useEffect(() => {
    if (session && !socket.connected) {
      socket.connect();
    }

    if (session) {
      socket.emitSafe('subscribe_notifications');
      socket.emitSafe('join_chat');
    }
  }, [session]);

  const login = (userData) => {
    isLoggingOut.current = false; // Reset flag on login
    setSession(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    if (!socket.connected) socket.connect();
  };

  const logout = async (callApi = true) => {
    // 1. Set flag to ignore incoming 401s from background requests
    isLoggingOut.current = true;

    setSession(null);
    localStorage.removeItem("user");
    if (socket.connected) socket.disconnect();

    if (callApi) {
      try {
        await api.logout();
      } catch (err) {
        console.error("Logout API failed (harmless):", err);
      }
    }
  };

  // --- GLOBAL EVENT LISTENERS ---

  useEffect(() => {
    const handleUnauthorized = () => {
      // FIX: If we are intentionally logging out, ignore this event.
      // This prevents the "Session Expired" alert from showing due to race conditions.
      if (isLoggingOut.current) return;

      logout(false);
      window.location.href = "/login?session_expired=true";
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  useEffect(() => {
    const handleAuthInvalidated = () => {
      logout(false);
      window.location.href = "/login?reason=invalidated";
    };

    const handleForceLogout = () => {
      logout(false);
      window.location.href = "/login?reason=force_logout";
    };

    socket.on("auth_invalidated", handleAuthInvalidated);
    socket.on("force_logout", handleForceLogout);

    return () => {
      socket.off("auth_invalidated", handleAuthInvalidated);
      socket.off("force_logout", handleForceLogout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session,
        login,
        logout,
        loading,
        error: liveError,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);