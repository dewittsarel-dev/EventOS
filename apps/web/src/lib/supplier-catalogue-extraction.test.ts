import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { extractSupplierCatalogue } from './supplier-catalogue-extraction';

describe('supplier catalogue extraction adapter', () => {
  it('extracts products from an Excel workbook into the private review format', async () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ['Product Name', 'Category', 'Cost', 'Quantity'],
      ['Gold Tiffany Chair', 'Decor', 350, 100],
    ]), 'Products');
    const bytes = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const file = new File([bytes], 'supplier.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = await extractSupplierCatalogue(file);

    expect(result.kind).toBe('Excel catalogue');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      productName: 'Gold Tiffany Chair',
      category: 'Decor',
      costPrice: 350,
      totalQuantity: 100,
    });
  });
});
