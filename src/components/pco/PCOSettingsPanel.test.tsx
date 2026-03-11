import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PCOSettingsPanel } from './PCOSettingsPanel';

// Mock server actions
const mockSavePCOCredentials = vi.fn();
const mockTestPCOConnection = vi.fn();

vi.mock('@/src/actions/pco', () => ({
  savePCOCredentials: (...args: any[]) => mockSavePCOCredentials(...args),
  testPCOConnection: (...args: any[]) => mockTestPCOConnection(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function fillCredentials() {
  fireEvent.change(screen.getByPlaceholderText('Enter Application ID'), {
    target: { value: 'my-app-id' },
  });
  fireEvent.change(screen.getByPlaceholderText('Enter Secret'), {
    target: { value: 'my-secret' },
  });
}

describe('PCOSettingsPanel', () => {
  it('renders input fields and buttons', () => {
    render(<PCOSettingsPanel />);
    expect(screen.getByPlaceholderText('Enter Application ID')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter Secret')).toBeDefined();
    expect(screen.getByText('Test Connection')).toBeDefined();
    expect(screen.getByText('Save')).toBeDefined();
  });

  it('renders link to PCO developer page', () => {
    render(<PCOSettingsPanel />);
    const link = screen.getByText('PCO Developer');
    expect(link.getAttribute('href')).toBe('https://api.planningcenteronline.com/oauth/applications');
    expect(link.getAttribute('target')).toBe('_blank');
  });

  it('shows testing status while connection test is in progress', async () => {
    // Never resolve to keep the testing state visible
    mockSavePCOCredentials.mockReturnValue(new Promise(() => {}));

    render(<PCOSettingsPanel />);
    fillCredentials();
    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(screen.getByText('Testing connection...')).toBeDefined();
    });
  });

  it('saves credentials and shows connected status on successful test', async () => {
    mockSavePCOCredentials.mockResolvedValue(undefined);
    mockTestPCOConnection.mockResolvedValue({ ok: true, songCount: 349 });

    render(<PCOSettingsPanel />);
    fillCredentials();
    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(screen.getByText('Connected (349 songs)')).toBeDefined();
    });
    expect(mockSavePCOCredentials).toHaveBeenCalledWith('my-app-id', 'my-secret');
    expect(mockTestPCOConnection).toHaveBeenCalled();
  });

  it('shows error message on failed connection test', async () => {
    mockSavePCOCredentials.mockResolvedValue(undefined);
    mockTestPCOConnection.mockResolvedValue({ ok: false, error: 'Invalid credentials' });

    render(<PCOSettingsPanel />);
    fillCredentials();
    fireEvent.click(screen.getByText('Test Connection'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined();
    });
  });

  it('calls onConnected when Save succeeds', async () => {
    mockSavePCOCredentials.mockResolvedValue(undefined);
    mockTestPCOConnection.mockResolvedValue({ ok: true, songCount: 100 });

    const onConnected = vi.fn();
    render(<PCOSettingsPanel onConnected={onConnected} />);
    fillCredentials();
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onConnected).toHaveBeenCalled();
    });
    expect(screen.getByText('Connected (100 songs)')).toBeDefined();
  });

  it('does not call onConnected when Save fails', async () => {
    mockSavePCOCredentials.mockResolvedValue(undefined);
    mockTestPCOConnection.mockResolvedValue({ ok: false, error: 'Auth failed' });

    const onConnected = vi.fn();
    render(<PCOSettingsPanel onConnected={onConnected} />);
    fillCredentials();
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Auth failed')).toBeDefined();
    });
    expect(onConnected).not.toHaveBeenCalled();
  });

  it('disables buttons when fields are empty', () => {
    render(<PCOSettingsPanel />);
    expect(screen.getByText('Test Connection').hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Save').hasAttribute('disabled')).toBe(true);
  });

  it('enables buttons when both fields are filled', () => {
    render(<PCOSettingsPanel />);
    fillCredentials();
    expect(screen.getByText('Test Connection').hasAttribute('disabled')).toBe(false);
    expect(screen.getByText('Save').hasAttribute('disabled')).toBe(false);
  });
});
