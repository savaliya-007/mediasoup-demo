import * as mediasoup from "mediasoup";
import { worker } from "./worker";
import { mediaCodecs } from "../config/mediasoupConfig";

export let router: mediasoup.types.Router | null = null;

export const createRouter = async () => {
  if (router) return router;

  router = await worker.createRouter({
    mediaCodecs,
  });
  
  return router;
};

export const getRouter = () => {
  if (!router) throw new Error("Router not ready");
  return router;
};
