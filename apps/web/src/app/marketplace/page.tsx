'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/app-shell/page-header';
import { useAppSession } from '@/components/app-shell/session-context';
import {
  getSupplierShortfallSummary,
  searchMarketplaceCapability,
} from '@/lib/marketplace-api';
import type {
  MarketplaceCapabilityMatch,
  MarketplaceFulfilmentStatus,
  MarketplaceSearchMode,
  MarketplaceSupplierShortfallSummary,
} from '@/lib/marketplace-types';

function statusClasses(status: MarketplaceFulfilmentStatus) {
  if (status === 'OWN_STOCK') {
    return 'bg-emerald-100 text-emerald-700';
  }

  if (status === 'SOURCING_POSSIBLE') {
    return 'bg-blue-100 text-blue-700';
  }

  if (status === 'PARTIAL_ONLY') {
    return 'bg-amber-100 text-amber-800';
  }

  return 'bg-zinc-200 text-zinc-700';
}

function formatPrice(amount: number | null, currency: string | null) {
  if (amount === null || currency === null) {
    return 'Not available';
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
  }).format(amount);
}

function toIsoDateRangeStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toIsoDateRangeEnd(value: string) {
  return new Date(`${value}T23:59:59.000Z`).toISOString();
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysDate(days: number) {
  const next = new Date();
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export default function MarketplacePage() {
  const { session } = useAppSession();
  const [itemOrService, setItemOrService] = useState('');
  const [requiredQuantity, setRequiredQuantity] = useState('150');
  const [startDate, setStartDate] = useState(todayDate());
  const [endDate, setEndDate] = useState(plusDaysDate(2));
  const [deliveryLocation, setDeliveryLocation] = useState('Pretoria');
  const [specifications, setSpecifications] = useState('Gold finish\nStackable');
  const [searchMode, setSearchMode] =
    useState<MarketplaceSearchMode>('AI_ASSISTED');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<MarketplaceCapabilityMatch[]>([]);
  const [automationBoundaries, setAutomationBoundaries] = useState<string[]>([]);
  const [appliedThreshold, setAppliedThreshold] = useState<number | null>(null);
  const [minimumTargetResults, setMinimumTargetResults] = useState<number | null>(null);
  const [maximumDisplayedResults, setMaximumDisplayedResults] = useState<number | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  const [shortfallLoading, setShortfallLoading] = useState(false);
  const [shortfallError, setShortfallError] = useState('');
  const [shortfallSummary, setShortfallSummary] =
    useState<MarketplaceSupplierShortfallSummary | null>(null);

  const canSearch = Boolean(session.token);

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  async function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setShortfallError('');
    setShortfallSummary(null);

    if (!session.token) {
      setError('Sign in to run marketplace capability matching.');
      return;
    }

    const quantity = Number(requiredQuantity);
    if (!itemOrService.trim()) {
      setError('Item or service is required.');
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError('Required quantity must be greater than zero.');
      return;
    }

    if (!deliveryLocation.trim()) {
      setError('Delivery location is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await searchMarketplaceCapability(requestOptions, {
        searchMode,
        requirement: {
          itemOrService: itemOrService.trim(),
          requiredQuantity: quantity,
          startDateTime: toIsoDateRangeStart(startDate),
          endDateTime: toIsoDateRangeEnd(endDate),
          deliveryLocation: deliveryLocation.trim(),
          specifications: specifications
            .split(/\r?\n/)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0),
        },
      });

      setMatches(response.suppliers);
      setAutomationBoundaries(response.automationBoundaries);
      setAppliedThreshold(response.appliedOwnCoverageThresholdPercentage);
      setMinimumTargetResults(response.minimumTargetResults);
      setMaximumDisplayedResults(response.maximumDisplayedResults);
      setSelectedSupplierId(response.suppliers[0]?.supplierId ?? '');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to run capability matching.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function onLoadShortfallSummary() {
    setShortfallError('');
    setShortfallSummary(null);

    if (!selectedSupplierId) {
      setShortfallError('Select a supplier first.');
      return;
    }

    if (!session.token) {
      setShortfallError('Sign in to load supplier shortfall summary.');
      return;
    }

    const quantity = Number(requiredQuantity);
    setShortfallLoading(true);

    try {
      const response = await getSupplierShortfallSummary(requestOptions, {
        searchMode,
        primarySupplierId: selectedSupplierId,
        requirement: {
          itemOrService: itemOrService.trim(),
          requiredQuantity: quantity,
          startDateTime: toIsoDateRangeStart(startDate),
          endDateTime: toIsoDateRangeEnd(endDate),
          deliveryLocation: deliveryLocation.trim(),
          specifications: specifications
            .split(/\r?\n/)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0),
        },
      });

      setShortfallSummary(response);
    } catch (requestError) {
      setShortfallError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to load supplier shortfall summary.',
      );
    } finally {
      setShortfallLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Marketplace Capability Matching"
        description="Buyers search requirements and receive objective fulfilment status per ClientOS supplier."
      />

      <form
        onSubmit={onSearch}
        className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            Item or Service
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={itemOrService}
              onChange={(event) => setItemOrService(event.target.value)}
              placeholder="Gold Tiffany Chairs"
            />
          </label>

          <label className="text-sm text-zinc-700">
            Required Quantity
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              type="number"
              min={1}
              value={requiredQuantity}
              onChange={(event) => setRequiredQuantity(event.target.value)}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Event Start Date
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>

          <label className="text-sm text-zinc-700">
            Event End Date
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Delivery Location
            <input
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={deliveryLocation}
              onChange={(event) => setDeliveryLocation(event.target.value)}
              placeholder="Pretoria"
            />
          </label>

          <label className="text-sm text-zinc-700 md:col-span-2">
            Relevant Specifications (one per line)
            <textarea
              className="mt-1 min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2"
              value={specifications}
              onChange={(event) => setSpecifications(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-700">Search mode</label>
          <select
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={searchMode}
            onChange={(event) =>
              setSearchMode(event.target.value as MarketplaceSearchMode)
            }
          >
            <option value="AI_ASSISTED">AI assisted (faster path)</option>
            <option value="MANUAL">Manual search</option>
          </select>

          <button
            type="submit"
            disabled={!canSearch || loading}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Searching...' : 'Run capability matching'}
          </button>
        </div>

        {!canSearch ? (
          <p className="text-sm text-amber-700">
            Sign in to run marketplace matching. Manual and AI modes remain available once authenticated.
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
      </form>

      {automationBoundaries.length > 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-zinc-900">AI and operator control</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
            {automationBoundaries.map((boundary) => (
              <li key={boundary}>{boundary}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Buyer-facing supplier results</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Secondary supplier identities are intentionally hidden at this stage.
        </p>
        {appliedThreshold !== null ? (
          <p className="mt-2 text-sm text-zinc-600">
            Adaptive own-stock threshold applied: {appliedThreshold}% own coverage. Showing {matches.length}
            {maximumDisplayedResults !== null
              ? ` of up to ${maximumDisplayedResults}`
              : ''}
            {minimumTargetResults !== null
              ? ` (target minimum ${minimumTargetResults} credible suppliers where available).`
              : '.'}
          </p>
        ) : null}

        {matches.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-600">No results yet. Run a capability search above.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {matches.map((supplier) => (
              <article
                key={supplier.supplierId}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-zinc-900">{supplier.supplierName}</h3>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClasses(supplier.fulfilmentStatus)}`}
                  >
                    {supplier.fulfilmentStatus}
                  </span>
                </div>

                <dl className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
                  <div>
                    <dt className="font-medium">Own available quantity</dt>
                    <dd>{supplier.ownAvailableQuantity}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Own-stock percentage</dt>
                    <dd>{supplier.ownCoveragePercentage}%</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Sourced-stock percentage</dt>
                    <dd>{supplier.sourcedCoveragePercentage}%</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Total potentially fulfilable quantity</dt>
                    <dd>{supplier.totalPotentiallyFulfillableQuantity}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Fulfilment model</dt>
                    <dd>
                      {supplier.usesAdditionalMarketplaceSourcing
                        ? 'Own stock + additional marketplace sourcing'
                        : 'Own stock only'}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Distance estimate</dt>
                    <dd>
                      {supplier.distanceKmEstimate === null
                        ? 'Unknown'
                        : `${supplier.distanceKmEstimate} km`}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Estimated delivery capability</dt>
                    <dd>{supplier.estimatedDeliveryCapability}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Objective reliability</dt>
                    <dd>
                      {supplier.reliabilityRating === null
                        ? supplier.reliabilityBand
                        : `${supplier.reliabilityRating}/5 (${supplier.reliabilityBand})`}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Pricing (valid and available only)</dt>
                    <dd>
                      {formatPrice(
                        supplier.indicativeUnitPrice,
                        supplier.pricingCurrency,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium">Secondary suppliers required</dt>
                    <dd>{supplier.marketplaceSecondarySupplierCount}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Fulfilment confidence</dt>
                    <dd>
                      {supplier.fulfilmentConfidence} ({supplier.fulfilmentConfidenceScore}%)
                    </dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-900">Supplier RFQ shortfall summary</h2>
        <p className="mt-1 text-sm text-zinc-600">
          This prepares supplier decision support only. No RFQs, reservations, quotations, orders, or commitments are sent automatically.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
            value={selectedSupplierId}
            onChange={(event) => setSelectedSupplierId(event.target.value)}
          >
            <option value="">Select supplier</option>
            {matches.map((supplier) => (
              <option key={supplier.supplierId} value={supplier.supplierId}>
                {supplier.supplierName}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void onLoadShortfallSummary()}
            disabled={shortfallLoading || matches.length === 0}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {shortfallLoading ? 'Preparing summary...' : 'Load supplier shortfall summary'}
          </button>
        </div>

        {shortfallError ? <p className="mt-2 text-sm text-red-700">{shortfallError}</p> : null}

        {shortfallSummary ? (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h3 className="text-sm font-semibold text-zinc-900">{shortfallSummary.supplierName}</h3>
            <dl className="mt-3 grid gap-2 text-sm text-zinc-700 md:grid-cols-2">
              <div>
                <dt className="font-medium">Fulfilment status</dt>
                <dd>{shortfallSummary.fulfilmentStatus}</dd>
              </div>
              <div>
                <dt className="font-medium">Required quantity</dt>
                <dd>{shortfallSummary.requiredQuantity}</dd>
              </div>
              <div>
                <dt className="font-medium">Own available quantity</dt>
                <dd>{shortfallSummary.ownAvailableQuantity}</dd>
              </div>
              <div>
                <dt className="font-medium">Exact shortfall</dt>
                <dd>{shortfallSummary.shortfallQuantity}</dd>
              </div>
              <div>
                <dt className="font-medium">Marketplace sourcing options exist</dt>
                <dd>{shortfallSummary.marketplaceSourcingOptionsExist ? 'Yes' : 'No'}</dd>
              </div>
              <div>
                <dt className="font-medium">Potential secondary supplier count</dt>
                <dd>{shortfallSummary.marketplaceSecondarySupplierCount}</dd>
              </div>
            </dl>

            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-800">Allowed supplier actions</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                {shortfallSummary.allowedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
