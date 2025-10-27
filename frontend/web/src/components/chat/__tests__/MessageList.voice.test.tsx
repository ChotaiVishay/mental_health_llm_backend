import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';

describe('MessageList voice playback', () => {
  it('invokes speak with the active locale', async () => {
    vi.resetModules();

    const speakMock = vi.fn();

    vi.doMock('@/hooks/useTextToSpeech', () => ({
      speak: speakMock,
    }));

    vi.doMock('@/i18n/LanguageProvider', () => ({
      useLanguage: () => ({
        locale: 'es-ES',
        language: 'es',
        t: (key: string) => key,
      }),
    }));

    const { default: MessageList } = await import('@/components/chat/MessageList');

    render(
      <MessageList
        items={[
          { id: '1', role: 'assistant', text: 'Respuesta en español', at: Date.now() },
        ]}
      />,
    );

    const playButton = await screen.findByRole('button', { name: /play this reply/i });
    fireEvent.click(playButton);

    expect(speakMock).toHaveBeenCalledWith('Respuesta en español', 'es-ES');

    vi.resetModules();
  });
});
