import type {
  SupplierProductAvailability,
  SupplierProductCategory,
  SupplierProductPayload,
  SupplierProductUnit,
} from './supplier-products-types';

export type CatalogueImportCandidate = {
  id: string;
  sourceRow: number;
  selected: boolean;
  productName: string;
  sku: string;
  category: SupplierProductCategory;
  subcategory: string;
  description: string;
  colour: string;
  material: string;
  style: string;
  dimensions: string;
  costPrice: number;
  sellingPrice?: number;
  totalQuantity?: number;
  unit: SupplierProductUnit;
  availability: SupplierProductAvailability;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryRadiusKm?: number;
  imageUrls: string[];
  tags: string[];
  searchTerms: string[];
  issues: string[];
};

const headerAliases: Record<string, string[]> = {
  productName: ['product name', 'product', 'item name', 'item', 'name', 'title'],
  sku: ['sku', 'product code', 'item code', 'code'],
  category: ['category', 'product category', 'type'],
  subcategory: ['subcategory', 'sub category'],
  description: ['description', 'details', 'product description'],
  colour: ['colour', 'color'],
  material: ['material', 'fabric'],
  style: ['style', 'theme', 'look'],
  dimensions: ['dimensions', 'dimension', 'size', 'measurements'],
  costPrice: ['cost price', 'cost', 'purchase price'],
  sellingPrice: ['selling price', 'price', 'hire price', 'rental price'],
  totalQuantity: ['quantity', 'qty', 'stock', 'available quantity'],
  unit: ['unit', 'uom', 'unit of measure'],
  imageUrls: ['image url', 'image', 'photo url', 'photo', 'images'],
};

const categoryRules: Array<[SupplierProductCategory, RegExp]> = [
  ['Venue', /venue|hall|ballroom|chapel|conference room|garden/i],
  ['Transport', /transport|delivery|truck|shuttle|vehicle|logistics/i],
  ['AudioVisual', /audio|speaker|microphone|projector|screen|led wall|video/i],
  ['Lighting', /light|chandelier|lamp|uplight|fairy light/i],
  ['Catering', /catering|glass|plate|fork|knife|spoon|crockery|cutlery|chafing|bar/i],
  ['Printing', /print|sign|menu|invitation|stationery|banner/i],
  ['Decor', /decor|chair|table|linen|runner|flower|floral|vase|plinth|ottoman|sofa|couch|backdrop|arch/i],
  ['Service', /planner|photograph|videograph|dj|entertain|security|staff|coordination/i],
  ['Consumable', /candle|napkin|confetti|disposable|consumable/i],
  ['Material', /fabric|material|carpet|drape/i],
  ['Equipment', /equipment|tent|marquee|stage|generator|heater|cooler/i],
];

const synonymRules: Array<[RegExp, string[]]> = [
  [/\bchair\b/i, ['chairs', 'seating']],
  [/\btable\b/i, ['tables', 'event table']],
  [/\bglass\b/i, ['glasses', 'glassware', 'drinkware']],
  [/\bfork\b/i, ['forks', 'cutlery', 'flatware']],
  [/\bflower|floral\b/i, ['flowers', 'florals', 'arrangement']],
  [/\blinen|runner\b/i, ['table linen', 'table runner', 'fabric']],
  [/\bsofa|couch|ottoman\b/i, ['lounge furniture', 'soft seating']],
];

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(value.trim());
      value = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function field(record: Record<string, string>, name: keyof typeof headerAliases) {
  for (const alias of headerAliases[name]) {
    const value = record[alias];
    if (value) return value.trim();
  }
  return '';
}

function numberValue(value: string): number | undefined {
  if (!value.trim()) return undefined;
  let clean = value.replace(/[^0-9,.-]/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.lastIndexOf(',') > clean.lastIndexOf('.')
      ? clean.replace(/\./g, '').replace(',', '.')
      : clean.replace(/,/g, '');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  const parsed = Number(clean);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function categoryFor(text: string, supplied: string): SupplierProductCategory {
  const direct = categoryRules.find(([category]) => normalize(category) === normalize(supplied));
  if (direct) return direct[0];
  return categoryRules.find(([, pattern]) => pattern.test(`${supplied} ${text}`))?.[0] ?? 'Other';
}

function proposedTerms(text: string, attributes: string[]) {
  const terms = new Set(
    `${text} ${attributes.join(' ')}`
      .split(/[^a-zA-Z0-9]+/)
      .map(normalize)
      .filter((item) => item.length > 2),
  );
  for (const [pattern, synonyms] of synonymRules) {
    if (pattern.test(text)) synonyms.forEach((item) => terms.add(item));
  }
  return [...terms];
}

export function extractCsvCatalogue(text: string, sourceName: string): CatalogueImportCandidate[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalize);

  return rows.slice(1).map((values, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, values[column] ?? '']));
    const productName = field(record, 'productName');
    const description = field(record, 'description');
    const colour = field(record, 'colour');
    const material = field(record, 'material');
    const style = field(record, 'style');
    const dimensions = field(record, 'dimensions');
    const suppliedCategory = field(record, 'category');
    const costPrice = numberValue(field(record, 'costPrice'));
    const sellingPrice = numberValue(field(record, 'sellingPrice'));
    const totalQuantity = numberValue(field(record, 'totalQuantity'));
    const searchTerms = proposedTerms(`${productName} ${description}`, [colour, material, style]);
    const issues: string[] = [];
    if (!productName) issues.push('Product name requires review.');
    if (costPrice === undefined) issues.push('Cost price requires confirmation.');
    if (totalQuantity === undefined) issues.push('Quantity requires confirmation.');

    return {
      id: `${sourceName}-${index + 2}`,
      sourceRow: index + 2,
      selected: true,
      productName,
      sku: field(record, 'sku'),
      category: categoryFor(`${productName} ${description}`, suppliedCategory),
      subcategory: field(record, 'subcategory'),
      description,
      colour,
      material,
      style,
      dimensions,
      costPrice: costPrice ?? 0,
      sellingPrice,
      totalQuantity,
      unit: 'Each',
      availability: totalQuantity === 0 ? 'Unavailable' : 'Available',
      deliveryAvailable: true,
      pickupAvailable: true,
      imageUrls: field(record, 'imageUrls').split(/[;|]/).map((item) => item.trim()).filter(Boolean),
      tags: [colour, material, style].map(normalize).filter(Boolean),
      searchTerms,
      issues,
    };
  });
}

export function candidateToPayload(candidate: CatalogueImportCandidate, organizationId: string): SupplierProductPayload {
  const attributes = Object.fromEntries(
    [
      ['colour', candidate.colour],
      ['material', candidate.material],
      ['style', candidate.style],
      ['dimensions', candidate.dimensions],
    ].filter(([, value]) => value),
  );

  return {
    organizationId,
    productName: candidate.productName.trim(),
    sku: candidate.sku || undefined,
    category: candidate.category,
    subcategory: candidate.subcategory || undefined,
    description: candidate.description || undefined,
    marketplaceDescription: candidate.description || undefined,
    attributes,
    unit: candidate.unit,
    costPrice: candidate.costPrice,
    sellingPrice: candidate.sellingPrice,
    totalQuantity: candidate.totalQuantity,
    availability: candidate.availability,
    deliveryAvailable: candidate.deliveryAvailable,
    pickupAvailable: candidate.pickupAvailable,
    deliveryRadiusKm: candidate.deliveryRadiusKm,
    imageUrls: candidate.imageUrls,
    tags: candidate.tags,
    searchTerms: candidate.searchTerms,
  };
}
