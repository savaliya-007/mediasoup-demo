import express from "express";
import http from "http";
import { Server } from "socket.io";
import { socketHandler } from "./socket/socketHandler";
import { createWorker } from "./mediasoup/worker";
import { createRouter } from "./mediasoup/router";

(async () => {
  await createWorker();
  await createRouter();

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: "*" },
  });

  socketHandler(io);

  server.listen(8000, () =>
    console.log("Server running on http://localhost:8000"),
  );
})();
