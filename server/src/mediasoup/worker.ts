import * as mediasoup from "mediasoup";

export let worker: mediasoup.types.Worker;

export const createWorker = async () => {
  worker = await mediasoup.createWorker();
};
