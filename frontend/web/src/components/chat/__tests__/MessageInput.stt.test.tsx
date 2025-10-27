import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@/test-utils';

describe('MessageInput speech-to-text fallback', () => {
  it('uploads recorded audio with language metadata and inserts transcript', async () => {
    vi.resetModules();

    const recorderControls = {
      start: vi.fn(),
      stop: vi.fn(),
      blob: new Blob(['audio'], { type: 'audio/webm' }),
    };

    const sendAudioMock = vi.fn().mockResolvedValue('Hola');

    vi.doMock('@/hooks/useSpeechToText', () => ({
      useSpeechToText: () => ({
        isSupported: false,
        isListening: false,
        interim: '',
        finalText: null,
        error: null,
        errorCode: null,
        start: vi.fn().mockResolvedValue(false),
        stop: vi.fn(),
      }),
    }));

    vi.doMock('@/hooks/useMicRecorder', () => {
      const React = require('react');
      const { useState } = React;
      return {
        useMicRecorder: () => {
          const [recording, setRecording] = useState(false);
          return {
            recording,
            error: null,
            start: vi.fn(async () => {
              recorderControls.start();
              setRecording(true);
            }),
            stop: vi.fn(() => {
              recorderControls.stop();
              setRecording(false);
              return recorderControls.blob;
            }),
          };
        },
      };
    });

    vi.doMock('@/features/stt/sendAudio', () => ({
      sendAudioForTranscription: sendAudioMock,
    }));

    const { default: MessageInput } = await import('@/components/chat/MessageInput');

    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const startButton = screen.getByRole('button', { name: /start voice input/i });

    await act(async () => {
      fireEvent.click(startButton);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(recorderControls.start).toHaveBeenCalledTimes(1);
    });

    const stopButton = await screen.findByRole('button', { name: /stop voice input/i });

    await act(async () => {
      fireEvent.click(stopButton);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(sendAudioMock).toHaveBeenCalledWith(recorderControls.blob, 'en', 'en-AU');
    });

    const textarea = screen.getByRole('textbox', { name: /message/i }) as HTMLTextAreaElement;
    expect(textarea.value).toBe('Hola');

    vi.resetModules();
  });
});
