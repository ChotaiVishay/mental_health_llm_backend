import { useCallback, useEffect, useRef, useState } from 'react';

type RecorderCandidate = {
  mime: string;
  type: string;
};

const CANDIDATES: RecorderCandidate[] = [
  { mime: 'audio/webm;codecs=opus', type: 'audio/webm' },
  { mime: 'audio/webm', type: 'audio/webm' },
  { mime: 'audio/ogg;codecs=opus', type: 'audio/ogg' },
  { mime: 'audio/ogg', type: 'audio/ogg' },
  { mime: 'audio/mp4', type: 'audio/mp4' },
  { mime: 'audio/mpeg', type: 'audio/mpeg' },
  { mime: 'audio/aac', type: 'audio/aac' },
];

type MediaRecorderConstructor = typeof MediaRecorder;

function getMediaRecorder(): MediaRecorderConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { MediaRecorder?: MediaRecorderConstructor }).MediaRecorder;
}

function pickMime(recorderClass: MediaRecorderConstructor | undefined): RecorderCandidate | null {
  if (!recorderClass || typeof recorderClass.isTypeSupported !== 'function') {
    // Older implementations (Edge legacy) accept constructor without type
    return recorderClass ? CANDIDATES[0] : null;
  }
  for (const candidate of CANDIDATES) {
    if (recorderClass.isTypeSupported(candidate.mime)) {
      return candidate;
    }
  }
  return null;
}

function friendlyError(message: string): string {
  switch (message) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'Microphone access was blocked. Allow access in your browser settings.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was found on this device.';
    case 'NotReadableError':
      return 'Another application is using the microphone.';
    case 'AbortError':
      return 'Microphone recording was aborted.';
    case 'NotSupportedError':
      return 'This browser cannot record audio. Try an updated browser.';
    default:
      return message;
  }
}

export function useMicRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const typeRef = useRef<RecorderCandidate | null>(null);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (err) {
        void err;
      }
    });
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (recording) return;

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Voice recording is not supported in this browser.');
      return;
    }

    const RecorderClass = getMediaRecorder();
    if (!RecorderClass) {
      setError('Voice recording is not supported in this browser.');
      return;
    }

    const candidate = pickMime(RecorderClass);
    if (!candidate) {
      setError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = candidate.mime ? { mimeType: candidate.mime } : undefined;
      const recorder = new RecorderClass(stream, options);
      chunksRef.current = [];
      recorder.ondataavailable = (event: unknown) => {
        const data = (event as { data?: Blob }).data;
        if (data && data.size > 0) {
          chunksRef.current.push(data);
        }
      };
      recorder.onstop = () => cleanupStream();

      mediaRef.current = recorder;
      streamRef.current = stream;
      typeRef.current = candidate;
      recorder.start();
      setRecording(true);
    } catch (err) {
      const message =
        err instanceof Error ? friendlyError(err.name || err.message) : 'Could not access microphone.';
      setError(message);
      cleanupStream();
    }
  }, [cleanupStream, recording]);

  const stop = useCallback((): Blob | null => {
    const recorder = mediaRef.current;
    if (!recorder) return null;

    try {
      recorder.stop();
    } catch (err) {
      void err;
    }
    mediaRef.current = null;
    setRecording(false);

    const candidate = typeRef.current;
    const type = candidate?.type ?? 'audio/webm';
    const blob = new Blob(chunksRef.current, { type });
    typeRef.current = null;
    chunksRef.current = [];
    return blob;
  }, []);

  useEffect(
    () => () => {
      try {
        mediaRef.current?.stop();
      } catch (err) {
        void err;
      }
      cleanupStream();
    },
    [cleanupStream],
  );

  return { recording, error, start, stop };
}
