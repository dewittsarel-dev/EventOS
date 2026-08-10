import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { SimulationCatalogueItem } from './simulation-fixtures';

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export interface SupplierPhotoCandidate {
  path: string;
  fileName: string;
  sha256: string;
}

export interface SupplierPhotoMatch {
  photo: SupplierPhotoCandidate;
  itemId: string | null;
  itemName: string | null;
  score: number;
  status: 'MATCHED' | 'REVIEW' | 'DUPLICATE';
  duplicateOf?: string;
}

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/\[synthetic\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value: string) {
  return new Set(
    normalise(value)
      .split(' ')
      .filter((token) => token.length > 2),
  );
}

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

export function discoverSupplierPhotos(
  directory: string,
): SupplierPhotoCandidate[] {
  return walk(directory)
    .filter((path) => SUPPORTED_EXTENSIONS.has(extname(path).toLowerCase()))
    .map((path) => ({
      path,
      fileName: basename(path),
      sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
    }));
}

export function matchSupplierPhotos(
  photos: readonly SupplierPhotoCandidate[],
  catalogue: readonly SimulationCatalogueItem[],
): SupplierPhotoMatch[] {
  const firstPathByHash = new Map<string, string>();

  return photos.map((photo) => {
    const duplicateOf = firstPathByHash.get(photo.sha256);
    if (duplicateOf) {
      return {
        photo,
        itemId: null,
        itemName: null,
        score: 1,
        status: 'DUPLICATE',
        duplicateOf,
      };
    }
    firstPathByHash.set(photo.sha256, photo.path);

    const photoTokens = tokens(
      basename(photo.fileName, extname(photo.fileName)),
    );
    const ranked = catalogue
      .map((item) => {
        const itemTokens = tokens(item.name);
        const overlap = [...photoTokens].filter((token) =>
          itemTokens.has(token),
        ).length;
        const score = itemTokens.size === 0 ? 0 : overlap / itemTokens.size;
        return { item, score };
      })
      .sort((left, right) => right.score - left.score);
    const best = ranked[0];

    return {
      photo,
      itemId: best?.score ? best.item.id : null,
      itemName: best?.score ? best.item.name : null,
      score: best?.score ?? 0,
      status: (best?.score ?? 0) >= 0.6 ? 'MATCHED' : 'REVIEW',
    };
  });
}

export function missingCatalogueImages(
  catalogue: readonly SimulationCatalogueItem[],
  matches: readonly SupplierPhotoMatch[],
) {
  const matchedNames = new Set(
    matches
      .filter((match) => match.status === 'MATCHED')
      .map((match) => match.itemName),
  );
  return [...new Set(catalogue.map((item) => item.name))].filter(
    (name) => !matchedNames.has(name),
  );
}
