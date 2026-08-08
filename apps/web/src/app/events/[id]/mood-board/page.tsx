'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { listRequirementSets } from '../../../../lib/event-planning-api';
import type { RequirementSet } from '../../../../lib/event-planning-types';
import { listMarketplaceListings } from '../../../../lib/marketplace-public-api';
import type { MarketplaceListing } from '../../../../lib/marketplace-public-types';
import {
  approveMoodBoard,
  commentOnMoodBoard,
  createMoodBoard,
  listMoodBoards,
  requestMoodBoardChanges,
  submitMoodBoardReview,
} from '../../../../lib/mood-board-api';
import type { MoodBoard } from '../../../../lib/mood-board-types';
import { MoodBoardComposer, type MoodBoardComposition } from './mood-board-composer';

export default function MoodBoardPage() {
  const { id } = useParams<{ id: string }>();
  const eventId = String(id);
  const { session } = useAppSession();
  const options = { token: session.token, baseUrl: session.baseUrl };
  const [sets, setSets] = useState<RequirementSet[]>([]);
  const [boards, setBoards] = useState<MoodBoard[]>([]);
  const [marketplaceListings, setMarketplaceListings] = useState<MarketplaceListing[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!session.token) return;
    try {
      const requestOptions = { token: session.token, baseUrl: session.baseUrl };
      const [setRows, boardRows, listingPage] = await Promise.all([
        listRequirementSets(requestOptions, eventId),
        listMoodBoards(requestOptions, eventId),
        listMarketplaceListings({ limit: 100 }),
      ]);
      setSets(setRows);
      setBoards(boardRows);
      setMarketplaceListings(listingPage.items);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load Mood Board Studio.');
    }
  }, [eventId, session.baseUrl, session.token]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function create(composition: MoodBoardComposition) {
    setError('');
    try {
      await createMoodBoard(options, eventId, composition);
      setMessage('Governed Mood Board composition saved from the approved Requirement Set.');
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to create Mood Board.');
      throw requestError;
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Mood Board Studio" description="Compose requirement-linked scenes from real supplier assets. Visual approval does not start procurement." actions={<Link href={`/events/${eventId}`} className="rounded-md border border-zinc-300 px-3 py-2 text-sm">Back to Event</Link>} />
      {error ? <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

      <MoodBoardComposer sets={sets} marketplaceListings={marketplaceListings} onCreate={create} />

      <section className="grid gap-4">
        {boards.map((board) => (
          <article key={board.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{board.title}</h2><p className="text-sm text-zinc-600">Version {board.version} · {board.status}</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">{board.status}</span></div>
            <div className="mt-4 space-y-5">
              {board.scenes.map((scene) => <section key={scene.id}><div className="mb-2"><h3 className="font-medium">{scene.name}</h3>{scene.description ? <p className="text-sm text-zinc-600">{scene.description}</p> : null}</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{scene.objects.map((object) => (
                <div key={object.id} className="overflow-hidden rounded-lg border border-zinc-200">
                  <Image unoptimized src={object.imageUrl} alt={object.name} width={600} height={400} className="h-44 w-full object-cover" />
                  <div className="p-3"><p className="font-medium">{object.name}</p><p className="text-xs text-zinc-600">{object.requirementItem.requirementCode} · {object.source}{object.locked ? ' · Locked' : ''}</p>{object.presentation?.placementInstructions ? <p className="mt-2 text-xs text-zinc-700">{object.presentation.placementInstructions}</p> : null}</div>
                </div>
              ))}</div></section>)}
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
