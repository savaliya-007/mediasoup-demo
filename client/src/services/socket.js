import { io } from "socket.io-client";

// ---------- SOCKET INSTANCE ----------
export const socket = io("http://localhost:8000", {
  transports: ["websocket"], // lower latency than polling
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 20000,
});

// ---------- OPTIONAL BASIC LIFECYCLE LOGS (NON-SPAM) ----------
socket.on("connect", () => {
  console.info("Socket connected");
});

socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.error("Socket connect error:", err?.message);
});

// ---------- STORE EVENTS INIT ----------
export const initSocketEvents = (store) => {
  if (!store) return;

  const onUsers = (users) => store.setUsers?.(users ?? []);
  const onPublic = (msg) => store.addPublic?.(msg);

  socket.on("room:users", onUsers);
  socket.on("chat:public", onPublic);

  // return cleanup so React components can call it
  return () => {
    socket.off("room:users", onUsers);
    socket.off("chat:public", onPublic);
  };
};

// ---------- MANUAL CLEANUP (IF NEEDED) ----------
export const removeAllSocketListeners = () => {
  socket.removeAllListeners();
};
