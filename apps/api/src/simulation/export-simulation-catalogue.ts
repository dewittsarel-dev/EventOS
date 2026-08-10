import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createSimulationBusinessCatalog } from './simulation-business-catalog';
import { createSimulationCatalogue } from './simulation-fixtures';
import { createVisualMultiSupplierEventPack } from './simulation-visual-event-pack';

const businesses = createSimulationBusinessCatalog();
const catalogue = createSimulationCatalogue(businesses);
const businessesById = new Map(
  businesses.map((business) => [business.id, business]),
);

const columns = [
  'business_id',
  'business_name',
  'business_kind',
  'business_category',
  'city',
  'business_scale',
  'item_id',
  'sku',
  'item_name',
  'item_category',
  'unit',
  'quantity_mode',
  'quantity',
  'cost_price',
  'selling_price',
  'image_path',
  'synthetic',
  'image_provenance',
  'availability_note',
] as const;

function csv(value: string | number | null) {
  const text = value === null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const rows = catalogue.map((item) => {
  const business = businessesById.get(item.businessId);
  if (!business) throw new Error(`Missing business for ${item.id}`);

  return [
    business.id,
    business.name,
    business.kind,
    business.category,
    business.city,
    business.scale,
    item.id,
    item.sku,
    item.name,
    item.category,
    item.unit,
    item.quantityMode,
    item.quantity,
    item.costPrice,
    item.sellingPrice,
    item.imagePath,
    business.synthetic,
    item.imageProvenance,
    'Simulator-only fixture; not available for real purchase',
  ].map(csv);
});

const outputPath = resolve(
  __dirname,
  '../../../web/public/simulation/eventos-synthetic-catalogue.csv',
);
writeFileSync(
  outputPath,
  [columns.map(csv).join(','), ...rows.map((row) => row.join(','))].join('\n'),
  'utf8',
);
console.log(
  `Exported ${catalogue.length} synthetic catalogue items to ${outputPath}`,
);

const visualScenarioPath = resolve(
  __dirname,
  '../../../web/public/simulation/visual-multi-supplier-event.json',
);
writeFileSync(
  visualScenarioPath,
  `${JSON.stringify(createVisualMultiSupplierEventPack(), null, 2)}\n`,
  'utf8',
);
console.log(`Exported visual multi-supplier scenario to ${visualScenarioPath}`);
