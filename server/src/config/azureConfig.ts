import { ENV } from "./env";

export const AzureConfig = {
  speechRecognition: {
    key: ENV.KEY_SPEECH_RECOGNISE_AZURE || "",
    region: ENV.REGION_SPEECH_RECOGNISE_AZURE || "eastus",
    defaultSourceLang: "en-US",
  },

  textTranslation: {
    key: ENV.KEY_TEXT_TO_TEXT_AZURE || "",
    region: ENV.REGION_TEXT_TO_TEXT_AZURE || "uksouth",
    endpoint: "https://api.cognitive.microsofttranslator.com",
    defaultTargetLang: "hi",
  },
};
