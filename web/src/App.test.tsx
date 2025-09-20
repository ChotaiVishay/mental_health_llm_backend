import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

it('renders core navigation links', () => {
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );

  ['Home', 'Chat', 'Services', 'Help & Crisis', 'Admin'].forEach((t) => {
    expect(screen.getByText(t)).toBeInTheDocument();
  });
});