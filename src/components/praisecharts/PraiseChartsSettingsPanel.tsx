// Modern Chord Charts
// Copyright (c) 2026 jondan1986
// Licensed under AGPL-3.0-only. See LICENSE for details.

"use client";

import React, { useState } from 'react';
import {
    savePraiseChartsCredentials,
    testPraiseChartsConnection,
} from '@/src/actions/praisecharts';

interface PraiseChartsSettingsPanelProps {
    onConnected?: () => void;
}

export function PraiseChartsSettingsPanel({ onConnected }: PraiseChartsSettingsPanelProps) {
    const [consumerKey, setConsumerKey] = useState('');
    const [consumerSecret, setConsumerSecret] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [accessTokenSecret, setAccessTokenSecret] = useState('');
    const [status, setStatus] = useState<'idle' | 'testing' | 'saving' | 'connected' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const allFilled = consumerKey && consumerSecret && accessToken && accessTokenSecret;

    const handleTest = async () => {
        if (!allFilled) {
            setStatus('error');
            setErrorMsg('All four credential fields are required.');
            return;
        }
        setStatus('testing');
        setErrorMsg('');

        await savePraiseChartsCredentials(consumerKey, consumerSecret, accessToken, accessTokenSecret);
        const result = await testPraiseChartsConnection();

        if (result.ok) {
            setStatus('connected');
        } else {
            setStatus('error');
            setErrorMsg(result.error ?? 'Connection failed');
        }
    };

    const handleSave = async () => {
        if (!allFilled) return;
        setStatus('saving');
        await savePraiseChartsCredentials(consumerKey, consumerSecret, accessToken, accessTokenSecret);

        const result = await testPraiseChartsConnection();
        if (result.ok) {
            setStatus('connected');
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
                Contact{' '}
                <a
                    href="mailto:developers@praisecharts.com"
                    className="text-blue-500 hover:underline"
                >
                    developers@praisecharts.com
                </a>
                {' '}to request API access. See the{' '}
                <a
                    href="https://developer.praisecharts.com/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                >
                    PraiseCharts Developer Portal
                </a>
                {' '}for documentation.
            </p>

            <div>
                <label className={labelClass}>Consumer Key</label>
                <input
                    type="password"
                    className={inputClass}
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    placeholder="OAuth Consumer Key"
                />
            </div>

            <div>
                <label className={labelClass}>Consumer Secret</label>
                <input
                    type="password"
                    className={inputClass}
                    value={consumerSecret}
                    onChange={(e) => setConsumerSecret(e.target.value)}
                    placeholder="OAuth Consumer Secret"
                />
            </div>

            <div>
                <label className={labelClass}>Access Token</label>
                <input
                    type="password"
                    className={inputClass}
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="OAuth Access Token"
                />
            </div>

            <div>
                <label className={labelClass}>Access Token Secret</label>
                <input
                    type="password"
                    className={inputClass}
                    value={accessTokenSecret}
                    onChange={(e) => setAccessTokenSecret(e.target.value)}
                    placeholder="OAuth Access Token Secret"
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
                    <span className="text-green-600 dark:text-green-400">Connected successfully</span>
                )}
                {status === 'error' && (
                    <span className="text-red-600 dark:text-red-400">{errorMsg}</span>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
                <button
                    onClick={handleTest}
                    disabled={!allFilled || status === 'testing'}
                    className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
                >
                    Test Connection
                </button>
                <button
                    onClick={handleSave}
                    disabled={!allFilled || status === 'saving'}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                >
                    Save
                </button>
            </div>
        </div>
    );
}
