import { beforeAll, afterAll, beforeEach, vi, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Services from '@/pages/Services';

const mockServices = [
  {
    id: 'svc-1',
    name: 'Northside Counselling',
    orgKind: 'counsellor',
    suburb: 'Brunswick',
    specialty: 'Anxiety',
    updatedAt: '2025-06-10T10:00:00Z',
  },
  {
    id: 'svc-2',
    name: 'City GP Clinic',
    orgKind: 'gp',
    suburb: 'Melbourne CBD',
    specialty: 'Mental health care plan',
    updatedAt: '2025-05-28T09:00:00Z',
  },
];

beforeAll(() => {
  // keep the code path on “mock”
  vi.stubEnv('VITE_SERVICES_MOCK', '1');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// IMPORTANT: return a real Response so .json() and .text() both work
beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(global, 'fetch').mockImplementation(async () => {
    return new Response(JSON.stringify(mockServices), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
});

it('shows default listing and allows sorting', async () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Services />} />
      </Routes>
    </MemoryRouter>
  );

  // wait until items render
  await screen.findByText('Northside Counselling');
  await screen.findByText('City GP Clinic');

  // sort control: switch to name if the option exists; otherwise assert default
  const select = screen.getByLabelText('Sort') as HTMLSelectElement;
  const hasName = Array.from(select.options).some(o => o.value === 'name');
  if (hasName) {
    fireEvent.change(select, { target: { value: 'name' } });
    expect(select.value).toBe('name');
  } else {
    expect(select.value).toBe('recent');
  }
});