import { getRouter } from "./router";
import * as mediasoup from "mediasoup";

type CreateTransportResult = {
  transport: mediasoup.types.WebRtcTransport;
  params: {
    id: string;
    iceParameters: mediasoup.types.IceParameters;
    iceCandidates: mediasoup.types.IceCandidate[];
    dtlsParameters: mediasoup.types.DtlsParameters;
  };
};

export const createTransport = async (): Promise<CreateTransportResult> => {
  const router = getRouter();

  if (!router) {
    throw new Error("Mediasoup router not initialized");
  }

  try {
    const transport = await router.createWebRtcTransport({
      // 0.0.0.0 = listen all interfaces
      // announcedIp MUST be your public server IP in production
      listenIps: [
        {
          ip: "0.0.0.0",
          announcedIp: "127.0.0.1",
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  } catch (err) {
    console.error("Create WebRTC transport failed:", err);
    throw err;
  }
};
