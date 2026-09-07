import { useCallback, useEffect, useRef, useState } from "react";
import { transcribeAudio } from "@/lib/scan-api";

export type RecorderStatus = "idle" | "recording" | "transcribing" | "error";

interface UseVoiceRecorderOptions {
  maxDurationMs?: number;
  onResult?: (text: string) => void;
}

const DEFAULT_MAX_DURATION_MS = 20_000;

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const { maxDurationMs = DEFAULT_MAX_DURATION_MS, onResult } = options;
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string>();

  const mediaRecorderRef = useRef<MediaRecorder | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const startedAtRef = useRef(0);

  const cleanupTimers = useCallback(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);
  }, []);

  const stop = useCallback(() => {
    cleanupTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [cleanupTimers]);

  const start = useCallback(async () => {
    setError(undefined);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setStatus("error");
      setError("Microphone access was denied. You can type this field manually instead.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      setStatus("transcribing");
      try {
        const result = await transcribeAudio(blob);
        setStatus("idle");
        onResult?.(result.text);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Could not transcribe the recording.");
      }
    };

    recorder.start();
    startedAtRef.current = Date.now();
    setStatus("recording");
    setElapsedMs(0);

    tickTimerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 200);
    stopTimerRef.current = setTimeout(stop, maxDurationMs);
  }, [maxDurationMs, onResult, stop]);

  useEffect(() => cleanupTimers, [cleanupTimers]);

  return { status, elapsedMs, error, start, stop };
}
