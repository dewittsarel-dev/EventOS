import { PageHeader } from '@/components/app-shell/page-header';

export default function MarketplacePage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Marketplace"
        description="Customer-facing marketplace experiences are planned for a later phase."
      />

      <div className="rounded-xl border border-zinc-200 bg-white p-8">
        <p className="text-sm font-medium text-zinc-900">Coming Later</p>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          This area is intentionally reserved for the Marketplace surface and will be
          delivered in a future roadmap milestone.
        </p>
      </div>
    </div>
  );
}
