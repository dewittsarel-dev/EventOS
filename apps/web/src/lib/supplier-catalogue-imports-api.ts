import type { CatalogueImportCandidate } from "./supplier-catalogue-import";

export type CatalogueImportSource = {
  id: string;
  name: string;
  kind: string;
  status: string;
};

export type SupplierCatalogueImportRecord = {
  id: string;
  organizationId: string;
  supplierId: string;
  sourceFiles: CatalogueImportSource[];
  candidates: CatalogueImportCandidate[];
  extractionAdapter?: string;
  status: "Review" | "Completed" | "Cancelled";
  createdAt: string;
  updatedAt: string;
};

type RequestOptions = { token: string; baseUrl: string };

async function request<T>(
  path: string,
  options: RequestOptions,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = options.baseUrl.endsWith("/")
    ? options.baseUrl.slice(0, -1)
    : options.baseUrl;
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string | string[];
    } | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;
    throw new Error(message ?? `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function listSupplierCatalogueImports(
  options: RequestOptions,
  supplierId: string,
  organizationId: string,
) {
  return request<SupplierCatalogueImportRecord[]>(
    `/suppliers/${supplierId}/catalogue-imports?organizationId=${encodeURIComponent(organizationId)}`,
    options,
  );
}

export function createSupplierCatalogueImport(
  options: RequestOptions,
  supplierId: string,
  payload: {
    organizationId: string;
    sourceFiles: CatalogueImportSource[];
    candidates: CatalogueImportCandidate[];
    extractionAdapter?: string;
  },
) {
  return request<SupplierCatalogueImportRecord>(
    `/suppliers/${supplierId}/catalogue-imports`,
    options,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateSupplierCatalogueImport(
  options: RequestOptions,
  supplierId: string,
  importId: string,
  payload: {
    organizationId: string;
    sourceFiles?: CatalogueImportSource[];
    candidates?: CatalogueImportCandidate[];
    status?: "Review" | "Completed" | "Cancelled";
  },
) {
  return request<SupplierCatalogueImportRecord>(
    `/suppliers/${supplierId}/catalogue-imports/${importId}`,
    options,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
