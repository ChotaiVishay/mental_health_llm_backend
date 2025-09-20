import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import Home from '@/pages/Home';

function Chat() {
  return <div>Chat</div>;
}

it('shows Start Chat and navigates', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByText('Start Chat'));
  expect(screen.getByText('Chat')).toBeInTheDocument();
});