import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

import { useAuthContext } from "./AuthContext";

const SocketContext = createContext(null);

function resolveSocketBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiBaseUrl.replace(/\/api\/?$/, "");
}

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuthContext();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return undefined;
    }

    const socket = io(resolveSocketBaseUrl(), {
      autoConnect: true,
      auth: {
        token
      },
      transports: ["polling", "websocket"]
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={{ isSocketConnected: isConnected, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);

  if (!context) {
    throw new Error("useSocketContext must be used inside SocketProvider");
  }

  return context;
}
