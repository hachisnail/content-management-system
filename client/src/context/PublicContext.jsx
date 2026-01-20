// src/context/PublicContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import socket from "@/lib/socket";

const PublicContext = createContext(null);

export const PublicProvider = ({ children }) => {
  // --- LOCAL CONFIGURATION ---
  const [publicConfig, setPublicConfig] = useState({
    registrationEnabled: true, 
    maintenanceMode: false,
    // Default announcement
    landingPageAnnouncement: "🚀 System Update: New real-time features enabled!", 
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    // Public listeners update the config dynamically
    const handleAnnouncement = (message) => {
      setPublicConfig((prev) => ({
        ...prev,
        landingPageAnnouncement: message
      }));
    };

    const handleMaintenance = ({ enabled }) => {
      setPublicConfig((prev) => ({ ...prev, maintenanceMode: enabled }));
    };

    socket.on("public_announcement", handleAnnouncement);
    socket.on("system_maintenance", handleMaintenance);

    return () => {
      socket.off("public_announcement", handleAnnouncement);
      socket.off("system_maintenance", handleMaintenance);
    };
  }, []);

  return (
    <PublicContext.Provider value={{ ...publicConfig, loading }}>
      {children}
    </PublicContext.Provider>
  );
};

export const usePublicConfig = () => useContext(PublicContext);