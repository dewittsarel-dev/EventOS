'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Destination = { href: string; label: string; description: string; group: 'Go to' | 'Create' | 'Settings'; keywords: string };

const DESTINATIONS: Destination[] = [
  { href: '/', label: 'Home', description: 'Priorities, upcoming events and tasks', group: 'Go to', keywords: 'dashboard attention today' },
  { href: '/events', label: 'Events', description: 'Plan and operate every event', group: 'Go to', keywords: 'projects lifecycle planning execution' },
  { href: '/documents', label: 'Documents', description: 'Find evidence and linked records', group: 'Go to', keywords: 'files records evidence' },
  { href: '/activity', label: 'Activity', description: 'Review attention items and recent changes', group: 'Go to', keywords: 'notifications alerts updates' },
  { href: '/contacts', label: 'Contacts', description: 'Manage clients and contacts', group: 'Go to', keywords: 'customers people clients' },
  { href: '/suppliers', label: 'Suppliers', description: 'Manage supplier relationships', group: 'Go to', keywords: 'vendors partners' },
  { href: '/inventory', label: 'Resources', description: 'Availability, assets and Marketplace listings', group: 'Go to', keywords: 'inventory assets catalogue marketplace' },
  { href: '/purchase-orders', label: 'Purchase Orders', description: 'Review and manage purchasing', group: 'Go to', keywords: 'procurement orders buying' },
  { href: '/quotations', label: 'Quotations', description: 'Prepare and track customer quotations', group: 'Go to', keywords: 'quotes commercial sales' },
  { href: '/tasks', label: 'Tasks', description: 'Assigned work and deadlines', group: 'Go to', keywords: 'work actions todo' },
  { href: '/events/new', label: 'Create event', description: 'Start a new event workspace', group: 'Create', keywords: 'add new event' },
  { href: '/contacts/new', label: 'Add contact', description: 'Create a client or contact', group: 'Create', keywords: 'add new customer person' },
  { href: '/suppliers/new', label: 'Add supplier', description: 'Create a supplier record', group: 'Create', keywords: 'add new vendor' },
  { href: '/tasks/new', label: 'Create task', description: 'Assign a new piece of work', group: 'Create', keywords: 'add new action todo' },
  { href: '/settings/organization', label: 'Organization settings', description: 'Business details and workspace preferences', group: 'Settings', keywords: 'company profile logo' },
  { href: '/settings/users', label: 'Users and access', description: 'Invite and manage workspace users', group: 'Settings', keywords: 'members invitations permissions' },
  { href: '/settings/marketplace', label: 'Marketplace management', description: 'Published listings and customer enquiries', group: 'Settings', keywords: 'public catalogue inbox publish' },
];

type Props = { open: boolean; onClose: () => void; onNavigate: (href: string) => void };

export function WorkspaceSearch({ open, onClose, onNavigate }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return DESTINATIONS.slice(0, 10);
    return DESTINATIONS.filter((item) => `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(normalized)).slice(0, 10);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      setQuery('');
      inputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;
  const close = () => { setQuery(''); onClose(); };
  const choose = (href: string) => { setQuery(''); onClose(); onNavigate(href); };

  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-zinc-950/55 px-3 pt-[10vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Search ClientOS" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl">
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4"><span aria-hidden="true" className="text-zinc-400">⌕</span><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) choose(results[0].href); }} aria-label="Find a workspace or action" placeholder="Find a workspace or action…" className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-400" /><button type="button" onClick={close} className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100">Esc</button></div>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {results.map((item) => <button key={item.href} type="button" onClick={() => choose(item.href)} className="flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left hover:bg-zinc-100"><span className="min-w-0"><span className="block text-sm font-medium text-zinc-950">{item.label}</span><span className="block truncate text-xs text-zinc-500">{item.description}</span></span><span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{item.group}</span></button>)}
        {!results.length ? <div className="px-4 py-10 text-center"><p className="text-sm font-medium text-zinc-800">No matching workspace or action</p><p className="mt-1 text-xs text-zinc-500">Try “events”, “supplier”, “create” or “settings”.</p></div> : null}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-4 py-2 text-[11px] text-zinc-500"><span>Searches navigation and actions</span><span>Enter to open · Esc to close</span></div>
    </div>
  </div>;
}
