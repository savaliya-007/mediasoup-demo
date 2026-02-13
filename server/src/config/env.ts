import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  KEY_TEXT_TO_TEXT_AZURE: process.env.KEY_TEXT_TO_TEXT_AZURE || "",
  REGION_TEXT_TO_TEXT_AZURE: process.env.REGION_TEXT_TO_TEXT_AZURE || "",

  KEY_SPEECH_RECOGNISE_AZURE: process.env.KEY_SPEECH_RECOGNISE_AZURE || "",
  REGION_SPEECH_RECOGNISE_AZURE:
    process.env.REGION_SPEECH_RECOGNISE_AZURE || "",
};
