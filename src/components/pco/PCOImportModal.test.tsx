import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PCOImportModal } from './PCOImportModal';
import type { ImportResult } from '@/src/services/pco/types';

// Mock server actions
const mockFetchServiceTypes = vi.fn();
const mockFetchPlans = vi.fn();
const mockFetchPlanItems = vi.fn();
const mockImportPlan = vi.fn();

vi.mock('@/src/actions/pco', () => ({
  fetchServiceTypes: (...args: any[]) => mockFetchServiceTypes(...args),
  fetchPlans: (...args: any[]) => mockFetchPlans(...args),
  fetchPlanItems: (...args: any[]) => mockFetchPlanItems(...args),
  importPlan: (...args: any[]) => mockImportPlan(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const serviceTypes = [
  { id: '1', name: 'Sunday Morning', frequency: 'Weekly' },
  { id: '2', name: 'Wednesday Night', frequency: 'Weekly' },
];

const plans = [
  { id: '100', title: null, dates: 'March 15, 2026', short_dates: 'Mar 15', sort_date: '2026-03-15', items_count: 5, series_title: null },
  { id: '101', title: 'Easter Service', dates: 'March 22, 2026', short_dates: 'Mar 22', sort_date: '2026-03-22', items_count: 8, series_title: null },
];

const planItems = [
  { id: '1001', item_type: 'song' as const, title: 'Amazing Grace', key_name: 'G', sequence: 1 },
  { id: '1002', item_type: 'song' as const, title: 'Be Thou My Vision', key_name: 'E', sequence: 2 },
  { id: '1003', item_type: 'song' as const, title: 'How Great Thou Art', key_name: 'D', sequence: 3 },
];

const importResult: ImportResult = {
  songs: [
    { title: 'Amazing Grace', localId: 'ag.mcs', status: 'imported' },
    { title: 'Be Thou My Vision', localId: 'btmv.mcs', status: 'lyrics_only' },
    { title: 'How Great Thou Art', localId: 'hgta.mcs', status: 'imported' },
  ],
  setlistId: 'pco-100',
};

describe('PCOImportModal', () => {
  it('does not render when closed', () => {
    mockFetchServiceTypes.mockResolvedValue([]);
    render(<PCOImportModal isOpen={false} onClose={vi.fn()} onImported={vi.fn()} />);
    expect(screen.queryByText('Import from Planning Center')).toBeNull();
  });

  it('renders step 1 with service types when opened', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning')).toBeDefined();
      expect(screen.getByText('Wednesday Night')).toBeDefined();
    });
    expect(screen.getByText('Select a service type:')).toBeDefined();
    expect(screen.getByText('Next')).toBeDefined();
  });

  it('disables Next button until a service type is selected', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning')).toBeDefined();
    });

    expect(screen.getByText('Next').hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByText('Sunday Morning'));
    expect(screen.getByText('Next').hasAttribute('disabled')).toBe(false);
  });

  it('navigates to step 2 showing plans after selecting service type', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('March 15, 2026')).toBeDefined();
      expect(screen.getByText('Easter Service')).toBeDefined();
    });

    expect(screen.getByText('Back')).toBeDefined();
    expect(mockFetchPlans).toHaveBeenCalledWith('1', 'future');
  });

  it('navigates back from plan step to service type step', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Sunday Morning')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('March 15, 2026')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Back'));

    await waitFor(() => {
      expect(screen.getByText('Select a service type:')).toBeDefined();
    });
  });

  it('navigates to step 3 showing song items for review', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);
    mockFetchPlanItems.mockResolvedValue(planItems);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    // Step 1: select service type
    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));

    // Step 2: select plan
    await waitFor(() => expect(screen.getByText('March 15, 2026')).toBeDefined());
    fireEvent.click(screen.getByText('March 15, 2026'));
    fireEvent.click(screen.getByText('Next'));

    // Step 3: review songs
    await waitFor(() => {
      expect(screen.getByText('Amazing Grace')).toBeDefined();
      expect(screen.getByText('Be Thou My Vision')).toBeDefined();
      expect(screen.getByText('How Great Thou Art')).toBeDefined();
    });

    // All checkboxes should be checked by default
    const checkboxes = screen.getAllByRole('checkbox');
    // 3 song checkboxes + 1 "create setlist" checkbox
    expect(checkboxes).toHaveLength(4);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[2] as HTMLInputElement).checked).toBe(true);

    expect(screen.getByText('Import')).toBeDefined();
  });

  it('shows key names for songs', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);
    mockFetchPlanItems.mockResolvedValue(planItems);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => expect(screen.getByText('March 15, 2026')).toBeDefined());
    fireEvent.click(screen.getByText('March 15, 2026'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('key: G')).toBeDefined();
      expect(screen.getByText('key: E')).toBeDefined();
      expect(screen.getByText('key: D')).toBeDefined();
    });
  });

  it('can toggle song checkboxes', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);
    mockFetchPlanItems.mockResolvedValue(planItems);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('March 15, 2026')).toBeDefined());
    fireEvent.click(screen.getByText('March 15, 2026'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => expect(screen.getByText('Amazing Grace')).toBeDefined());

    const checkboxes = screen.getAllByRole('checkbox');
    // Uncheck first song
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);

    // Re-check it
    fireEvent.click(checkboxes[0]);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
  });

  it('shows results after import completes', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);
    mockFetchPlanItems.mockResolvedValue(planItems);
    mockImportPlan.mockResolvedValue(importResult);

    const onImported = vi.fn();
    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={onImported} />);

    // Navigate to step 3
    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('March 15, 2026')).toBeDefined());
    fireEvent.click(screen.getByText('March 15, 2026'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Amazing Grace')).toBeDefined());

    // Click Import
    fireEvent.click(screen.getByText('Import'));

    // Results step
    await waitFor(() => {
      expect(screen.getByText('Import from Planning Center')).toBeDefined();
    });
    expect(screen.getByText('Amazing Grace')).toBeDefined();
    expect(screen.getByText('Be Thou My Vision')).toBeDefined();
    expect(screen.getAllByText('imported')).toHaveLength(2);
    expect(screen.getByText('lyrics only')).toBeDefined();
    expect(screen.getByText('Setlist created.')).toBeDefined();
    expect(screen.getByText('Done')).toBeDefined();

    expect(onImported).toHaveBeenCalled();
  });

  it('shows Open Setlist button when setlist was created', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);
    mockFetchPlanItems.mockResolvedValue(planItems);
    mockImportPlan.mockResolvedValue(importResult);

    const onOpenSetlist = vi.fn();
    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} onOpenSetlist={onOpenSetlist} />);

    // Navigate to results
    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('March 15, 2026')).toBeDefined());
    fireEvent.click(screen.getByText('March 15, 2026'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Amazing Grace')).toBeDefined());
    fireEvent.click(screen.getByText('Import'));

    await waitFor(() => expect(screen.getByText('Open Setlist')).toBeDefined());

    fireEvent.click(screen.getByText('Open Setlist'));
    expect(onOpenSetlist).toHaveBeenCalledWith('pco-100');
  });

  it('calls onClose when Done is clicked on results', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);
    mockFetchPlanItems.mockResolvedValue(planItems);
    mockImportPlan.mockResolvedValue({ songs: importResult.songs });

    const onClose = vi.fn();
    render(<PCOImportModal isOpen={true} onClose={onClose} onImported={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('March 15, 2026')).toBeDefined());
    fireEvent.click(screen.getByText('March 15, 2026'));
    fireEvent.click(screen.getByText('Next'));
    await waitFor(() => expect(screen.getByText('Amazing Grace')).toBeDefined());
    fireEvent.click(screen.getByText('Import'));

    await waitFor(() => expect(screen.getByText('Done')).toBeDefined());
    fireEvent.click(screen.getByText('Done'));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error when fetchServiceTypes fails', async () => {
    mockFetchServiceTypes.mockRejectedValue(new Error('Network error'));

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });

  it('shows loading state for service types', async () => {
    // Never resolve to keep loading state
    mockFetchServiceTypes.mockReturnValue(new Promise(() => {}));

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    expect(screen.getByText('Loading service types...')).toBeDefined();
  });

  it('shows "no plans found" when plan list is empty', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue([]);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('No future plans found.')).toBeDefined();
    });
  });

  it('shows Upcoming and Past filter buttons on plan step', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans.mockResolvedValue(plans);

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Upcoming')).toBeDefined();
      expect(screen.getByText('Past')).toBeDefined();
    });
  });

  it('switches plan filter and reloads plans', async () => {
    mockFetchServiceTypes.mockResolvedValue(serviceTypes);
    mockFetchPlans
      .mockResolvedValueOnce(plans) // future
      .mockResolvedValueOnce([]);    // past

    render(<PCOImportModal isOpen={true} onClose={vi.fn()} onImported={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Sunday Morning')).toBeDefined());
    fireEvent.click(screen.getByText('Sunday Morning'));
    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => expect(screen.getByText('March 15, 2026')).toBeDefined());

    fireEvent.click(screen.getByText('Past'));

    await waitFor(() => {
      expect(screen.getByText('No past plans found.')).toBeDefined();
    });
    expect(mockFetchPlans).toHaveBeenCalledWith('1', 'past');
  });
});
