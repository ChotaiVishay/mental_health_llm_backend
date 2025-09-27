import { useCallback, useEffect, useRef, useState } from "react";

export function useMicRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const start = useCallback(async () => {
    setError(null);
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      rec.ondataavailable = (e: BlobEvent) => {
        if (e.data) chunksRef.current.push(e.data);
      };
      rec.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : typeof e === 'string' ? e : 'Could not access microphone';
      setError(message);
    }
  }, [recording]);

  const stop = useCallback((): Blob | null => {
    if (!mediaRef.current) return null;
    try {
      mediaRef.current.stop();
    } catch (err) {
      // ignore stop race
      void err;
    }
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    mediaRef.current = null;
    setRecording(false);
    return blob;
  }, []);

  useEffect(() => {
    return () => {
      try {
        mediaRef.current?.stop();
      } catch (err) {
        // ignore cleanup race
        void err;
      }
    };
  }, []);

  return { recording, error, start, stop };
}