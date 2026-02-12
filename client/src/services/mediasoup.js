import * as mediasoupClient from "mediasoup-client";

export const loadDevice = async (caps) => {
  const device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities: caps });
  return device;
};
