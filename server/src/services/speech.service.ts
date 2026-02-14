import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AzureConfig } from "../config/azureConfig";
import { translateText } from "./translator.service";
import { Server } from "socket.io";

let recognizer: sdk.SpeechRecognizer | null = null;
let pushStream: sdk.PushAudioInputStream | null = null;
let ioInstance: Server | null = null;

// ---------- INTERNAL CREATOR ----------
const createRecognizer = (lang: string) => {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    AzureConfig.speechRecognition.key,
    AzureConfig.speechRecognition.region,
  );

  speechConfig.speechRecognitionLanguage = lang;

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream!);

  recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  // ---------- EVENTS ----------

  recognizer.sessionStarted = () => {
    console.info("Azure speech session started:", lang);
  };

  recognizer.recognizing = () => {
    // ignore partials
  };

  recognizer.recognized = async (
    _sender: sdk.Recognizer,
    e: sdk.SpeechRecognitionEventArgs,
  ) => {
    const text = e?.result?.text;
    if (!text) return;

    ioInstance?.emit("speechText", text);

    try {
      const sockets = await ioInstance?.fetchSockets();

      for (const s of sockets || []) {
        const lang = s.data.lang || "hi";

        const translated = await translateText(text, lang);
        if (translated) {
          s.emit("speechTranslated", translated);
        }
      }
    } catch (err) {
      console.error("Translation loop failed:", err);
    }
  };

  recognizer.canceled = (
    _sender: sdk.Recognizer,
    e: sdk.SpeechRecognitionCanceledEventArgs,
  ) => {
    console.warn("Azure speech canceled:", e?.errorDetails);
  };

  recognizer.startContinuousRecognitionAsync(
    () => console.info("Speech recognition started"),
    (err) => console.error("Speech recognition failed:", err),
  );
};

// ---------- INIT ----------
export const initSpeech = (io: Server) => {
  if (recognizer) return;

  ioInstance = io;

  try {
    const format = sdk.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1);
    pushStream = sdk.AudioInputStream.createPushStream(format);

    createRecognizer(AzureConfig.speechRecognition.defaultSourceLang);
  } catch (err) {
    console.error("Speech init error:", err);
  }
};

// ---------- UPDATE SOURCE LANGUAGE ----------
export const updateSourceLanguage = (lang: string) => {
  if (!pushStream) return;

  try {
    recognizer?.stopContinuousRecognitionAsync(() => {
      recognizer?.close();
      recognizer = null;

      console.info("Changing source language to:", lang);

      createRecognizer(lang);
    });
  } catch (err) {
    console.error("Source language update failed:", err);
  }
};

// ---------- PUSH AUDIO ----------
export const pushAudioChunk = (data: Uint8Array) => {
  if (!pushStream || !data || data.byteLength === 0) return;

  try {
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
      () => console.info("Speech recognition stopped"),
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
