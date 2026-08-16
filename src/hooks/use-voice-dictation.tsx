import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Lightweight wrapper around the browser's Web Speech API for free, no-key
 * voice dictation. Returns interim results live and appends final transcripts
 * to whatever value is currently on the host input.
 */

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceDictationSupported() {
  return !!getRecognitionCtor();
}

export function useVoiceDictation(options: {
  /** Called with the appended transcript text. */
  onTranscript: (full: string) => void;
  /** Current value of the field — used as the prefix when appending. */
  getCurrentValue: () => string;
}) {
  const { onTranscript, getCurrentValue } = options;
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const baselineRef = useRef("");

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast.error("Голосовой ввод не поддерживается в этом браузере. Попробуйте Chrome.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";

    baselineRef.current = getCurrentValue();
    const baselineNeedsSpace =
      baselineRef.current.length > 0 && !/\s$/.test(baselineRef.current);

    rec.onresult = (e: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) {
        const prefix = baselineRef.current + (baselineNeedsSpace ? " " : "");
        baselineRef.current = prefix + finalChunk;
        onTranscript(baselineRef.current);
        setInterim("");
      } else {
        setInterim(interimChunk);
      }
    };
    rec.onerror = (e: any) => {
      if (e?.error === "not-allowed") {
        toast.error("Доступ к микрофону запрещён — включите его в настройках браузера.");
      } else if (e?.error === "no-speech") {
        // silent, will auto-end
      } else if (e?.error) {
        toast.error(`Ошибка голосового ввода: ${e.error}`);
      }
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    try {
      rec.start();
      recRef.current = rec;
      setListening(true);
    } catch {
      toast.error("Не удалось запустить голосовой ввод.");
    }
  }, [getCurrentValue, onTranscript]);

  useEffect(() => {
    return () => {
      recRef.current?.stop();
    };
  }, []);

  return {
    listening,
    interim,
    start,
    stop,
    toggle: () => (listening ? stop() : start()),
    supported: !!getRecognitionCtor(),
  };
}
