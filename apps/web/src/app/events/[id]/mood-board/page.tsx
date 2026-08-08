'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { listRequirementSets } from '../../../../lib/event-planning-api';
import type { RequirementSet } from '../../../../lib/event-planning-types';
import {
  approveMoodBoard,
  commentOnMoodBoard,
  createMoodBoard,
  listMoodBoards,
  requestMoodBoardChanges,
  submitMoodBoardReview,
} from '../../../../lib/mood-board-api';
import type { MoodBoard, MoodBoardObjectSource } from '../../../../lib/mood-board-types';

const fieldClass = 'rounded-md border border-zinc-300 px-3 py-2 text-sm';

export default function MoodBoardPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = String(id);
  const { session } = useAppSession();
  const options = { token: session.token, baseUrl: session.baseUrl };
  const [sets, setSets] = useState<RequirementSet[]>([]);
  const [boards, setBoards] = useState<MoodBoard[]>([]);
  const [selectedSetId, setSelectedSetId] = useState('');
  const [source, setSource] = useState<MoodBoardObjectSource>('PlannerLibrary');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!session.token) return;
    try {
      const requestOptions = { token: session.token, baseUrl: session.baseUrl };
      const [setRows, boardRows] = await Promise.all([
        listRequirementSets(requestOptions, eventId),
        listMoodBoards(requestOptions, eventId),
      ]);
      setSets(setRows);
      setBoards(boardRows);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load Mood Board Studio.');
    }
  }, [eventId, session.baseUrl, session.token]);

  useEffect(() => {
    // Load the visual workspace for the selected event.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const sceneName = String(data.get('sceneName'));
    try {
      await createMoodBoard(options, eventId, {
        requirementSetId: selectedSetId,
        title: String(data.get('title')),
        scenes: [{
          sceneKey: sceneName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          name: sceneName,
          description: String(data.get('sceneDescription')) || undefined,
          objects: [{
            requirementItemId: String(data.get('requirementItemId')),
            name: String(data.get('objectName')),
            source,
            sourceReferenceId: String(data.get('sourceReferenceId')),
            supplierName: String(data.get('supplierName')) || undefined,
            marketplaceListingId: String(data.get('marketplaceListingId')) || undefined,
            imageUrl: String(data.get('imageUrl')),
            locked: data.get('locked') === 'on',
          }],
        }],
      });
      form.reset();
      setSelectedSetId('');
      setMessage('Mood Board version created from the approved Requirement Set.');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create Mood Board.');
    }
  }

  async function action(work: () => Promise<unknown>, success: string) {
    setError('');
    try {
      await work();
      setMessage(success);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Mood Board action failed.');
    }
  }

  const selectedSet = sets.find((set) => set.id === selectedSetId);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mood Board Studio" description="Turn approved requirements into a governed visual concept. Visual approval does not start procurement." actions={<Link href={`/events/${eventId}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Back to Event</Link>} />
      {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <form onSubmit={create} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-5 md:grid-cols-2">
        <div className="md:col-span-2"><h2 className="font-semibold">Create visual concept</h2><p className="text-sm text-zinc-600">Every visual object remains linked to an approved requirement and identified source.</p></div>
        <select required value={selectedSetId} onChange={(event) => setSelectedSetId(event.target.value)} className={fieldClass}><option value="" disabled>Select approved Requirement Set</option>{sets.filter((set) => set.status === 'Approved').map((set) => <option key={set.id} value={set.id}>Version {set.version}</option>)}</select>
        <input required name="title" placeholder="Mood Board title" className={fieldClass} />
        <input required name="sceneName" placeholder="Scene name, e.g. Main Hall" className={fieldClass} />
        <input name="sceneDescription" placeholder="Scene intent" className={fieldClass} />
        <select required name="requirementItemId" className={fieldClass} defaultValue=""><option value="" disabled>Select linked requirement</option>{selectedSet?.items.map((item) => <option key={item.id} value={item.id}>{item.requirementCode} · {item.name}</option>)}</select>
        <input required name="objectName" placeholder="Visual object name" className={fieldClass} />
        <select value={source} onChange={(event) => setSource(event.target.value as MoodBoardObjectSource)} className={fieldClass}><option>PlannerLibrary</option><option>ClientUpload</option><option>Marketplace</option><option>AiConcept</option></select>
        <input required name="sourceReferenceId" placeholder="Stable source reference" className={fieldClass} />
        {source === 'Marketplace' ? <><input required name="supplierName" placeholder="Marketplace supplier" className={fieldClass} /><input required name="marketplaceListingId" placeholder="Marketplace listing ID" className={fieldClass} /></> : null}
        <input required type="url" name="imageUrl" placeholder="Image URL" className={fieldClass} />
        <label className="flex items-center gap-2 text-sm text-zinc-700"><input type="checkbox" name="locked" /> Lock this approved visual object in later revisions</label>
        <button disabled={!selectedSet} className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-40 md:col-span-2">Create Mood Board Version</button>
      </form>

      <section className="grid gap-4">
        {boards.map((board) => (
          <article key={board.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{board.title}</h2><p className="text-sm text-zinc-600">Version {board.version} · {board.status}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{board.status}</span></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {board.scenes.flatMap((scene) => scene.objects.map((object) => (
                <div key={object.id} className="overflow-hidden rounded-lg border border-zinc-200">
                  <Image unoptimized src={object.imageUrl} alt={object.name} width={600} height={400} className="h-44 w-full object-cover" />
                  <div className="p-3"><p className="font-medium">{object.name}</p><p className="text-xs text-zinc-600">{object.requirementItem.requirementCode} · {object.source}{object.locked ? ' · Locked' : ''}</p></div>
                </div>
              )))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(board.status === 'Draft' || board.status === 'ChangesRequested') ? <button onClick={() => void action(() => submitMoodBoardReview(options, eventId, board.id), 'Mood Board submitted for client review.')} className="rounded border border-zinc-300 px-3 py-2 text-sm">Submit for review</button> : null}
              {board.status === 'InClientReview' ? <><ReviewForm label="Add comment" onSubmit={(comment) => action(() => commentOnMoodBoard(options, eventId, board.id, comment), 'Comment recorded.')} /><ReviewForm label="Request changes" onSubmit={(comment) => action(() => requestMoodBoardChanges(options, eventId, board.id, comment), 'Changes requested.')} /><button onClick={() => void action(() => approveMoodBoard(options, eventId, board.id), 'Visual design approved. Procurement was not started.')} className="rounded bg-emerald-700 px-3 py-2 text-sm text-white">Approve visual design</button></> : null}
            </div>
            {board.reviews.length ? <ul className="mt-4 space-y-1 text-xs text-zinc-600">{board.reviews.map((review) => <li key={review.id}>{review.type}: {review.comment || 'Approved'}</li>)}</ul> : null}
          </article>
        ))}
        {!boards.length ? <p className="rounded-xl bg-white p-5 text-sm text-zinc-600">No Mood Board versions yet.</p> : null}
      </section>
    </div>
  );
}

function ReviewForm({ label, onSubmit }: { label: string; onSubmit: (comment: string) => Promise<unknown> }) {
  return <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; const comment = String(new FormData(form).get('comment')); void onSubmit(comment).then(() => form.reset()); }} className="flex gap-2"><input required name="comment" aria-label={`${label} comment`} placeholder="Comment" className="rounded border border-zinc-300 px-2 py-1.5 text-sm" /><button className="rounded border border-zinc-300 px-3 py-1.5 text-sm">{label}</button></form>;
}
