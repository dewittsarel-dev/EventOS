import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSimulationBusinessCatalog } from './simulation-business-catalog';
import { createSimulationCatalogue } from './simulation-fixtures';
import {
  discoverSupplierPhotos,
  matchSupplierPhotos,
  missingCatalogueImages,
} from './supplier-photo-import';

const sourceArgument = process.argv.find((argument) =>
  argument.startsWith('--source='),
);
const source = resolve(
  sourceArgument?.slice('--source='.length) || 'Supplier Photos',
);
const catalogue = createSimulationCatalogue(createSimulationBusinessCatalog());
const photos = discoverSupplierPhotos(source);
const matches = matchSupplierPhotos(photos, catalogue);
const report = {
  source,
  generatedAt: new Date().toISOString(),
  totals: {
    photos: photos.length,
    matched: matches.filter((match) => match.status === 'MATCHED').length,
    review: matches.filter((match) => match.status === 'REVIEW').length,
    duplicates: matches.filter((match) => match.status === 'DUPLICATE').length,
    catalogueItemsWithoutImportedPhoto: missingCatalogueImages(
      catalogue,
      matches,
    ).length,
  },
  matches,
  missingCatalogueImages: missingCatalogueImages(catalogue, matches),
};
const outputDirectory = resolve(__dirname, '../../../../outputs/simulation');
const output = resolve(outputDirectory, 'supplier-photo-audit.json');
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Audited ${photos.length} photos. Report: ${output}`);
