import { PageHeader } from '../../components/app-shell/page-header';

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Documents"
        description="Find the latest approved evidence in the context of the event and decision it supports."
      />
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">
          Document workspace is the next shared capability
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
          Documents will be relationship-based rather than organised as a second folder tree.
          Existing operational records remain available while document storage, evidence links,
          approvals and access controls are implemented as a focused vertical slice.
        </p>
      </section>
    </div>
  );
}
