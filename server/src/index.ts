import express from "express";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket/socketHandler";
import { createWorker } from "./mediasoup/worker";
import { createRouter } from "./mediasoup/router";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // --- MEDIASOUP INIT ---
    const worker = await createWorker();
    await createRouter();

    // Restart worker if it dies
    worker.on("died", () => {
      console.error("Mediasoup Worker died. Restarting in 2s...");
      setTimeout(async () => {
        await createWorker();
        await createRouter();
      }, 2000);
    });

    // --- EXPRESS ---
    const app = express();

    // simple health check
    app.get("/health", (_, res) => {
      res.json({ status: "ok" });
    });

    const server = http.createServer(app);

    // --- SOCKET.IO ---
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    socketHandler(io);

    // --- START ---
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
};

startServer();
