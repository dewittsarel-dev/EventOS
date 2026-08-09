'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { clearMarketplaceCustomerSession, readMarketplaceCustomerSession, writeMarketplaceCustomerSession } from '@/lib/marketplace-customer-session';
import { listCustomerEnquiries, listCustomerShortlist, loginMarketplaceCustomer, registerMarketplaceCustomer, removeCustomerShortlist, sendCustomerEnquiryMessage } from '@/lib/marketplace-public-api';
import type { MarketplaceCustomerEnquiry, MarketplaceCustomerSession, MarketplaceShortlistItem } from '@/lib/marketplace-public-types';

const field = 'rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500';

export default function MarketplaceAccountPage() {
  const [session, setSession] = useState<MarketplaceCustomerSession | null>(() => readMarketplaceCustomerSession());
  const [enquiries, setEnquiries] = useState<MarketplaceCustomerEnquiry[]>([]);
  const [shortlist, setShortlist] = useState<MarketplaceShortlistItem[]>([]);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async (current: MarketplaceCustomerSession) => {
    const [enquiryRows, shortlistRows] = await Promise.all([listCustomerEnquiries(current.accessToken), listCustomerShortlist(current.accessToken)]);
    setEnquiries(enquiryRows);
    setShortlist(shortlistRows);
  }, []);
  useEffect(() => {
    const current = session;
    if (current) {
      const timer = window.setTimeout(() => {
        void load(current).catch(() => {
          clearMarketplaceCustomerSession();
          setSession(null);
        });
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [load, session]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError('');
    try {
      const next = registering ? await registerMarketplaceCustomer({ name: String(data.get('name')), email: String(data.get('email')), phone: String(data.get('phone')) || undefined, password: String(data.get('password')) }) : await loginMarketplaceCustomer({ email: String(data.get('email')), password: String(data.get('password')) });
      writeMarketplaceCustomerSession(next);
      setSession(next);
      await load(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Account request failed.');
    }
  }

  if (!session)
    return (
      <MarketplaceFrame>
        <section className="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold">{registering ? 'Create your Marketplace account' : 'Customer sign in'}</h1>
          <p className="mt-2 text-sm text-stone-600">Track enquiries, supplier replies and your saved event shortlist. This account cannot access private ClientOS records.</p>
          {error ? (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <form onSubmit={authenticate} className="mt-6 grid gap-3">
            {registering ? (
              <>
                <input required name="name" placeholder="Your name" className={field} />
                <input name="phone" placeholder="Phone (optional)" className={field} />
              </>
            ) : null}
            <input required type="email" name="email" placeholder="Email" className={field} />
            <input required minLength={10} type="password" name="password" placeholder="Password (minimum 10 characters)" className={field} />
            <button className="rounded-full bg-stone-950 px-5 py-3 font-medium text-white">{registering ? 'Create account' : 'Sign in'}</button>
          </form>
          <button onClick={() => setRegistering((value) => !value)} className="mt-4 text-sm underline">
            {registering ? 'Already have an account?' : 'Create a customer account'}
          </button>
        </section>
      </MarketplaceFrame>
    );

  return (
    <MarketplaceFrame>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Welcome, {session.customer.name}</h1>
          <p className="text-sm text-stone-600">Your Marketplace planning workspace</p>
        </div>
        <button
          onClick={() => {
            clearMarketplaceCustomerSession();
            setSession(null);
          }}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Enquiries</h2>
        <div className="mt-3 grid gap-4">
          {enquiries.map((enquiry) => (
            <article key={enquiry.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{enquiry.resource?.name ?? 'Marketplace enquiry'}</h3>
                  <p className="text-xs text-stone-500">{new Date(enquiry.createdAt).toLocaleDateString('en-ZA')}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs">{enquiry.salesOpportunity?.status ?? enquiry.status}</span>
              </div>
              <p className="mt-3 text-sm text-stone-700">{enquiry.message}</p>
              {enquiry.salesOpportunity?.eventId ? <p className="mt-2 text-sm font-medium text-emerald-700">Confirmed Event reference: {enquiry.salesOpportunity.eventId}</p> : null}
              <div className="mt-4 space-y-2">
                {enquiry.messages.map((message) => (
                  <p key={message.id} className={`rounded-xl p-3 text-sm ${message.authorRole === 'Customer' ? 'ml-8 bg-stone-100' : 'mr-8 bg-amber-50'}`}>
                    <strong>{message.authorRole}:</strong> {message.body}
                  </p>
                ))}
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  const body = String(new FormData(form).get('body'));
                  void sendCustomerEnquiryMessage(session.accessToken, enquiry.id, body).then(() => {
                    form.reset();
                    return load(session);
                  });
                }}
                className="mt-3 flex gap-2"
              >
                <input required name="body" aria-label={`Message supplier about ${enquiry.resource?.name ?? 'enquiry'}`} placeholder="Message the supplier" className={`${field} min-w-0 flex-1`} />
                <button className="rounded-full bg-stone-950 px-4 py-2 text-sm text-white">Send</button>
              </form>
            </article>
          ))}
          {!enquiries.length ? <p className="rounded-2xl bg-white p-5 text-sm text-stone-600">No account-linked enquiries yet.</p> : null}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">Saved shortlist comparison</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-100">
              <tr>
                <th className="p-3">Listing</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Availability</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {shortlist.map((item) => (
                <tr key={item.resourceId} className="border-t border-stone-200">
                  <td className="p-3">
                    <a className="font-medium underline" href={`/marketplace/listings/${item.resourceId}`}>
                      {item.listing.title}
                    </a>
                  </td>
                  <td className="p-3">{item.listing.supplierName}</td>
                  <td className="p-3">{item.listing.categoryName}</td>
                  <td className="p-3">{item.listing.rentalPrice === null ? 'On request' : `ZAR ${item.listing.rentalPrice.toLocaleString()}`}</td>
                  <td className="p-3">{item.listing.availabilityStatus}</td>
                  <td className="p-3">
                    <button onClick={() => void removeCustomerShortlist(session.accessToken, item.resourceId).then(() => load(session))} className="text-red-700 underline">
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shortlist.length ? <p className="p-5 text-sm text-stone-600">Save products from the Marketplace to compare them here.</p> : null}
        </div>
      </section>
    </MarketplaceFrame>
  );
}

function MarketplaceFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f1e9] px-5 py-8 text-stone-950 md:px-10">
      <div className="mx-auto max-w-6xl">
        <a href="/marketplace" className="mb-8 inline-block text-sm font-medium">
          ← Marketplace
        </a>
        {children}
      </div>
    </main>
  );
}
