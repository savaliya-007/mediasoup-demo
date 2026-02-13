import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AzureConfig } from "../config/azureConfig";

let recognizer: sdk.SpeechRecognizer | null = null;
let pushStream: sdk.PushAudioInputStream | null = null;

// ---------- INIT ----------
export const initSpeech = () => {
  if (recognizer) return;

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    AzureConfig.speechRecognition.key,
    AzureConfig.speechRecognition.region,
  );

  speechConfig.speechRecognitionLanguage = "en-US";

  // PCM 16kHz 16-bit mono
  const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);

  pushStream = sdk.AudioInputStream.createPushStream(format);
  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

  recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
};

// ---------- START RECOGNITION ----------
export const startRecognition = (onText: (text: string) => void) => {
  if (!recognizer) return;

  recognizer.recognizing = (_, e) => {
    if (e.result?.text) {
      console.log("PARTIAL:", e.result.text);
    }
  };

  recognizer.recognized = (_, e) => {
    if (e.result?.text) {
      console.log("AZURE TEXT:", e.result.text);
      onText(e.result.text);
    }
  };

  recognizer?.startContinuousRecognitionAsync();
};

// ---------- STOP ----------
export const stopRecognition = () => {
  recognizer?.stopContinuousRecognitionAsync();
};

// ---------- DOWNSAMPLE HELPER ----------
const downsampleBuffer = (
  buffer: Float32Array,
  inRate: number,
  outRate: number,
) => {
  if (outRate === inRate) return buffer;

  const ratio = inRate / outRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);

  let offset = 0;
  for (let i = 0; i < newLength; i++) {
    const nextOffset = Math.round((i + 1) * ratio);
    let accum = 0;
    let count = 0;

    for (let j = offset; j < nextOffset && j < buffer.length; j++) {
      const sample = buffer[j] ?? 0; // TS-safe
      accum += sample;
      count++;
    }

    result[i] = count > 0 ? accum / count : 0;
    offset = nextOffset;
  }

  return result;
};

// ---------- PUSH AUDIO ----------
export const pushAudioChunk = (chunk: ArrayBuffer) => {
  if (!pushStream) return;

  try {
    // Uint8 → Float32
    const floatData = new Float32Array(chunk);

    // 48k → 16k downsample
    const downsampled = downsampleBuffer(floatData, 48000, 16000);

    // Float32 → PCM16
    const pcmBuffer = new ArrayBuffer(downsampled.length * 2);
    const view = new DataView(pcmBuffer);

    for (let i = 0; i < downsampled.length; i++) {
      const sample = downsampled[i] ?? 0;
      const s = Math.max(-1, Math.min(1, sample));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    pushStream?.write(pcmBuffer);
  } catch (err) {
    console.error("PushStream write error:", err);
  }
};

// ---------- CLOSE ----------
export const closeSpeechStream = () => {
  try {
    pushStream?.close();
  } catch {
    // ignore
  }

  pushStream = null;
  recognizer = null;
};
