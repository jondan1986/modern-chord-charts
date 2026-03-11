"use client";

import React, { useState } from 'react';
import {
  savePCOCredentials,
  testPCOConnection,
} from '@/src/actions/pco';

interface PCOSettingsPanelProps {
  onConnected?: () => void;
}

export function PCOSettingsPanel({ onConnected }: PCOSettingsPanelProps) {
  const [appId, setAppId] = useState('');
  const [secret, setSecret] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'saving' | 'connected' | 'error'>('idle');
  const [songCount, setSongCount] = useState<number | undefined>();
  const [errorMsg, setErrorMsg] = useState('');

  const handleTest = async () => {
    if (!appId || !secret) {
      setStatus('error');
      setErrorMsg('Both Application ID and Secret are required.');
      return;
    }
    setStatus('testing');
    setErrorMsg('');

    // Save first so the server action can use them
    await savePCOCredentials(appId, secret);
    const result = await testPCOConnection();

    if (result.ok) {
      setStatus('connected');
      setSongCount(result.songCount);
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Connection failed');
    }
  };

  const handleSave = async () => {
    if (!appId || !secret) return;
    setStatus('saving');
    await savePCOCredentials(appId, secret);

    const result = await testPCOConnection();
    if (result.ok) {
      setStatus('connected');
      setSongCount(result.songCount);
      onConnected?.();
    } else {
      setStatus('error');
      setErrorMsg(result.error ?? 'Connection failed');
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Create a Personal Access Token at{' '}
        <a
          href="https://api.planningcenteronline.com/oauth/applications"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          PCO Developer
        </a>
        {' '}to connect.
      </p>

      <div>
        <label className={labelClass}>Application ID</label>
        <input
          type="password"
          className={inputClass}
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="Enter Application ID"
        />
      </div>

      <div>
        <label className={labelClass}>Secret</label>
        <input
          type="password"
          className={inputClass}
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter Secret"
        />
      </div>

      {/* Status */}
      <div className="text-sm">
        {status === 'testing' && (
          <span className="text-yellow-600 dark:text-yellow-400">Testing connection...</span>
        )}
        {status === 'saving' && (
          <span className="text-yellow-600 dark:text-yellow-400">Saving...</span>
        )}
        {status === 'connected' && (
          <span className="text-green-600 dark:text-green-400">
            Connected{songCount !== undefined ? ` (${songCount} songs)` : ''}
          </span>
        )}
        {status === 'error' && (
          <span className="text-red-600 dark:text-red-400">{errorMsg}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={handleTest}
          disabled={!appId || !secret || status === 'testing'}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
        >
          Test Connection
        </button>
        <button
          onClick={handleSave}
          disabled={!appId || !secret || status === 'saving'}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
}
