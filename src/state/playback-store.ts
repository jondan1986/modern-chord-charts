// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

'use client';

import { create } from 'zustand';
import { Song, Section } from '@/mcs-core/model';
import { ClickEngine } from '@/src/services/playback/click-engine';

export interface PlaybackPosition {
  state: 'stopped' | 'playing' | 'paused';
  sectionIndex: number;
  beat: number;
  timestamp: number;
}

interface PlaybackState {
  mode: 'idle' | 'master' | 'player';
  roomCode: string | null;
  hostId: string | null;

  // Setlist context
  setlistId: string | null;
  setlistSongIds: string[];
  setlistSongs: Song[];
  currentSongIndex: number;

  // Current song
  playbackSong: Song | null;
  arrangementIndex: number;
  resolvedSections: Section[];

  // Position
  playbackState: 'stopped' | 'playing' | 'paused';
  currentSectionIndex: number;
  currentBeat: number;
  totalBeatsInSection: number;
  currentMeasure: number;

  // Transpose
  transposeByIndex: number[];
  currentTransposeSteps: number;

  // Engine settings
  tempo: number;
  beatsPerMeasure: number;
  clickEnabled: boolean;
  announceSections: boolean;

  // Player count (master only)
  playerCount: number;

  // SSE connection (player)
  eventSource: EventSource | null;

  // Actions
  initMaster: (setlistId: string, setlistTitle: string, setlistSongIds: string[], songs: Song[], sessionName: string, password: string) => Promise<void>;
  joinSession: (roomCode: string, password?: string) => Promise<boolean>;
  leaveSession: () => void;

  play: () => void;
  pause: () => void;
  stop: () => void;

  jumpToSection: (index: number) => void;
  jumpToSong: (index: number) => void;

  setTempo: (tempo: number) => void;
  toggleClick: () => void;
  toggleAnnounce: () => void;

  transposeCurrentSong: (steps: number) => void;

  // Player-side handlers
  updatePosition: (pos: PlaybackPosition) => void;
  handleSongChange: (data: { songIndex: number; song: Song; arrangementIndex: number; transposeSteps: number }) => void;
  handleKeyChange: (data: { songIndex: number; transposeSteps: number }) => void;

  // Internal
  _resolveSections: (song: Song, arrangementIdx: number) => Section[];
  _getBarsForSection: (section: Section) => number;
  _engine: ClickEngine | null;
  _setEngine: (engine: ClickEngine | null) => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  mode: 'idle',
  roomCode: null,
  hostId: null,
  setlistId: null,
  setlistSongIds: [],
  setlistSongs: [],
  currentSongIndex: 0,
  playbackSong: null,
  arrangementIndex: 0,
  resolvedSections: [],
  playbackState: 'stopped',
  currentSectionIndex: 0,
  currentBeat: 0,
  totalBeatsInSection: 0,
  currentMeasure: 0,
  transposeByIndex: [],
  currentTransposeSteps: 0,
  tempo: 120,
  beatsPerMeasure: 4,
  clickEnabled: true,
  announceSections: false,
  playerCount: 0,
  eventSource: null,
  _engine: null,

  _setEngine: (engine) => set({ _engine: engine }),

  _resolveSections: (song, arrangementIdx) => {
    if (song.arrangements && song.arrangements[arrangementIdx]) {
      const arrangement = song.arrangements[arrangementIdx];
      return arrangement.order
        .map(id => song.sections.find(s => s.id === id))
        .filter(Boolean) as Section[];
    }
    return song.sections;
  },

  _getBarsForSection: (section) => {
    if (section.bars) return section.bars;
    // Default: 4 bars per line
    const lineCount = section.lines.filter(l => typeof l !== 'string' || l.trim().length > 0).length;
    return Math.max(lineCount * 4, 4);
  },

  initMaster: async (setlistId, setlistTitle, setlistSongIds, songs, sessionName, password) => {
    const hostId = crypto.randomUUID();
    const firstSong = songs[0];
    const sections = get()._resolveSections(firstSong, 0);
    const tempo = firstSong.metadata.tempo || 120;
    const timeSig = firstSong.metadata.time_signature || '4/4';
    const beatsPerMeasure = parseInt(timeSig.split('/')[0]) || 4;
    const transposeByIndex = songs.map(() => 0);

    // Create session on server
    const res = await fetch('/api/playback/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: sessionName,
        password: password || null,
        hostId,
        setlistId,
        setlistTitle,
        setlistSongIds,
        songs,
        tempo,
        beatsPerMeasure,
      }),
    });

    if (!res.ok) throw new Error('Failed to create session');
    const { roomCode } = await res.json();

    const totalBeats = get()._getBarsForSection(sections[0]) * beatsPerMeasure;

    set({
      mode: 'master',
      roomCode,
      hostId,
      setlistId,
      setlistSongIds,
      setlistSongs: songs,
      currentSongIndex: 0,
      playbackSong: firstSong,
      arrangementIndex: 0,
      resolvedSections: sections,
      playbackState: 'stopped',
      currentSectionIndex: 0,
      currentBeat: 0,
      totalBeatsInSection: totalBeats,
      currentMeasure: 0,
      transposeByIndex,
      currentTransposeSteps: 0,
      tempo,
      beatsPerMeasure,
    });

    // Poll player count
    const pollInterval = setInterval(async () => {
      const state = get();
      if (state.mode !== 'master' || !state.roomCode) {
        clearInterval(pollInterval);
        return;
      }
      try {
        const r = await fetch(`/api/playback/sessions`);
        if (r.ok) {
          const sessionsList = await r.json();
          const mySession = sessionsList.find((s: { id: string }) => s.id === state.roomCode);
          if (mySession) set({ playerCount: mySession.playerCount });
        }
      } catch { /* ignore */ }
    }, 3000);
  },

  joinSession: async (roomCode, password) => {
    const res = await fetch('/api/playback/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: roomCode, password: password || null }),
    });

    if (!res.ok) return false;
    const data = await res.json();

    const sections = get()._resolveSections(data.currentSong, data.arrangementIndex);

    set({
      mode: 'player',
      roomCode,
      setlistId: data.setlistId,
      setlistSongIds: data.setlistSongIds,
      setlistSongs: data.songs,
      currentSongIndex: data.currentSongIndex,
      playbackSong: data.currentSong,
      arrangementIndex: data.arrangementIndex,
      resolvedSections: sections,
      playbackState: data.position.state,
      currentSectionIndex: data.position.sectionIndex,
      currentBeat: data.position.beat,
      currentTransposeSteps: data.transposeSteps,
      transposeByIndex: data.transposeByIndex,
      tempo: data.currentSong.metadata.tempo || 120,
      beatsPerMeasure: parseInt((data.currentSong.metadata.time_signature || '4/4').split('/')[0]) || 4,
    });

    // Connect SSE
    const es = new EventSource(`/api/playback/stream?sessionId=${roomCode}`);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const state = get();
        if (parsed.type === 'position') {
          state.updatePosition(parsed.data);
        } else if (parsed.type === 'song_change') {
          state.handleSongChange(parsed.data);
        } else if (parsed.type === 'key_change') {
          state.handleKeyChange(parsed.data);
        }
      } catch { /* ignore parse errors */ }
    };

    set({ eventSource: es });
    return true;
  },

  leaveSession: () => {
    const { _engine, eventSource } = get();
    if (_engine) {
      _engine.destroy();
    }
    if (eventSource) {
      eventSource.close();
    }
    set({
      mode: 'idle',
      roomCode: null,
      hostId: null,
      setlistId: null,
      setlistSongIds: [],
      setlistSongs: [],
      currentSongIndex: 0,
      playbackSong: null,
      arrangementIndex: 0,
      resolvedSections: [],
      playbackState: 'stopped',
      currentSectionIndex: 0,
      currentBeat: 0,
      totalBeatsInSection: 0,
      currentMeasure: 0,
      transposeByIndex: [],
      currentTransposeSteps: 0,
      playerCount: 0,
      eventSource: null,
      _engine: null,
    });
  },

  play: () => {
    const state = get();
    if (state.mode !== 'master') return;

    const sections = state.resolvedSections;
    if (sections.length === 0) return;

    let engine = state._engine;
    if (state.playbackState === 'paused' && engine) {
      engine.resume();
      set({ playbackState: 'playing' });
      // Broadcast
      _broadcastPosition(get());
      return;
    }

    // Create new engine
    if (engine) engine.destroy();

    const section = sections[state.currentSectionIndex];
    const barsInSection = state._getBarsForSection(section);
    const totalBeats = barsInSection * state.beatsPerMeasure;
    let measureCount = 0;

    engine = new ClickEngine({
      tempo: state.tempo,
      beatsPerMeasure: state.beatsPerMeasure,
      clickEnabled: state.clickEnabled,
      onBeat: (beat, measure) => {
        const currentState = get();
        const currentSection = currentState.resolvedSections[currentState.currentSectionIndex];
        if (!currentSection) return;
        const totalB = currentState._getBarsForSection(currentSection) * currentState.beatsPerMeasure;
        const absoluteBeat = (measure - 1) * currentState.beatsPerMeasure + beat;
        set({ currentBeat: absoluteBeat, currentMeasure: measure, totalBeatsInSection: totalB });
      },
      onMeasureEnd: (measure) => {
        measureCount = measure;
        const currentState = get();
        const currentSection = currentState.resolvedSections[currentState.currentSectionIndex];
        if (!currentSection) return;
        const barsNeeded = currentState._getBarsForSection(currentSection);

        if (measureCount >= barsNeeded) {
          // Auto-advance to next section
          const nextSectionIdx = currentState.currentSectionIndex + 1;
          if (nextSectionIdx < currentState.resolvedSections.length) {
            // Announce next section if enabled
            if (currentState.announceSections) {
              _announceSection(currentState.resolvedSections[nextSectionIdx]);
            }
            const nextSection = currentState.resolvedSections[nextSectionIdx];
            const nextTotalBeats = currentState._getBarsForSection(nextSection) * currentState.beatsPerMeasure;
            measureCount = 0;
            engine!.resetPosition(0, 0);
            set({
              currentSectionIndex: nextSectionIdx,
              currentBeat: 0,
              currentMeasure: 0,
              totalBeatsInSection: nextTotalBeats,
            });
            _broadcastPosition(get());
          } else {
            // End of arrangement — auto-advance to next song or stop
            const nextSongIdx = currentState.currentSongIndex + 1;
            if (nextSongIdx < currentState.setlistSongs.length) {
              get().jumpToSong(nextSongIdx);
            } else {
              get().stop();
            }
          }
        }
      },
    });

    set({ _engine: engine, playbackState: 'playing', currentBeat: 0, currentMeasure: 0 });
    engine.start();
    _broadcastPosition(get());
  },

  pause: () => {
    const { _engine } = get();
    if (_engine) _engine.pause();
    set({ playbackState: 'paused' });
    _broadcastPosition(get());
  },

  stop: () => {
    const { _engine } = get();
    if (_engine) {
      _engine.stop();
    }
    set({
      playbackState: 'stopped',
      currentSectionIndex: 0,
      currentBeat: 0,
      currentMeasure: 0,
    });
    _broadcastPosition(get());
  },

  jumpToSection: (index) => {
    const state = get();
    if (index < 0 || index >= state.resolvedSections.length) return;

    const section = state.resolvedSections[index];
    const totalBeats = state._getBarsForSection(section) * state.beatsPerMeasure;

    if (state._engine) {
      state._engine.resetPosition(0, 0);
    }

    set({
      currentSectionIndex: index,
      currentBeat: 0,
      currentMeasure: 0,
      totalBeatsInSection: totalBeats,
    });
    _broadcastPosition(get());
  },

  jumpToSong: (index) => {
    const state = get();
    if (index < 0 || index >= state.setlistSongs.length) return;

    const song = state.setlistSongs[index];
    const sections = state._resolveSections(song, 0);
    const tempo = song.metadata.tempo || 120;
    const timeSig = song.metadata.time_signature || '4/4';
    const beatsPerMeasure = parseInt(timeSig.split('/')[0]) || 4;
    const transposeSteps = state.transposeByIndex[index] || 0;

    // Stop current playback
    if (state._engine) {
      state._engine.stop();
      state._engine.setTempo(tempo);
      state._engine.setBeatsPerMeasure(beatsPerMeasure);
      state._engine.resetPosition(0, 0);
    }

    set({
      currentSongIndex: index,
      playbackSong: song,
      arrangementIndex: 0,
      resolvedSections: sections,
      playbackState: 'stopped',
      currentSectionIndex: 0,
      currentBeat: 0,
      currentMeasure: 0,
      totalBeatsInSection: sections.length > 0 ? state._getBarsForSection(sections[0]) * beatsPerMeasure : 0,
      tempo,
      beatsPerMeasure,
      currentTransposeSteps: transposeSteps,
    });

    // Broadcast song change to players
    if (state.mode === 'master' && state.roomCode) {
      fetch('/api/playback/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.roomCode,
          type: 'song_change',
          songIndex: index,
          song,
          arrangementIndex: 0,
          transposeSteps,
        }),
      }).catch(() => { /* ignore */ });
    }
  },

  setTempo: (tempo) => {
    const { _engine } = get();
    if (_engine) _engine.setTempo(tempo);
    set({ tempo });
  },

  toggleClick: () => {
    const state = get();
    const newVal = !state.clickEnabled;
    if (state._engine) state._engine.setClickEnabled(newVal);
    set({ clickEnabled: newVal });
  },

  toggleAnnounce: () => {
    set({ announceSections: !get().announceSections });
  },

  transposeCurrentSong: (steps) => {
    const state = get();
    const newTranspose = state.currentTransposeSteps + steps;
    const newByIndex = [...state.transposeByIndex];
    newByIndex[state.currentSongIndex] = newTranspose;

    set({
      currentTransposeSteps: newTranspose,
      transposeByIndex: newByIndex,
    });

    // Broadcast to players
    if (state.mode === 'master' && state.roomCode) {
      fetch('/api/playback/transpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: state.roomCode,
          songIndex: state.currentSongIndex,
          transposeSteps: newTranspose,
        }),
      }).catch(() => { /* ignore */ });
    }
  },

  updatePosition: (pos) => {
    set({
      playbackState: pos.state,
      currentSectionIndex: pos.sectionIndex,
      currentBeat: pos.beat,
    });
  },

  handleSongChange: (data) => {
    const sections = get()._resolveSections(data.song, data.arrangementIndex);
    const tempo = data.song.metadata.tempo || 120;
    const timeSig = data.song.metadata.time_signature || '4/4';
    const beatsPerMeasure = parseInt(timeSig.split('/')[0]) || 4;

    set({
      currentSongIndex: data.songIndex,
      playbackSong: data.song,
      arrangementIndex: data.arrangementIndex,
      resolvedSections: sections,
      currentSectionIndex: 0,
      currentBeat: 0,
      currentMeasure: 0,
      currentTransposeSteps: data.transposeSteps,
      playbackState: 'stopped',
      tempo,
      beatsPerMeasure,
    });
  },

  handleKeyChange: (data) => {
    const state = get();
    const newByIndex = [...state.transposeByIndex];
    newByIndex[data.songIndex] = data.transposeSteps;
    set({
      transposeByIndex: newByIndex,
      ...(data.songIndex === state.currentSongIndex ? { currentTransposeSteps: data.transposeSteps } : {}),
    });
  },
}));

// Helper: broadcast position to server
function _broadcastPosition(state: PlaybackState) {
  if (state.mode !== 'master' || !state.roomCode) return;

  const position: PlaybackPosition = {
    state: state.playbackState,
    sectionIndex: state.currentSectionIndex,
    beat: state.currentBeat,
    timestamp: Date.now(),
  };

  fetch('/api/playback/position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: state.roomCode,
      type: 'position',
      position,
    }),
  }).catch(() => { /* ignore */ });
}

// Helper: announce section via speech synthesis
function _announceSection(section: Section) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(section.label);
  utterance.rate = 1.2;
  utterance.volume = 0.8;
  window.speechSynthesis.speak(utterance);
}
