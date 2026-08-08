export function WorkspaceNextAction({ stage, attention, nextAction, explanation }: { stage: string; attention: number; nextAction: string; explanation: string }) {
  return <section aria-label="Workspace next action" className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-[minmax(0,0.7fr)_minmax(0,0.5fr)_minmax(0,2fr)]">
    <div><p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Current stage</p><p className="mt-1 font-semibold text-zinc-900">{stage}</p></div>
    <div><p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Needs attention</p><p className={`mt-1 font-semibold ${attention ? 'text-amber-700' : 'text-emerald-700'}`}>{attention}</p></div>
    <div><p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Next safe action</p><p className="mt-1 font-semibold text-zinc-900">{nextAction}</p><p className="mt-1 text-sm text-zinc-600">{explanation}</p></div>
  </section>;
}
