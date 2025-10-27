import { VITE } from '@/utils/env';

export type TranslationRequest = {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
};

export type TranslationResult = {
  ok: boolean;
  text: string;
};

const CUSTOM_ENDPOINT = VITE.VITE_TRANSLATION_API_URL?.trim() || null;
const GOOGLE_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

/** Normalise translation API responses that may use different field names. */
function extractTranslatedText(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const candidateKeys = ['translated_text', 'translatedText', 'translation', 'text'];
  for (const key of candidateKeys) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim().length) {
      return value;
    }
  }

  return null;
}

async function translateViaCustomEndpoint(
  endpoint: string,
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string | null> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      source: sourceLanguage,
      target: targetLanguage,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return extractTranslatedText(data);
}

type GoogleResponse = unknown;

function parseGoogleTranslation(data: GoogleResponse): string | null {
  if (!Array.isArray(data) || data.length === 0) return null;
  const segments = data[0];
  if (!Array.isArray(segments)) return null;

  const pieces = (segments as unknown[])
    .map((segment) => (Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : ''))
    .join('');

  const trimmed = pieces.trim();
  return trimmed.length ? trimmed : null;
}

async function translateViaGoogle(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string | null> {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: sourceLanguage && sourceLanguage !== 'auto' ? sourceLanguage : 'auto',
    tl: targetLanguage,
    dt: 't',
    q: text,
  });

  const response = await fetch(`${GOOGLE_TRANSLATE_ENDPOINT}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google Translate HTTP ${response.status}`);
  }

  const data = (await response.json()) as GoogleResponse;
  return parseGoogleTranslation(data);
}

export async function translateText({
  text,
  sourceLanguage,
  targetLanguage,
}: TranslationRequest): Promise<TranslationResult> {
  const original = text.trim();
  if (!original || sourceLanguage === targetLanguage) {
    return { ok: true, text };
  }

  const attempts: Array<() => Promise<string | null>> = [];
  if (CUSTOM_ENDPOINT) {
    attempts.push(() => translateViaCustomEndpoint(CUSTOM_ENDPOINT, original, sourceLanguage, targetLanguage));
  }
  attempts.push(() => translateViaGoogle(original, sourceLanguage, targetLanguage));

  for (const attempt of attempts) {
    try {
      const translated = await attempt();
      if (translated && translated.trim().length) {
        return { ok: true, text: translated };
      }
    } catch (error) {
      console.error('Translation attempt failed', error);
    }
  }

  return { ok: false, text };
}

export async function translateToEnglish(text: string, language: string) {
  return translateText({ text, sourceLanguage: language, targetLanguage: 'en' });
}

export async function translateFromEnglish(text: string, language: string) {
  return translateText({ text, sourceLanguage: 'en', targetLanguage: language });
}
