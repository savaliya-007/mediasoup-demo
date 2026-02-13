import { AzureConfig } from "../config/azureConfig";
import crypto from "crypto";

const endpoint = "https://api.cognitive.microsofttranslator.com";

export const translateText = async (
  text: string,
  targetLang: string,
): Promise<string> => {
  if (!text) return "";

  try {
    const response = await fetch(
      `${endpoint}/translate?api-version=3.0&to=${targetLang}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AzureConfig.textTranslation.key,
          "Ocp-Apim-Subscription-Region": AzureConfig.textTranslation.region,
          "Content-Type": "application/json",
          "X-ClientTraceId": crypto.randomUUID(),
        },
        body: JSON.stringify([{ Text: text }]),
      },
    );

    const data: any = await response.json();

    return data?.[0]?.translations?.[0]?.text || text;
  } catch (err) {
    console.error("Translation error:", err);
    return text; // fallback to original
  }
};
