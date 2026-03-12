"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/src/components/ui/Modal';
import { ChordEnhanceModal } from '@/src/components/pco/ChordEnhanceModal';
import {
  fetchServiceTypes,
  fetchPlans,
  fetchPlanItems,
  importPlan,
} from '@/src/actions/pco';
import type {
  PCOServiceType,
  PCOPlan,
  PCOItem,
  ImportResult,
} from '@/src/services/pco/types';

type ImportStep = 'service_type' | 'plan' | 'review' | 'importing' | 'results';

interface PCOImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  onOpenSetlist?: (id: string) => void;
}

export function PCOImportContent({ isOpen, onClose, onImported, onOpenSetlist }: PCOImportModalProps) {
  const [step, setStep] = useState<ImportStep>('service_type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [serviceTypes, setServiceTypes] = useState<PCOServiceType[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<string | null>(null);

  // Step 2
  const [plans, setPlans] = useState<PCOPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<'future' | 'past'>('future');

  // Step 3
  const [items, setItems] = useState<PCOItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [createSetlist, setCreateSetlist] = useState(true);

  // Step 5
  const [results, setResults] = useState<ImportResult | null>(null);
  const [showEnhance, setShowEnhance] = useState(false);

  const reset = useCallback(() => {
    setStep('service_type');
    setLoading(false);
    setError('');
    setServiceTypes([]);
    setSelectedServiceType(null);
    setPlans([]);
    setSelectedPlan(null);
    setPlanFilter('future');
    setItems([]);
    setSelectedItems(new Set());
    setCreateSetlist(true);
    setResults(null);
    setShowEnhance(false);
  }, []);

  const loadServiceTypes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const types = await fetchServiceTypes();
      setServiceTypes(types);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load service types');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      reset();
      loadServiceTypes();
    }
  }, [isOpen, reset, loadServiceTypes]);

  const loadPlans = async (serviceTypeId: string, filter: 'future' | 'past') => {
    setLoading(true);
    setError('');
    try {
      const p = await fetchPlans(serviceTypeId, filter);
      setPlans(p);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load plans');
    }
    setLoading(false);
  };

  const loadPlanItems = async (serviceTypeId: string, planId: string) => {
    setLoading(true);
    setError('');
    try {
      const allItems = await fetchPlanItems(serviceTypeId, planId);
      const songItems = allItems.filter(i => i.item_type === 'song');
      setItems(songItems);
      setSelectedItems(new Set(songItems.map(i => i.id)));
    } catch (err: any) {
      setError(err.message ?? 'Failed to load plan items');
    }
    setLoading(false);
  };

  const handleNext = async () => {
    if (step === 'service_type' && selectedServiceType) {
      await loadPlans(selectedServiceType, planFilter);
      setStep('plan');
    } else if (step === 'plan' && selectedPlan) {
      await loadPlanItems(selectedServiceType!, selectedPlan);
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'plan') {
      setStep('service_type');
      setSelectedPlan(null);
    } else if (step === 'review') {
      setStep('plan');
    }
  };

  const handleFilterChange = async (filter: 'future' | 'past') => {
    setPlanFilter(filter);
    setSelectedPlan(null);
    if (selectedServiceType) {
      await loadPlans(selectedServiceType, filter);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (!selectedServiceType || !selectedPlan) return;
    setStep('importing');
    setError('');

    try {
      const plan = plans.find(p => p.id === selectedPlan);
      const planName = plan?.title ?? plan?.dates ?? `PCO Plan`;
      const result = await importPlan(selectedServiceType, selectedPlan, createSetlist, planName);
      setResults(result);
      setStep('results');
      onImported();
    } catch (err: any) {
      setError(err.message ?? 'Import failed');
      setStep('review');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const selectedPlanData = plans.find(p => p.id === selectedPlan);

  const radioClass = (selected: boolean) =>
    `w-full text-left px-3 py-2 rounded-md border text-sm transition ${
      selected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      {/* Step 1: Service Type */}
      {step === 'service_type' && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a service type:</p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading service types...</p>
          ) : (
            <div className="space-y-1">
              {serviceTypes.map(st => (
                <button
                  key={st.id}
                  onClick={() => setSelectedServiceType(st.id)}
                  className={radioClass(selectedServiceType === st.id)}
                >
                  {st.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNext}
              disabled={!selectedServiceType || loading}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Step 2: Plan */}
      {step === 'plan' && (
        <>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => handleFilterChange('future')}
              className={`px-3 py-1 text-xs rounded-full transition ${
                planFilter === 'future'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => handleFilterChange('past')}
              className={`px-3 py-1 text-xs rounded-full transition ${
                planFilter === 'past'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              Past
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-gray-400">Loading plans...</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-gray-400">No {planFilter} plans found.</p>
          ) : (
            <div className="space-y-1">
              {plans.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={radioClass(selectedPlan === p.id)}
                >
                  <span className="font-medium">{p.title ?? p.dates}</span>
                  <span className="text-gray-400 ml-2">({p.items_count} items)</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-between pt-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedPlan || loading}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Songs to import{selectedPlanData ? ` (${selectedPlanData.title ?? selectedPlanData.dates})` : ''}:
          </p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading songs...</p>
          ) : (
            <div className="space-y-1">
              {items.map(item => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={() => toggleItem(item.id)}
                    className="rounded border-gray-300"
                  />
                  <span>{item.title}</span>
                  {item.key_name && (
                    <span className="text-gray-400 ml-auto">key: {item.key_name}</span>
                  )}
                </label>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 pt-1">
            <input
              type="checkbox"
              checked={createSetlist}
              onChange={(e) => setCreateSetlist(e.target.checked)}
              className="rounded border-gray-300"
            />
            Create setlist &ldquo;{selectedPlanData?.title ?? selectedPlanData?.dates ?? 'Plan'}&rdquo;
          </label>
          <div className="flex justify-between pt-2">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={selectedItems.size === 0}
              className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Import
            </button>
          </div>
        </>
      )}

      {/* Step 4: Importing */}
      {step === 'importing' && (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Importing songs...</p>
        </div>
      )}

      {/* Step 5: Results */}
      {step === 'results' && results && (
        <>
          <div className="space-y-1">
            {results.songs.map((song, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-sm"
              >
                {song.status === 'imported' && (
                  <span className="text-green-500" title="Imported">&#10003;</span>
                )}
                {song.status === 'lyrics_only' && (
                  <span className="text-yellow-500" title="Lyrics only (no chords)">&#9888;</span>
                )}
                {song.status === 'empty' && (
                  <span className="text-yellow-500" title="Metadata only (no content)">&#9888;</span>
                )}
                {song.status === 'error' && (
                  <span className="text-red-500" title={song.error}>&#10007;</span>
                )}
                <span>{song.title}</span>
                <span className="text-gray-400 ml-auto text-xs">
                  {song.status === 'lyrics_only' ? 'lyrics only' : song.status === 'empty' ? 'no content' : song.status}
                </span>
              </div>
            ))}
          </div>
          {results.setlistId && (
            <p className="text-sm text-green-600 dark:text-green-400 pt-1">
              Setlist created.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            {results.songs.some(s => s.status === 'lyrics_only' || s.status === 'empty') && (
              <button
                onClick={() => setShowEnhance(true)}
                className="px-4 py-2 text-sm font-medium rounded-md border border-yellow-400 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition"
              >
                Enhance with Chords
              </button>
            )}
            {results.setlistId && onOpenSetlist && (
              <button
                onClick={() => {
                  handleClose();
                  onOpenSetlist(results.setlistId!);
                }}
                className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Open Setlist
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Done
            </button>
          </div>

          {/* Chord Enhancement Modal */}
          <ChordEnhanceModal
            isOpen={showEnhance}
            onClose={() => setShowEnhance(false)}
            songs={results.songs.filter(s => s.status === 'lyrics_only' || s.status === 'empty')}
            onEnhanced={onImported}
          />
        </>
      )}
    </div>
  );
}

export function PCOImportModal({ isOpen, onClose, onImported, onOpenSetlist }: PCOImportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import from Planning Center">
      <PCOImportContent isOpen={isOpen} onClose={onClose} onImported={onImported} onOpenSetlist={onOpenSetlist} />
    </Modal>
  );
}
