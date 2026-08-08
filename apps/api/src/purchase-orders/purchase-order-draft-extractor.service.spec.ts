import { PurchaseOrderDraftExtractorService } from './purchase-order-draft-extractor.service';

describe('PurchaseOrderDraftExtractorService', () => {
  let service: PurchaseOrderDraftExtractorService;

  beforeEach(() => {
    service = new PurchaseOrderDraftExtractorService();
  });

  it('extracts header fields and pipe-delimited line items from pasted quotation text', () => {
    const result = service.extract({
      sourceText: [
        'Supplier: Cape Event Supply',
        'Quotation: Q-1001',
        'Quotation Date: 2026-08-03',
        'Valid Until: 2026-08-10',
        'Payment Terms: COD',
        'Chair Hire | 10 | 25.00 | 0 | 15',
        'Table Hire | 5 | 40.00 | 5 | 15',
        'Grand Total: 517.50',
      ].join('\n'),
    });

    expect(result.header.supplierName?.value).toBe('Cape Event Supply');
    expect(result.header.supplierReference?.value).toBe('Q-1001');
    expect(result.header.quotationDate?.value).toBe('2026-08-03T00:00:00.000Z');
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems[0]).toMatchObject({
      description: 'Chair Hire',
      quantity: 10,
      unitPrice: 25,
      vatPercent: 15,
    });
  });

  it('stores pdf upload as a source and emits a mock-extractor warning when text is unavailable', () => {
    const result = service.extract({
      file: {
        originalname: 'quote.pdf',
        mimetype: 'application/pdf',
        size: 128,
        buffer: Buffer.from('%PDF-mock%'),
      },
    });

    expect(result.inputType).toBe('Pdf');
    expect(result.sourceFileName).toBe('quote.pdf');
    expect(result.header.currency?.value).toBe('ZAR');
    expect(result.header.vatAmount?.value).toBe(180);
    expect(result.header.subtotal?.value).toBe(1200);
    expect(result.header.total?.value).toBe(1380);
    expect(result.lineItems[0]).toMatchObject({
      description: 'Folding Chair',
      quantity: 20,
      unit: 'each',
      unitPrice: 35,
      lineTotal: 700,
    });
  });
});
