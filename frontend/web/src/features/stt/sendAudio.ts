import { VITE } from '@/utils/env';

const backendOrigin = VITE.VITE_BACKEND_ORIGIN?.trim().replace(/\/+$/, '');

function resolveEndpoint() {
  if (backendOrigin) return `${backendOrigin}/api/stt`;

  const fallback = VITE.VITE_API_BASE_URL?.trim();
  if (fallback) {
    // Remove any trailing path segments like /api/v1/…
    try {
      const url = new URL(fallback);
      return `${url.origin}/api/stt`;
    } catch (err) {
      console.warn('Invalid VITE_API_BASE_URL, falling back to relative /api/stt', err);
    }
  }
  return '/api/stt';
}

const STT_ENDPOINT = resolveEndpoint();

function resolveExtension(type: string | undefined): string {
  if (!type) return 'webm';
  const primary = type.split(';')[0].trim();
  switch (primary) {
    case 'audio/webm':
      return 'webm';
    case 'audio/ogg':
      return 'ogg';
    case 'audio/mp4':
      return 'mp4';
    case 'audio/mpeg':
      return 'mp3';
    case 'audio/aac':
      return 'aac';
    default:
      return 'webm';
  }
}

export async function sendAudioForTranscription(blob: Blob, language?: string, locale?: string): Promise<string | null> {
  const form = new FormData();
  const extension = resolveExtension(blob.type);
  form.append('audio', blob, `voice.${extension}`);
  if (language) form.append('language', language);
  if (locale) form.append('locale', locale);

  const response = await fetch(STT_ENDPOINT, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`STT request failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as { text?: string; transcript?: string };
  const text = data.text ?? data.transcript ?? null;
  return text && text.trim().length ? text.trim() : null;
}

export { STT_ENDPOINT };
