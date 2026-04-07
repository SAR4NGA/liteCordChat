import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Mock Socket Store
vi.mock('../store/useSocketStore', () => ({
  useSocketStore: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    room: null,
    lastError: null,
    pendingKnocks: [],
    knockStatus: 'idle',
  })),
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(screen.getByText(/Lite/i)).toBeInTheDocument();
    expect(screen.getByText(/Cord/i)).toBeInTheDocument();
    expect(screen.getByText(/Chat/i)).toBeInTheDocument();
    expect(screen.getByText(/Create New Room/i)).toBeInTheDocument();
  });
});
