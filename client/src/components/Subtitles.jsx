import { useStore } from "../store/store";

export default function Subtitles() {
  const speechText = useStore((s) => s.speechText);
  const translatedText = useStore((s) => s.translatedText);

  if (!speechText && !translatedText) return null;

  return (
    <div className="w-full max-w-2xl text-center space-y-2 mt-4">
      {speechText && <p className="text-gray-300 text-lg">{speechText}</p>}

      {translatedText && (
        <p className="text-blue-400 text-xl font-semibold">{translatedText}</p>
      )}
    </div>
  );
}
