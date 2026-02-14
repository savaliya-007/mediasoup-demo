import { ENV } from "./env";

export const AzureConfig = {
  // textTranslation: {
  //   key: ENV.KEY_TEXT_TO_TEXT_AZURE,
  //   region: ENV.REGION_TEXT_TO_TEXT_AZURE,
  //   defaultTargetLang: "es",
  // },
  speechRecognition: {
    key: ENV.KEY_SPEECH_RECOGNISE_AZURE,
    region: ENV.REGION_SPEECH_RECOGNISE_AZURE,
    defaultSourceLang: "en-US",
  },
};
