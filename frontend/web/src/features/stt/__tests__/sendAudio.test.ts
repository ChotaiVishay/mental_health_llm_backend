import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sendAudioForTranscription, STT_ENDPOINT } from '@/features/stt/sendAudio';

describe('sendAudioForTranscription', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
    global.fetch = originalFetch;
  });

  it('posts audio with language metadata and returns transcript text', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({ text: 'Hola' }),
    } as unknown as Response;

    vi.mocked(global.fetch).mockResolvedValue(mockResponse);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    const result = await sendAudioForTranscription(blob, 'es', 'es-ES');

    expect(result).toBe('Hola');
    expect(global.fetch).toHaveBeenCalledWith(STT_ENDPOINT, expect.objectContaining({ method: 'POST' }));

    const request = vi.mocked(global.fetch).mock.calls[0][1];
    const body = request?.body as FormData;
    expect(body.get('language')).toBe('es');
    expect(body.get('locale')).toBe('es-ES');
    expect(body.get('audio')).toBeInstanceOf(Blob);
  });

  it('throws when the network response is not ok', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: () => Promise.resolve('server error'),
    } as unknown as Response;

    vi.mocked(global.fetch).mockResolvedValue(mockResponse);

    const blob = new Blob(['audio'], { type: 'audio/webm' });
    await expect(sendAudioForTranscription(blob)).rejects.toThrow('STT request failed (500)');
  });
});
