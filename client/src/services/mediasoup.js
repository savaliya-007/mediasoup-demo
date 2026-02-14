import * as mediasoupClient from "mediasoup-client";

// ---------- LOAD DEVICE ----------
export const loadDevice = async (caps) => {
  if (!caps) {
    throw new Error("Router RTP capabilities missing");
  }

  try {
    const device = new mediasoupClient.Device();

    await device.load({
      routerRtpCapabilities: caps,
    });

    return device;
  } catch (err) {
    console.error("Mediasoup device load failed:", err);
    throw err; // important so caller knows it failed
  }
};
