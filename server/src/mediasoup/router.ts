import { worker } from "./worker";
import * as mediasoup from "mediasoup";

export let router: mediasoup.types.Router;

export const createRouter = async () => {
  router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
    ],
  });
};
