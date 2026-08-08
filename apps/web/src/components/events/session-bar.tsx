'use client';

import { useState } from 'react';
import {
  readSessionSnapshot,
  type SessionValues,
  writeSessionSnapshot,
} from '../../lib/session-storage';

type SessionBarProps = {
  value: SessionValues;
  onChange: (next: SessionValues) => void;
};

export function readStoredSession(): SessionValues {
  const snapshot = readSessionSnapshot();

  return {
    baseUrl: snapshot.baseUrl,
    token: snapshot.token,
    organizationId: snapshot.organizationId,
  };
}

export function SessionBar({ value, onChange }: SessionBarProps) {
  const [draft, setDraft] = useState(value);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onChange(draft);
    const existing = readSessionSnapshot();
    writeSessionSnapshot({
      ...existing,
      baseUrl: draft.baseUrl,
      token: draft.token,
      organizationId: draft.organizationId,
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">Session</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Set your API URL, bearer token and organization id.
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="text-xs text-zinc-700">
          API Base URL
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={draft.baseUrl}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, baseUrl: event.target.value }))
            }
            placeholder="http://localhost:3001"
          />
        </label>

        <label className="text-xs text-zinc-700">
          Bearer Token
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={draft.token}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, token: event.target.value }))
            }
            placeholder="eyJhbGciOi..."
          />
        </label>

        <label className="text-xs text-zinc-700">
          Organization ID
          <input
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={draft.organizationId}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                organizationId: event.target.value,
              }))
            }
            placeholder="organization uuid"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          type="button"
          onClick={handleSave}
        >
          Save Session
        </button>
        {saved ? <p className="text-xs text-emerald-600">Saved</p> : null}
      </div>
    </div>
  );
}
