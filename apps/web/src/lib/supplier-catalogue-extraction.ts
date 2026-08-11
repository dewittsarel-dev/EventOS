import { extractCsvCatalogue, extractTextCatalogue, type CatalogueImportCandidate } from './supplier-catalogue-import';

export type CatalogueExtractionResult = {
  kind: 'CSV catalogue' | 'Excel catalogue' | 'PDF catalogue' | 'Product image';
  candidates: CatalogueImportCandidate[];
  extractedText?: string;
  status: string;
};

async function extractExcel(file: File): Promise<CatalogueExtractionResult> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const candidates = workbook.SheetNames.flatMap((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    return extractCsvCatalogue(csv, `${file.name}-${sheetName}`);
  });
  return {
    kind: 'Excel catalogue',
    candidates,
    status: `${candidates.length} products extracted from ${workbook.SheetNames.length} sheet${workbook.SheetNames.length === 1 ? '' : 's'} for review`,
  };
}

async function extractPdf(file: File): Promise<CatalogueExtractionResult> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ('str' in item ? item.str : '')).join('\n'));
  }
  const extractedText = pages.join('\n\n');
  const candidates = extractTextCatalogue(extractedText, file.name);
  return {
    kind: 'PDF catalogue',
    candidates,
    extractedText,
    status: candidates.length
      ? `${candidates.length} possible products extracted from ${document.numPages} page${document.numPages === 1 ? '' : 's'} for review`
      : 'No embedded product text found; use image OCR or supplier review',
  };
}

async function extractImage(file: File): Promise<CatalogueExtractionResult> {
  const { recognize } = await import('tesseract.js');
  const result = await recognize(file, 'eng');
  const extractedText = result.data.text.trim();
  const candidates = extractTextCatalogue(extractedText, file.name);
  return {
    kind: 'Product image',
    candidates,
    extractedText,
    status: candidates.length
      ? `${candidates.length} possible product extracted by OCR for review`
      : 'No readable product text detected; retain image for manual matching',
  };
}

export async function extractSupplierCatalogue(file: File): Promise<CatalogueExtractionResult> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.csv')) {
    const candidates = extractCsvCatalogue(await file.text(), file.name);
    return { kind: 'CSV catalogue', candidates, status: `${candidates.length} products extracted for review` };
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) return extractExcel(file);
  if (lower.endsWith('.pdf') || file.type === 'application/pdf') return extractPdf(file);
  if (file.type.startsWith('image/')) return extractImage(file);
  throw new Error(`Unsupported catalogue file: ${file.name}`);
}
