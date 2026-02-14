import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { AzureConfig } from "../config/azureConfig";
import { Server } from "socket.io";

export const synthesizeSpeech = async (
  io: Server,
  socketId: string,
  text: string,
  lang: string,
) => {
  return new Promise<void>((resolve) => {
    try {
      const speechConfig = sdk.SpeechConfig.fromSubscription(
        AzureConfig.textToSpeech.key,
        AzureConfig.textToSpeech.region,
      );

      speechConfig.speechSynthesisVoiceName = getVoice(lang);

      const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.audioData) {
            io.to(socketId).emit("ttsAudio", result.audioData);
          }
          synthesizer.close();
          resolve();
        },
        (err) => {
          console.error("TTS error:", err);
          synthesizer.close();
          resolve();
        },
      );
    } catch (err) {
      console.error("TTS crash:", err);
      resolve();
    }
  });
};

const getVoice = (lang: string) => {
  const map: Record<string, string> = {
    hi: "hi-IN-SwaraNeural",
    es: "es-ES-ElviraNeural",
    fr: "fr-FR-DeniseNeural",
    de: "de-DE-KatjaNeural",
    gu: "gu-IN-DhwaniNeural",
  };

  return map[lang] || "en-US-JennyNeural";
};
