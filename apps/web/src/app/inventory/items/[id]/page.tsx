'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../../components/app-shell/page-header';
import { useAppSession } from '../../../../components/app-shell/session-context';
import { getInventoryItem } from '../../../../lib/inventory-api';
import type { InventoryItemRecord } from '../../../../lib/inventory-types';

export default function InventoryItemDetailsPage() {
  const params = useParams<{ id: string }>();
  const itemId = String(params.id);

  const { session } = useAppSession();

  const [item, setItem] = useState<InventoryItemRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOptions = useMemo(
    () => ({ token: session.token, baseUrl: session.baseUrl }),
    [session.baseUrl, session.token],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadItem() {
      if (!session.token) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await getInventoryItem(requestOptions, itemId);

        if (!cancelled) {
          setItem(response);
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'Failed to load resource item.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadItem();

    return () => {
      cancelled = true;
    };
  }, [itemId, requestOptions, session.token]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Resource Item Details"
        actions={
          <>
            <Link
              href={`/inventory/items/${itemId}/edit`}
              className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
            >
              Edit Item
            </Link>
            <Link
              href="/inventory/items"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
            >
              Back to Items
            </Link>
          </>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Loading resource item...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : item ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">
            {item.publicName ?? item.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-600">SKU: {item.sku}</p>

          <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <Detail label="Category" value={item.categoryName} />
            <Detail label="Sub Category" value={item.subCategory ?? '-'} />
            <Detail label="Brand" value={item.brand ?? '-'} />
            <Detail label="Item Type" value={item.itemType} />
            <Detail label="Resource Status" value={item.resourceStatus} />
            <Detail label="Unit of Measure" value={item.unitOfMeasure} />
            <Detail label="Preferred Supplier" value={item.preferredSupplierName ?? '-'} />
            <Detail label="Barcode" value={item.barcode ?? '-'} />
            <Detail label="QR Code" value={item.qrCode ?? '-'} />
            <Detail label="Internal Name" value={item.internalName ?? '-'} />
            <Detail label="Taxable" value={item.taxable ? 'Yes' : 'No'} />
            <Detail label="Active" value={item.active ? 'Yes' : 'No'} />
            <Detail label="Track Quantity" value={item.trackQuantity ? 'Yes' : 'No'} />
            <Detail
              label="Track Serial Numbers"
              value={item.trackSerialNumbers ? 'Yes' : 'No'}
            />
            <Detail label="Cost Price" value={item.costPrice?.toString() ?? '-'} />
            <Detail
              label="Replacement Value"
              value={item.replacementValue?.toString() ?? '-'}
            />
            <Detail label="Rental Price" value={item.rentalPrice?.toString() ?? '-'} />
            <Detail label="Selling Price" value={item.sellingPrice?.toString() ?? '-'} />
            <Detail label="Minimum Stock" value={item.minimumStock?.toString() ?? '-'} />
            <Detail label="Reorder Level" value={item.reorderLevel?.toString() ?? '-'} />
            <Detail label="Quantity On Hand" value={item.stock.quantityOnHand.toString()} />
            <Detail label="Quantity Reserved" value={item.stock.quantityReserved.toString()} />
            <Detail label="Quantity Available" value={item.stock.quantityAvailable.toString()} />
          </dl>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {item.shortDescription || item.description || 'No description provided.'}
            </p>
          </div>

          <details className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-zinc-700">
              Intelligence Metadata
            </summary>

            <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
              <Detail label="Style" value={item.style ?? '-'} />
              <Detail label="Colour" value={item.colour ?? '-'} />
              <Detail label="Material" value={item.material ?? '-'} />
              <Detail label="Dimensions" value={item.dimensions ?? '-'} />
              <Detail label="Weight" value={item.weight ?? '-'} />
              <Detail label="Capacity" value={item.capacity ?? '-'} />
              <Detail label="Indoor/Outdoor" value={item.indoorOutdoor} />
              <Detail
                label="Suitable Event Types"
                value={item.suitableEventTypes.length > 0 ? item.suitableEventTypes.join(', ') : '-'}
              />
              <Detail
                label="Manual Tags"
                value={item.manualTags.length > 0 ? item.manualTags.join(', ') : '-'}
              />
              <Detail
                label="AI Generated Tags"
                value={
                  item.aiGeneratedTags.length > 0
                    ? item.aiGeneratedTags.join(', ')
                    : '-'
                }
              />
              <Detail
                label="AI Keywords"
                value={item.aiKeywords.length > 0 ? item.aiKeywords.join(', ') : '-'}
              />
              <Detail
                label="AI Tags"
                value={item.aiTags.length > 0 ? item.aiTags.join(', ') : '-'}
              />
              <Detail
                label="AI Confidence"
                value={item.aiConfidence === null ? '-' : String(item.aiConfidence)}
              />
              <Detail
                label="Marketplace Visibility"
                value={item.marketplaceVisibility}
              />
            </dl>

            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-700">Long Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
                {item.longDescription || 'No long description provided.'}
              </p>
            </div>

            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-700">AI Summary</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
                {item.aiSummary || 'No AI summary available.'}
              </p>
            </div>

            <div className="mt-3">
              <p className="text-sm font-medium text-zinc-700">Photo URLs</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
                {item.photoUrls.length > 0 ? item.photoUrls.join('\n') : 'No photos linked.'}
              </p>
            </div>
          </details>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Internal Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {item.internalNotes || 'No internal notes provided.'}
            </p>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-zinc-700">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">
              {item.notes || 'No notes provided.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Resource item not found.
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium text-zinc-700">{label}</dt>
      <dd className="text-zinc-600">{value}</dd>
    </div>
  );
}
