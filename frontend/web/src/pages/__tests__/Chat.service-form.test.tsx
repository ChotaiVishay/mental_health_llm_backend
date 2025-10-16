import { it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Chat from '@/pages/Chat';
import { Providers } from '@/test-utils';

const sendMessageMock = vi.fn();

vi.mock('@/api/chat', () => ({
  sendMessageToAPI: (...args: unknown[]) => sendMessageMock(...args),
  fetchChatSessions: vi.fn(async () => []),
}));

afterEach(() => {
  sendMessageMock.mockReset();
});

it('opens the service form and submits the required payload', async () => {
  sendMessageMock
    .mockResolvedValueOnce({
      response: "Great - let's add a new service.",
      session_id: 'sid-123',
      action: 'show_service_form',
    })
    .mockResolvedValueOnce({
      response: 'Saved! The service has been added to the directory.',
      session_id: 'sid-123',
    });

  render(
    <Providers router={{ initialEntries: ['/chat'] }} auth={{ user: { id: 'user-1', email: 'test@example.com' } }}>
      <Chat />
    </Providers>,
  );

  const textbox = await screen.findByRole('textbox', { name: /message/i });
  fireEvent.change(textbox, { target: { value: 'add a new service' } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));

  const form = await screen.findByRole('form', { name: /add a new service/i });
  const formWithin = within(form);
  expect(formWithin.getByRole('heading', { level: 3, name: /submit a service/i })).toBeInTheDocument();

  fireEvent.change(formWithin.getByLabelText(/Service name/i), { target: { value: 'Atlas Mental Clinic' } });
  fireEvent.change(formWithin.getByLabelText(/Organisation/i), { target: { value: 'Atlas Health' } });
  fireEvent.change(formWithin.getByLabelText(/Campus or site/i), { target: { value: 'City Campus' } });
  fireEvent.change(formWithin.getByLabelText(/Region/i), { target: { value: 'North West Metro' } });

  fireEvent.click(formWithin.getByRole('checkbox', { name: 'Community mental health support' }));
  fireEvent.change(formWithin.getByLabelText(/Delivery method/i), { target: { value: 'In person' } });
  fireEvent.change(formWithin.getByLabelText(/Level of care/i), { target: { value: 'Moderate intensity' } });
  fireEvent.change(formWithin.getByLabelText(/Workforce type/i), { target: { value: 'Tertiary qualified' } });
  fireEvent.change(formWithin.getByLabelText(/Referral pathway/i), { target: { value: 'Free call' } });
  fireEvent.change(formWithin.getByLabelText(/^Cost/i), { target: { value: 'Paid' } });
  fireEvent.click(formWithin.getByLabelText(/^Adult$/i));

  fireEvent.change(formWithin.getByLabelText(/Street address/i), { target: { value: '123 Main St' } });
  fireEvent.change(formWithin.getByLabelText(/Suburb/i), { target: { value: 'Carlton' } });
  fireEvent.change(formWithin.getByLabelText(/Postcode/i), { target: { value: '3053' } });
  fireEvent.change(formWithin.getByLabelText(/Phone/i), { target: { value: '03 9000 0000' } });
  fireEvent.change(formWithin.getByLabelText(/Email/i), { target: { value: 'info@atlas.example' } });
  fireEvent.change(formWithin.getByLabelText(/Website/i), { target: { value: 'https://atlas.example' } });
  fireEvent.change(formWithin.getByLabelText(/Expected wait time/i), { target: { value: '2-3 weeks' } });
  fireEvent.change(formWithin.getByLabelText(/Notes/i), { target: { value: 'Evening appointments available' } });

  fireEvent.click(formWithin.getByRole('button', { name: /submit service/i }));

  await waitFor(() => expect(sendMessageMock).toHaveBeenCalledTimes(2));

  const secondCall = sendMessageMock.mock.calls[1]?.[0] as Record<string, unknown>;
  expect(secondCall).toMatchObject({
    type: 'service_form',
    session_id: 'sid-123',
  });

  const payload = (secondCall?.data ?? {}) as Record<string, unknown>;
  expect(payload).toMatchObject({
    service_name: 'Atlas Mental Clinic',
    organisation_name: 'Atlas Health',
    campus_name: 'City Campus',
    region_name: 'North West Metro',
    delivery_method: 'In person',
    level_of_care: 'Moderate intensity',
    address: '123 Main St',
    suburb: 'Carlton',
    state: 'VIC',
    postcode: '3053',
    referral_pathway: 'Free call',
    cost: 'Paid',
    workforce_type: 'Tertiary qualified',
    wait_time: '2-3 weeks',
    expected_wait_time: '2-3 weeks',
    notes: 'Evening appointments available',
  });
  expect(payload.service_type).toEqual(['Community mental health support']);
  expect(payload.target_population).toEqual(['Adult']);

  await screen.findByText(/saved! the service has been added/i);
  expect(screen.queryByRole('heading', { level: 3, name: /submit a service/i })).not.toBeInTheDocument();
  expect(screen.getByText('[Service form submitted]')).toBeInTheDocument();
});

it('lets a user open and cancel the service form without sending a message', async () => {
  sendMessageMock.mockResolvedValue({
    response: 'Hi! How can I help you today?',
    session_id: null,
  });

  render(
    <Providers router={{ initialEntries: ['/chat'] }} auth={{ user: null }}>
      <Chat />
    </Providers>,
  );

  fireEvent.click(await screen.findByRole('button', { name: /^Add service$/i }));
  expect(await screen.findByRole('heading', { level: 3, name: /submit a service/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  await waitFor(() => expect(screen.queryByRole('heading', { level: 3, name: /submit a service/i })).toBeNull());
  expect(sendMessageMock).not.toHaveBeenCalled();
});
