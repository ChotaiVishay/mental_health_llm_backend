import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ChatList, { type ChatListSession } from '@/components/chat/ChatList';

const baseProps = {
  locale: 'en-AU',
  emptyMessage: 'No conversations yet.',
  signInCtaLabel: 'Sign in to view and continue previous conversations.',
  signInButtonLabel: 'Sign in',
  newChatLabel: 'Start a new conversation',
};

describe('<ChatList />', () => {
  it('prompts for sign-in when user is absent', () => {
    render(
      <ChatList
        {...baseProps}
        userId={undefined}
        sessions={[]}
        activeSessionId={null}
        onSelectSession={vi.fn()}
        onStartNewSession={vi.fn()}
      />,
    );

    expect(screen.getByText(baseProps.signInCtaLabel)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: baseProps.signInButtonLabel })).toHaveAttribute('href', '/login');
  });

  it('shows empty state and new chat button when there are no sessions', () => {
    const handleStart = vi.fn();
    render(
      <ChatList
        {...baseProps}
        userId="user-1"
        sessions={[]}
        activeSessionId={null}
        onSelectSession={vi.fn()}
        onStartNewSession={handleStart}
      />,
    );

    expect(screen.getByText(baseProps.emptyMessage)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: baseProps.newChatLabel }));
    expect(handleStart).toHaveBeenCalledTimes(1);
  });

  it('renders sessions and calls selection callback', () => {
    const handleSelect = vi.fn();
    const sessions: ChatListSession[] = [
      {
        id: 'session-1',
        title: null,
        lastMessage: 'Sure, let me help',
        lastMessageRole: 'assistant',
        createdAt: 1,
        updatedAt: 2,
      },
      {
        id: 'session-2',
        title: 'Named conversation',
        lastMessage: null,
        lastMessageRole: null,
        createdAt: 3,
        updatedAt: 4,
      },
    ];

    render(
      <ChatList
        {...baseProps}
        userId="user-1"
        sessions={sessions}
        activeSessionId="session-2"
        onSelectSession={handleSelect}
        onStartNewSession={vi.fn()}
      />,
    );

    expect(screen.getByText('Named conversation')).toBeInTheDocument();
    expect(screen.getAllByText('Sure, let me help').length).toBeGreaterThan(0);

    const active = screen.getByRole('button', { name: /Named conversation/i });
    expect(active.className.includes('is-active')).toBe(true);

    const other = screen.getByRole('button', { name: /sure, let me help/i });
    fireEvent.click(other);
    expect(handleSelect).toHaveBeenCalledWith('session-1');
  });
});
