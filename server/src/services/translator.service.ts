import { AzureConfig } from "../config/azureConfig";

// ---------- TRANSLATE TEXT ----------
export const translateText = async (
  text: string,
  targetLang?: string,
): Promise<string | null> => {
  if (!text) return null;

  const lang = targetLang || AzureConfig.textTranslation.defaultTargetLang;

  try {
    const res = await fetch(
      `${AzureConfig.textTranslation.endpoint}/translate?api-version=3.0&to=${lang}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AzureConfig.textTranslation.key,
          "Ocp-Apim-Subscription-Region": AzureConfig.textTranslation.region,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ Text: text }]),
      },
    );

    if (!res.ok) {
      console.error("Translator HTTP Error:", res.status);
      return null;
    }

    const data = await res.json();

    return data?.[0]?.translations?.[0]?.text ?? null;
  } catch (err) {
    console.error("Translation error:", err);
    return null;
  }
};
