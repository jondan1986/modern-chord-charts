
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppStore } from './store';
import { songStorage } from '@/src/services/storage';

// Mock the storage service
vi.mock('@/src/services/storage', () => ({
    songStorage: {
        getSong: vi.fn(),
        saveSong: vi.fn(),
    }
}));

describe('AppStore Setlist Logic', () => {
    beforeEach(() => {
        useAppStore.getState().resetSong();
    });

    it('starts a setlist', async () => {
        const song1 = { id: 's1', yaml: 'title: Song 1', title: 'Song 1', artist: 'A', updatedAt: 0 };
        const song2 = { id: 's2', yaml: 'title: Song 2', title: 'Song 2', artist: 'A', updatedAt: 0 };

        vi.mocked(songStorage.getSong).mockResolvedValueOnce(song1);

        await useAppStore.getState().startSetlist('setlist1', ['s1', 's2']);

        expect(useAppStore.getState().activeSetlistId).toBe('setlist1');
        expect(useAppStore.getState().currentSetlistIndex).toBe(0);
        expect(useAppStore.getState().activeSongId).toBe('s1');
    });

    it('navigates next and previous', async () => {
        const song1 = { id: 's1', yaml: 'title: Song 1', title: 'Song 1', artist: 'A', updatedAt: 0 };
        const song2 = { id: 's2', yaml: 'title: Song 2', title: 'Song 2', artist: 'A', updatedAt: 0 };

        // Setup initial state: Started setlist
        useAppStore.setState({
            activeSetlistId: 'setlist1',
            activeSetlistSongs: ['s1', 's2'],
            currentSetlistIndex: 0
        });

        // Mock next song load
        vi.mocked(songStorage.getSong).mockResolvedValueOnce(song2);

        // Next
        await useAppStore.getState().nextSetlistSong();
        expect(useAppStore.getState().currentSetlistIndex).toBe(1);
        expect(useAppStore.getState().activeSongId).toBe('s2');

        // Next again (should stay at end)
        await useAppStore.getState().nextSetlistSong();
        expect(useAppStore.getState().currentSetlistIndex).toBe(1);

        // Mock prev song load
        vi.mocked(songStorage.getSong).mockResolvedValueOnce(song1);

        // Prev
        await useAppStore.getState().prevSetlistSong();
        expect(useAppStore.getState().currentSetlistIndex).toBe(0);
        expect(useAppStore.getState().activeSongId).toBe('s1');
    });
});
