import * as mediasoup from "mediasoup";

export let worker: mediasoup.types.Worker;

export const createWorker = async () => {
  try {
    worker = await mediasoup.createWorker({
      logLevel: "warn",
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
    });

    worker.on("died", () => {
      console.error("Mediasoup Worker died! Restarting...");
      process.exit(1); // or restart logic
    });

    return worker;
  } catch (err) {
    console.error("Worker creation failed:", err);
    throw err;
  }
};
