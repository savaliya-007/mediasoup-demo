import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AzureConfig } from "../config/azureConfig";
import { translateText } from "./translator.service";
import { Server } from "socket.io";

let recognizer: sdk.SpeechRecognizer | null = null;
let pushStream: sdk.PushAudioInputStream | null = null;
let ioInstance: Server | null = null;

// ---------- INIT ----------
export const initSpeech = (io: Server) => {
  // prevent double init
  if (recognizer) return;

  ioInstance = io;

  try {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      AzureConfig.speechRecognition.key,
      AzureConfig.speechRecognition.region,
    );

    speechConfig.speechRecognitionLanguage =
      AzureConfig.speechRecognition.defaultSourceLang;

    // Azure expects PCM 16kHz mono
    const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);

    pushStream = sdk.AudioInputStream.createPushStream(format);
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);

    recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // ---------- EVENTS ----------

    recognizer.sessionStarted = () => {
      console.info("Azure speech session started");
    };

    recognizer.recognizing = (
      _sender: sdk.Recognizer,
      e: sdk.SpeechRecognitionEventArgs,
    ) => {
      // partial text — do NOT emit to clients to avoid spam
      if (e?.result?.text) {
        // intentionally quiet
      }
    };

  recognizer.recognized = async (
    _sender: sdk.Recognizer,
    e: sdk.SpeechRecognitionEventArgs,
  ) => {
    const text = e?.result?.text;
    if (!text) return;

    // original text
    ioInstance?.emit("speechText", text);

    // translated text
    try {
      const translated = await translateText(text);
      if (translated) {
        ioInstance?.emit("speechTranslated", translated);
      }
    } catch (err) {
      console.error("Translation failed:", err);
    }
  };


    recognizer.canceled = (
      _sender: sdk.Recognizer,
      e: sdk.SpeechRecognitionCanceledEventArgs,
    ) => {
      console.warn("Azure speech canceled:", e?.errorDetails);
    };

    // ---------- START ----------
    recognizer.startContinuousRecognitionAsync(
      () => console.info("Speech recognition started"),
      (err) => console.error("Speech recognition failed:", err),
    );
  } catch (err) {
    console.error("Speech init error:", err);
  }
};

// ---------- PUSH AUDIO ----------
export const pushAudioChunk = (data: Uint8Array) => {
  if (!pushStream || !data || data.byteLength === 0) return;

  try {
    // ensure pure ArrayBuffer (not SharedArrayBuffer)
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);

    pushStream.write(buffer);
  } catch (err) {
    console.error("PushStream write error:", err);
  }
};

// ---------- STOP ----------
export const stopSpeech = () => {
  if (!recognizer) return;

  try {
    recognizer.stopContinuousRecognitionAsync(
      () => {
        console.info("Speech recognition stopped");
      },
      (err) => console.error("Speech stop failed:", err),
    );
  } catch (err) {
    console.error("Speech stop error:", err);
  }

  try {
    pushStream?.close();
  } catch {}

  recognizer = null;
  pushStream = null;
  ioInstance = null;
};
