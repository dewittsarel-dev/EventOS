'use client';

import Link from 'next/link';
import { readMarketplaceCustomerSession } from '@/lib/marketplace-customer-session';

export function MarketplaceHeader({
  compact = false,
  browseHref = '/marketplace',
}: {
  compact?: boolean;
  browseHref?: string;
}) {
  const customerSession = readMarketplaceCustomerSession();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#fffdf9]/95 px-4 backdrop-blur-xl md:px-10">
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-3 ${compact ? 'h-16' : 'h-[4.5rem]'}`}>
        <Link href={browseHref} className="flex min-w-0 items-center gap-3" aria-label="EventOS Marketplace home">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-950 text-xs font-semibold text-white">
            EO
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-amber-400" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight sm:text-base">EventOS Marketplace</span>
            {!compact ? <span className="hidden text-[11px] text-stone-500 sm:block">Find the right partners for your event</span> : null}
          </span>
        </Link>
        <nav aria-label="Marketplace navigation" className="flex shrink-0 items-center gap-2">
          <Link href={browseHref} className="hidden rounded-full px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950 md:block">Browse</Link>
          <Link href="/marketplace/account" className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-medium hover:border-stone-950 sm:text-sm">
            {customerSession ? 'My planning' : 'Customer sign in'}
          </Link>
          <Link href="/login" aria-label="Business ClientOS" className="rounded-full bg-stone-950 px-3 py-2 text-xs font-medium text-white hover:bg-amber-300 hover:text-stone-950 sm:px-4 sm:text-sm">
            <span className="sm:hidden">ClientOS</span><span className="hidden sm:inline">Business ClientOS</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketplaceFooter() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950 px-5 py-10 text-stone-400 md:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-semibold text-white">EventOS Marketplace</p><p className="mt-1">Customer discovery powered by supplier-managed ClientOS data.</p></div>
        <Link href="/login" className="font-medium text-stone-300 hover:text-amber-300">Manage your business in ClientOS →</Link>
      </div>
    </footer>
  );
}
