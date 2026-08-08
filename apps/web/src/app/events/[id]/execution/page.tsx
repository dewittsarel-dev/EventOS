'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { WorkspaceNextAction } from '../../../../components/events/workspace-next-action';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { getEvent } from '../../../../lib/events-api';
import { approveExecutionGoLive, assessExecutionGate, buildExecutionPlan, changeExecutionIncidentStatus, changeExecutionTaskStatus, completeExecutionCloseoutItem, createExecutionCloseoutItem, createExecutionIncident, createExecutionTask, createExecutionWorkspace, getExecutionWorkspace, recordExecutionCommandLog, setExecutionRunOfShow, transitionExecution } from '../../../../lib/event-execution-workspace-api';
import type { EventExecutionWorkspace, ExecutionControlStatus } from '../../../../lib/event-execution-workspace-types';
import { executionGuidance } from '../../../../lib/event-workspace-guidance';
const field = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

export default function EventExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = String(id);
  const { session } = useAppSession();
  const options = useMemo(() => ({ token: session.token, baseUrl: session.baseUrl }), [session.baseUrl, session.token]);
  const [organizationId, setOrganizationId] = useState('');
  const [workspace, setWorkspace] = useState<EventExecutionWorkspace | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (!session.token) return;
    try {
      const event = await getEvent(options, eventId);
      setOrganizationId(event.organizationId);
      try {
        setWorkspace(await getExecutionWorkspace(options, event.organizationId, eventId));
        setMissing(false);
      } catch (requestError) {
        if (requestError instanceof Error && requestError.message.includes('not found')) {
          setMissing(true);
          setWorkspace(null);
        } else throw requestError;
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load Event Execution.');
    }
  }, [eventId, options, session.token]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  async function act(work: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await work();
      setMessage(success);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Execution action failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Event Execution"
        description="Control readiness, setup, live operation, incidents, breakdown and closeout from one operational source of truth."
        actions={
          <Link href={`/events/${eventId}`} className="rounded-md border px-3 py-2 text-sm">
            Back to Event
          </Link>
        }
      />
      {error ? (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? <p className="rounded bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
      {workspace ? <WorkspaceNextAction {...executionGuidance(workspace)} /> : null}
      {missing ? (
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Create the operational command workspace</h2>
          <p className="mt-1 text-sm text-zinc-600">This creates execution control only. It does not approve readiness or start the event.</p>
          <button onClick={() => void act(() => createExecutionWorkspace(options, organizationId, eventId, 'Event operational command and control'), 'Execution workspace created.')} className="mt-4 rounded bg-zinc-900 px-3 py-2 text-sm text-white">
            Create Event Execution
          </button>
        </section>
      ) : null}
      {workspace ? (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            <Metric label="Status" value={workspace.status} />
            <Metric label="Open tasks" value={String(workspace.tasks.filter((x) => x.status !== 'Completed').length)} />
            <Metric label="Blocking gates" value={String(workspace.gates.filter((x) => x.decision === 'Failed' || x.decision === 'Pending').length)} />
            <Metric label="Open incidents" value={String(workspace.incidents.filter((x) => !['Resolved', 'Closed'].includes(x.status)).length)} />
          </section>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void act(() => buildExecutionPlan(options, organizationId, eventId), 'Execution plan built from approved upstream records.')} className="rounded border px-3 py-2 text-sm">
              Build or refresh plan
            </button>
            <button onClick={() => void act(() => transitionExecution(options, organizationId, eventId, 'dispatch'), 'Dispatch recorded after readiness validation.')} className="rounded border px-3 py-2 text-sm">
              Dispatch
            </button>
            <button onClick={() => void act(() => approveExecutionGoLive(options, organizationId, eventId), 'Event Live gate approved by operator.')} className="rounded bg-emerald-800 px-3 py-2 text-sm text-white">
              Approve Go Live
            </button>
            <button onClick={() => void act(() => transitionExecution(options, organizationId, eventId, 'collect'), 'Collection phase recorded.')} className="rounded border px-3 py-2 text-sm">
              Begin collection
            </button>
            <button onClick={() => void act(() => transitionExecution(options, organizationId, eventId, 'complete'), 'Execution completion recorded after controlled closeout validation.')} className="rounded border px-3 py-2 text-sm">
              Complete execution
            </button>
          </div>
          <section className="grid gap-5 xl:grid-cols-2">
            <Panel title="Operational tasks">
              <TaskForm onSubmit={(input) => act(() => createExecutionTask(options, organizationId, eventId, input), 'Controlled execution task created.')} />
              {workspace.tasks.map((task) => (
                <div key={task.id} className="mt-3 rounded border p-3">
                  <div className="flex justify-between">
                    <p className="font-medium">{task.title}</p>
                    <span className="text-xs">{task.status}</span>
                  </div>
                  <p className="text-xs text-zinc-600">Complete when: {task.completionCriteria}</p>
                  <StatusForm onSubmit={(status, evidence) => act(() => changeExecutionTaskStatus(options, organizationId, eventId, task.id, status, evidence), `Task moved to ${status}.`)} />
                </div>
              ))}
            </Panel>
            <Panel title="Readiness gates">
              <GateForm onSubmit={(input) => act(() => assessExecutionGate(options, organizationId, eventId, input), 'Readiness gate assessment recorded by the operator.')} />
              {workspace.gates.map((gate) => (
                <p key={gate.id} className="mt-2 rounded border p-3 text-sm">
                  <strong>{gate.name}</strong> · {gate.decision}
                  {gate.blockerSummary ? ` · ${gate.blockerSummary}` : ''}
                </p>
              ))}
            </Panel>
            <Panel title="Run of show">
              <RunForm onSubmit={(item) => act(() => setExecutionRunOfShow(options, organizationId, eventId, [item]), 'Run-of-show cue saved.')} />
              {workspace.runOfShowItems.map((item) => (
                <p key={item.id} className="mt-2 text-sm">
                  {item.sequence}. {new Date(item.scheduledAt).toLocaleTimeString()} · {item.title}
                </p>
              ))}
            </Panel>
            <Panel title="Command log">
              <SimpleForm
                fields={['logType', 'severity', 'message']}
                button="Record command entry"
                onSubmit={(data) =>
                  act(
                    () =>
                      recordExecutionCommandLog(options, organizationId, eventId, {
                        logType: data.logType,
                        severity: data.severity,
                        message: data.message,
                      }),
                    'Immutable command entry recorded.',
                  )
                }
              />
              {workspace.commandLogs.slice(-8).map((log) => (
                <p key={log.id} className="mt-2 text-sm">
                  <strong>{log.severity}</strong> · {log.message}
                </p>
              ))}
            </Panel>
            <Panel title="Operational incidents">
              <IncidentForm onSubmit={(input) => act(() => createExecutionIncident(options, organizationId, eventId, input), 'Execution incident opened separately from routine tasks.')} />
              {workspace.incidents.map((incident) => (
                <div key={incident.id} className="mt-2 rounded border p-3 text-sm">
                  <strong>
                    {incident.severity} · {incident.title}
                  </strong>
                  <p>
                    {incident.status} · {incident.description}
                  </p>
                  {incident.status !== 'Closed' ? (
                    <button onClick={() => void act(() => changeExecutionIncidentStatus(options, organizationId, eventId, incident.id, 'Resolved'), 'Incident marked resolved with its history preserved.')} className="mt-2 rounded border px-2 py-1 text-xs">
                      Resolve incident
                    </button>
                  ) : null}
                </div>
              ))}
            </Panel>
            <Panel title="Breakdown and closeout">
              <SimpleForm
                fields={['closeoutType', 'criteria']}
                button="Add closeout control"
                onSubmit={(data) =>
                  act(
                    () =>
                      createExecutionCloseoutItem(options, organizationId, eventId, {
                        closeoutType: data.closeoutType,
                        criteria: data.criteria,
                      }),
                    'Closeout control added.',
                  )
                }
              />
              {workspace.closeoutItems.map((item) => (
                <div key={item.id} className="mt-2 flex justify-between rounded border p-3 text-sm">
                  <span>
                    {item.closeoutType} · {item.criteria}
                  </span>
                  {item.status !== 'Completed' ? (
                    <button onClick={() => void act(() => completeExecutionCloseoutItem(options, organizationId, eventId, item.id, 'Completed'), 'Closeout evidence accepted.')} className="rounded border px-2 py-1 text-xs">
                      Complete
                    </button>
                  ) : (
                    <span>Completed</span>
                  )}
                </div>
              ))}
            </Panel>
          </section>
        </>
      ) : null}
      {busy ? <p className="text-sm text-zinc-500">Recording controlled operation…</p> : null}
    </div>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function TaskForm({ onSubmit }: { onSubmit: (x: { title: string; description?: string; completionCriteria: string }) => Promise<void> }) {
  return (
    <SimpleForm
      fields={['title', 'completionCriteria', 'description']}
      button="Add task"
      onSubmit={(d) =>
        onSubmit({
          title: d.title,
          completionCriteria: d.completionCriteria,
          description: d.description,
        })
      }
    />
  );
}
function StatusForm({ onSubmit }: { onSubmit: (s: ExecutionControlStatus, e: string) => Promise<void> }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        void onSubmit(String(d.get('status')) as ExecutionControlStatus, String(d.get('evidence')));
      }}
      className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr_auto]"
    >
      <select name="status" className={field}>
        <option>Ready</option>
        <option>InProgress</option>
        <option>Blocked</option>
        <option>Completed</option>
      </select>
      <input name="evidence" placeholder="Evidence or blocked reason" className={`${field} min-w-0`} />
      <button className="rounded border px-3 py-2 text-xs">Update</button>
    </form>
  );
}
function GateForm({ onSubmit }: { onSubmit: (x: { key: string; name: string; category: string; decision: 'Pending' | 'Passed' | 'Failed' | 'Waived'; blockerSummary?: string; waiverReason?: string }) => Promise<void> }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        const name = String(d.get('name'));
        const decision = String(d.get('decision')) as 'Pending' | 'Passed' | 'Failed' | 'Waived';
        void onSubmit({
          key: name.toLowerCase().replace(/\W+/g, '-'),
          name,
          category: String(d.get('category')),
          decision,
          blockerSummary: String(d.get('reason')) || undefined,
          waiverReason: decision === 'Waived' ? String(d.get('reason')) : undefined,
        });
      }}
      className="mt-3 grid gap-2 sm:grid-cols-2"
    >
      <input required name="name" placeholder="Gate name" className={field} />
      <input required name="category" placeholder="Category" className={field} />
      <select name="decision" className={field}>
        <option>Pending</option>
        <option>Passed</option>
        <option>Failed</option>
        <option>Waived</option>
      </select>
      <input name="reason" placeholder="Blocker or waiver reason" className={field} />
      <button className="rounded bg-zinc-900 px-3 py-2 text-sm text-white sm:col-span-2">Record gate decision</button>
    </form>
  );
}
function RunForm({ onSubmit }: { onSubmit: (x: { sequence: number; title: string; scheduledAt: string; durationMinutes?: number; cueType?: string }) => Promise<void> }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        void onSubmit({
          sequence: Number(d.get('sequence')),
          title: String(d.get('title')),
          scheduledAt: new Date(String(d.get('scheduledAt'))).toISOString(),
          durationMinutes: Number(d.get('duration')) || undefined,
          cueType: String(d.get('cueType')) || undefined,
        });
      }}
      className="mt-3 grid gap-2 sm:grid-cols-2"
    >
      <input required type="number" min="0" name="sequence" placeholder="Sequence" className={field} />
      <input required name="title" placeholder="Cue title" className={field} />
      <input required type="datetime-local" name="scheduledAt" className={field} />
      <input type="number" name="duration" placeholder="Minutes" className={field} />
      <input name="cueType" placeholder="Cue type" className={field} />
      <button className="rounded bg-zinc-900 px-3 py-2 text-sm text-white">Save run of show</button>
    </form>
  );
}
function IncidentForm({ onSubmit }: { onSubmit: (x: { incidentType: string; severity: string; title: string; description: string; location?: string }) => Promise<void> }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        void onSubmit({
          incidentType: String(d.get('incidentType')),
          severity: String(d.get('severity')),
          title: String(d.get('title')),
          description: String(d.get('description')),
          location: String(d.get('location')) || undefined,
        });
      }}
      className="mt-3 grid gap-2 sm:grid-cols-2"
    >
      <input required name="incidentType" placeholder="Incident type" className={field} />
      <select name="severity" className={field}>
        <option>Low</option>
        <option>Medium</option>
        <option>High</option>
        <option>Critical</option>
        <option>Emergency</option>
      </select>
      <input required name="title" placeholder="Title" className={field} />
      <input name="location" placeholder="Location" className={field} />
      <textarea required name="description" placeholder="Description and immediate context" className={`${field} sm:col-span-2`} />
      <button className="rounded bg-red-800 px-3 py-2 text-sm text-white sm:col-span-2">Open incident</button>
    </form>
  );
}
function SimpleForm({ fields, button, onSubmit }: { fields: string[]; button: string; onSubmit: (x: Record<string, string>) => Promise<void> }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        void onSubmit(Object.fromEntries(fields.map((f) => [f, String(d.get(f))])));
      }}
      className="mt-3 grid gap-2 sm:grid-cols-2"
    >
      {fields.map((f) => (
        <input key={f} required name={f} placeholder={f.replace(/([A-Z])/g, ' $1')} className={field} />
      ))}
      <button className="rounded bg-zinc-900 px-3 py-2 text-sm text-white sm:col-span-2">{button}</button>
    </form>
  );
}
