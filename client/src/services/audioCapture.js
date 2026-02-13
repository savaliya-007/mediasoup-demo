import { socket } from "./socket";

let audioContext = null;
let workletNode = null;
let source = null;
let stream = null;

// ---------- START ----------
export const startAudioCapture = async () => {
  if (audioContext) return;

  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new (window.AudioContext || window.webkitAudioContext)();

  await audioContext.audioWorklet.addModule("/pcmProcessor.js");

  source = audioContext.createMediaStreamSource(stream);
  workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

  workletNode.port.onmessage = (event) => {
    if (!audioContext) return;

    const floatData = event.data;

    console.log("AUDIO CHUNK SENDING");

    // Convert to Uint8Array (safe for socket)
    const uint8 = new Uint8Array(floatData.buffer);

    socket.emit("audio:chunk", uint8);
  };


  source.connect(workletNode);
};

// ---------- STOP ----------
export const stopAudioCapture = () => {
  try {
    workletNode?.disconnect();
    source?.disconnect();
    audioContext?.close();
    stream?.getTracks().forEach((t) => t.stop());
  } catch (err) {
    console.warn("Audio cleanup error:", err);
  }

  workletNode = null;
  source = null;
  audioContext = null;
  stream = null;
};
