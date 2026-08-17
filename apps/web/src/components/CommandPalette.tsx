import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShieldQuestion } from 'lucide-react';
import type { SearchResult } from '@bid/core';
import { usePlatform } from '../platform/PlatformProvider';
import { Badge, Modal, cx } from './ui';
import { humanize } from '../lib/format';

const ACCESS_TONE = {
  OWN_WORKSPACE: 'brand',
  RELATIONSHIP: 'info',
  PUBLIC: 'pending',
  PLATFORM_ADMIN: 'attention',
} as const;

/**
 * Global search (⌘K). Results come from the permission-aware search service —
 * the palette itself performs no filtering, so it cannot leak by accident.
 */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { platform, access } = usePlatform();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const results = useMemo<SearchResult[]>(
    () => (query.trim().length >= 2 ? platform.search.search(query, access) : []),
    [platform, query, access],
  );

  return (
    <Modal open={open} onClose={onClose} title="Search" description="Scoped to what this workspace is permitted to see." width="max-w-2xl">
      <div className="flex items-center gap-2 rounded border border-slate-300 px-3 py-2">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Organization, BID ID, verification, campaign, policy…"
          className="w-full text-sm outline-none"
        />
      </div>

      <div className="mt-3 space-y-1">
        {query.trim().length < 2 && (
          <p className="px-1 py-6 text-center text-sm text-slate-500">
            Type at least two characters. Try <span className="font-mono">BID-BUS-00231</span> or “XYZ”.
          </p>
        )}
        {query.trim().length >= 2 && results.length === 0 && (
          <div className="flex flex-col items-center gap-1 px-1 py-6 text-center">
            <ShieldQuestion className="h-5 w-5 text-slate-400" />
            <p className="text-sm text-slate-500">No results you are permitted to see.</p>
          </div>
        )}
        {results.map((result) => (
          <button
            key={`${result.kind}-${result.id}`}
            onClick={() => {
              navigate(result.href);
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded px-2 py-2 text-left hover:bg-slate-50"
          >
            <Badge tone="neutral">{humanize(result.kind)}</Badge>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-navy-900">{result.title}</span>
              <span className="block truncate text-xs text-slate-500">{result.subtitle}</span>
            </span>
            <Badge tone={ACCESS_TONE[result.access] as never} className={cx('shrink-0')}>
              {humanize(result.access)}
            </Badge>
          </button>
        ))}
      </div>
    </Modal>
  );
}
