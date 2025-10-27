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

const API_BASE_URL = VITE.VITE_API_BASE_URL?.trim() ?? 'https://d1hfq1dvtow5bt.cloudfront.net';

const DEFAULT_ENDPOINT = `${API_BASE_URL}/api/v1/translate`;
const TRANSLATION_ENDPOINT = VITE.VITE_TRANSLATION_API_URL?.trim() || DEFAULT_ENDPOINT;

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

export async function translateText({
  text,
  sourceLanguage,
  targetLanguage,
}: TranslationRequest): Promise<TranslationResult> {
  if (!text.trim() || sourceLanguage === targetLanguage) {
    return { ok: true, text };
  }

  try {
    const response = await fetch(TRANSLATION_ENDPOINT, {
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
    const translated = extractTranslatedText(data);
    if (!translated) {
      throw new Error('Missing translated text in response');
    }

    return { ok: true, text: translated };
  } catch (error) {
    console.error('Translation failed', error);
    return { ok: false, text };
  }
}

export async function translateToEnglish(text: string, language: string) {
  return translateText({ text, sourceLanguage: language, targetLanguage: 'en' });
}

export async function translateFromEnglish(text: string, language: string) {
  return translateText({ text, sourceLanguage: 'en', targetLanguage: language });
}
