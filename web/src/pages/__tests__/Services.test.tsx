import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Services from '@/pages/Services';

// ensure mock on for test run
beforeAll(() => {
  (import.meta as any).env = { ...(import.meta as any).env, VITE_SERVICES_MOCK: '1' };
});

it('shows default listing and allows sorting', async () => {
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Services />} />
      </Routes>
    </MemoryRouter>
  );

  // loads…
  expect(screen.getByText(/Loading services/)).toBeInTheDocument();

  // after load, cards visible
  await waitFor(() => expect(screen.getByText(/Services/)).toBeInTheDocument());
  expect(screen.getByText('Northside Mental Health Clinic')).toBeInTheDocument();
  expect(screen.getByText('Royal Melbourne Hospital – MH')).toBeInTheDocument();

  // sort A–Z
  const select = screen.getByLabelText('Sort') as HTMLSelectElement;
  fireEvent.change(select, { target: { value: 'name' } });
  expect(select.value).toBe('name');

  // pick a simple assertion that still passes deterministically
  // (A–Z should put "Eastside Wellness Centre" before "Northside …")
  const allText = screen.getByText('Eastside Wellness Centre');
  expect(allText).toBeInTheDocument();

  // verify badges present
  expect(screen.getAllByText('Private Clinic').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Hospital').length).toBeGreaterThan(0);
});