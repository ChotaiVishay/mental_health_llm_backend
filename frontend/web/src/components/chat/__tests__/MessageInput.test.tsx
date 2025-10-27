import {
  describe, it, expect, vi,
} from 'vitest';
import {
  fireEvent, render, screen,
} from '@testing-library/react';
import MessageInput from '@/components/chat/MessageInput';
import { Providers } from '@/test-utils';

describe('MessageInput', () => {
  it('submits the message when Enter is pressed', () => {
    const handleSend = vi.fn();

    render(
      <Providers>
        <MessageInput onSend={handleSend} />
      </Providers>,
    );

    const textarea = screen.getByTestId('composer-input');
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(handleSend).toHaveBeenCalledWith('Hello world');
    expect(textarea).toHaveValue('');
  });

  it('does not submit when Shift+Enter is used', () => {
    const handleSend = vi.fn();

    render(
      <Providers>
        <MessageInput onSend={handleSend} />
      </Providers>,
    );

    const textarea = screen.getByTestId('composer-input');
    fireEvent.change(textarea, { target: { value: 'Line one' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(handleSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Line one');
  });

  it('disables the send button when input is empty', () => {
    const handleSend = vi.fn();

    render(
      <Providers>
        <MessageInput onSend={handleSend} />
      </Providers>,
    );

    const sendButton = screen.getByTestId('composer-send');
    expect(sendButton).toBeDisabled();

    const textarea = screen.getByTestId('composer-input');
    fireEvent.change(textarea, { target: { value: 'Ping' } });
    expect(sendButton).not.toBeDisabled();
  });
});
