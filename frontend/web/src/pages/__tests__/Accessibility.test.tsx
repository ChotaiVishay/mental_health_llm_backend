import userEvent from '@testing-library/user-event';
import { it, expect, beforeEach } from 'vitest';
import App from '@/App';
import { render, screen, waitFor } from '@testing-library/react';
import { Providers } from '@/test-utils';

const storageKeys = [
  'support-atlas:preferences:dyslexic-mode',
  'support-atlas:preferences:easy-mode',
  'support-atlas:preferences:high-contrast-mode',
  'support-atlas:preferences:large-text-mode',
  'support-atlas:preferences:reduced-motion-mode',
  'support-atlas:preferences:screen-reader-mode',
];

const dataAttributes = [
  'data-dyslexic-mode',
  'data-easy-mode',
  'data-high-contrast',
  'data-large-text',
  'data-reduced-motion',
  'data-screen-reader-assist',
];

const classNames = [
  'dyslexic-mode',
  'easy-mode',
  'high-contrast-mode',
  'large-text-mode',
  'reduced-motion-mode',
  'screen-reader-mode',
];

beforeEach(() => {
  storageKeys.forEach((key) => localStorage.removeItem(key));
  dataAttributes.forEach((attr) => document.documentElement.removeAttribute(attr));
  classNames.forEach((cn) => document.documentElement.classList.remove(cn));
});

it('enables and disables dyslexia-friendly mode', async () => {
  const user = userEvent.setup();
  render(
    <Providers router={{ initialEntries: ['/accessibility'] }}>
      <App />
    </Providers>
  );

  const toggle = await screen.findByRole('button', { name: /dyslexia-friendly mode/i });

  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(document.documentElement.getAttribute('data-dyslexic-mode')).toBe('off');

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-dyslexic-mode')).toBe('on');
  });

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-dyslexic-mode')).toBe('off');
  });
});

it('enables and disables easy mode', async () => {
  const user = userEvent.setup();
  render(
    <Providers router={{ initialEntries: ['/accessibility'] }}>
      <App />
    </Providers>
  );

  const toggle = await screen.findByRole('button', { name: /easy mode/i });

  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(document.documentElement.getAttribute('data-easy-mode')).toBe('off');
  expect(localStorage.getItem('support-atlas:preferences:easy-mode')).toBe('off');

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-easy-mode')).toBe('on');
    expect(localStorage.getItem('support-atlas:preferences:easy-mode')).toBe('on');
  });

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-easy-mode')).toBe('off');
    expect(localStorage.getItem('support-atlas:preferences:easy-mode')).toBe('off');
  });
});

it('enables and disables high contrast mode', async () => {
  const user = userEvent.setup();
  render(
    <Providers router={{ initialEntries: ['/accessibility'] }}>
      <App />
    </Providers>
  );

  const toggle = await screen.findByRole('button', { name: /high contrast mode/i });

  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(document.documentElement.getAttribute('data-high-contrast')).toBe('off');
  expect(localStorage.getItem('support-atlas:preferences:high-contrast-mode')).toBe('off');

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-high-contrast')).toBe('on');
    expect(localStorage.getItem('support-atlas:preferences:high-contrast-mode')).toBe('on');
  });

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-high-contrast')).toBe('off');
    expect(localStorage.getItem('support-atlas:preferences:high-contrast-mode')).toBe('off');
  });
});

it('enables and disables large text mode', async () => {
  const user = userEvent.setup();
  render(
    <Providers router={{ initialEntries: ['/accessibility'] }}>
      <App />
    </Providers>
  );

  const toggle = await screen.findByRole('button', { name: /large text mode/i });

  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(document.documentElement.getAttribute('data-large-text')).toBe('off');
  expect(localStorage.getItem('support-atlas:preferences:large-text-mode')).toBe('off');

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-large-text')).toBe('on');
    expect(localStorage.getItem('support-atlas:preferences:large-text-mode')).toBe('on');
  });

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-large-text')).toBe('off');
    expect(localStorage.getItem('support-atlas:preferences:large-text-mode')).toBe('off');
  });
});

it('enables and disables reduced motion mode', async () => {
  const user = userEvent.setup();
  render(
    <Providers router={{ initialEntries: ['/accessibility'] }}>
      <App />
    </Providers>
  );

  const toggle = await screen.findByRole('button', { name: /reduce motion/i });

  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('off');
  expect(localStorage.getItem('support-atlas:preferences:reduced-motion-mode')).toBe('off');

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('on');
    expect(localStorage.getItem('support-atlas:preferences:reduced-motion-mode')).toBe('on');
  });

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('off');
    expect(localStorage.getItem('support-atlas:preferences:reduced-motion-mode')).toBe('off');
  });
});

it('enables and disables screen reader assist mode', async () => {
  const user = userEvent.setup();
  render(
    <Providers router={{ initialEntries: ['/accessibility'] }}>
      <App />
    </Providers>
  );

  const toggle = await screen.findByRole('button', { name: /screen reader assist/i });

  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(document.documentElement.getAttribute('data-screen-reader-assist')).toBe('off');
  expect(localStorage.getItem('support-atlas:preferences:screen-reader-mode')).toBe('off');

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-screen-reader-assist')).toBe('on');
    expect(localStorage.getItem('support-atlas:preferences:screen-reader-mode')).toBe('on');
  });

  await user.click(toggle);

  await waitFor(() => {
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-screen-reader-assist')).toBe('off');
    expect(localStorage.getItem('support-atlas:preferences:screen-reader-mode')).toBe('off');
  });
});
