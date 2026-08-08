import { Injectable } from '@nestjs/common';
import { AiDraftInputType } from '@prisma/client';

export const PURCHASE_ORDER_QUOTATION_EXTRACTOR =
  'PURCHASE_ORDER_QUOTATION_EXTRACTOR';

type UploadedSourceFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type ExtractedLineItem = {
  description: string;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  lineTotal: number;
  discountPercent: number;
  vatPercent: number;
  sourceReference: string;
};

type ExtractedField = {
  value: string | number | null;
  confidence: number;
  sourceReference: string;
};

type ExtractedHeader = {
  supplierName?: ExtractedField;
  supplierReference?: ExtractedField;
  quotationDate?: ExtractedField;
  deliveryDate?: ExtractedField;
  deliveryText?: ExtractedField;
  currency?: ExtractedField;
  subtotal?: ExtractedField;
  vatAmount?: ExtractedField;
  validUntilDate?: ExtractedField;
  eventReference?: ExtractedField;
  paymentTerms?: ExtractedField;
  deliveryAddress?: ExtractedField;
  deliveryFee?: ExtractedField;
  total?: ExtractedField;
  notes?: ExtractedField;
};

export type PurchaseOrderDraftExtraction = {
  inputType: AiDraftInputType;
  extractionAdapter: string;
  sourceText: string | null;
  sourceFileName: string | null;
  sourceMimeType: string | null;
  sourceBytesBase64: string | null;
  header: ExtractedHeader;
  lineItems: ExtractedLineItem[];
  warnings: Array<{ code: string; message: string; fieldPath?: string }>;
};

export interface PurchaseOrderQuotationExtractor {
  extract(params: {
    sourceText?: string;
    file?: UploadedSourceFile;
  }): PurchaseOrderDraftExtraction;
}

@Injectable()
export class PurchaseOrderDraftExtractorService implements PurchaseOrderQuotationExtractor {
  extract(params: {
    sourceText?: string;
    file?: UploadedSourceFile;
  }): PurchaseOrderDraftExtraction {
    const normalizedText = this.normalizeInputText(
      params.sourceText,
      params.file,
    );
    const inputType = this.resolveInputType(params.sourceText, params.file);
    const warnings: Array<{
      code: string;
      message: string;
      fieldPath?: string;
    }> = [];

    const lines = normalizedText
      ? normalizedText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [];

    const header = this.extractHeader(lines);
    const lineItems = this.extractLineItems(lines);

    if (lineItems.length === 0) {
      warnings.push({
        code: 'no_line_items_detected',
        message:
          'No structured quotation line items were detected. Add or map line items manually during review.',
        fieldPath: 'lineItems',
      });
    }

    return {
      inputType,
      extractionAdapter: 'deterministic-rule-parser-v1',
      sourceText: normalizedText,
      sourceFileName: params.file?.originalname ?? null,
      sourceMimeType: params.file?.mimetype ?? null,
      sourceBytesBase64: params.file?.buffer
        ? params.file.buffer.toString('base64')
        : null,
      header,
      lineItems,
      warnings,
    };
  }

  private resolveInputType(
    sourceText: string | undefined,
    file: UploadedSourceFile | undefined,
  ) {
    if (file?.mimetype.startsWith('image/')) {
      return AiDraftInputType.Image;
    }

    if (file) {
      return AiDraftInputType.Pdf;
    }

    if (sourceText && sourceText.trim().length > 0) {
      return AiDraftInputType.Text;
    }

    return AiDraftInputType.Text;
  }

  private normalizeInputText(
    sourceText: string | undefined,
    file: UploadedSourceFile | undefined,
  ) {
    if (sourceText && sourceText.trim().length > 0) {
      return sourceText.trim();
    }

    if (file?.mimetype.startsWith('text/')) {
      return file.buffer.toString('utf8').trim();
    }

    if (file?.mimetype === 'application/pdf') {
      return this.buildDeterministicMockTextFromFileName(file.originalname);
    }

    return null;
  }

  private extractHeader(lines: string[]): ExtractedHeader {
    const header: ExtractedHeader = {};

    header.supplierName = this.findStringField(
      lines,
      ['supplier', 'vendor', 'from'],
      0.85,
    );
    header.supplierReference = this.findStringField(
      lines,
      ['quotation', 'quote', 'reference', 'ref'],
      0.55,
    );
    header.quotationDate = this.findDateField(
      lines,
      ['quotation date', 'quote date', 'date'],
      0.75,
    );
    header.deliveryDate = this.findDateField(
      lines,
      ['delivery date', 'deliver by', 'delivery expected'],
      0.55,
    );
    header.deliveryText = this.findStringField(
      lines,
      ['delivery notes', 'delivery text', 'deliver to', 'delivery'],
      0.58,
    );
    header.currency = this.findCurrencyField(lines, 0.78);
    header.subtotal = this.findMoneyField(
      lines,
      ['subtotal', 'sub total', 'before vat'],
      0.78,
    );
    header.vatAmount = this.findMoneyField(lines, ['vat', 'tax'], 0.72);
    header.validUntilDate = this.findDateField(
      lines,
      ['valid until', 'valid-to', 'expiry', 'expires'],
      0.78,
    );
    header.eventReference = this.findStringField(
      lines,
      ['event', 'function', 'booking'],
      0.65,
    );
    header.paymentTerms = this.findStringField(
      lines,
      ['payment terms', 'terms'],
      0.7,
    );
    header.deliveryAddress = this.findStringField(
      lines,
      ['delivery address', 'deliver to', 'delivery'],
      0.68,
    );
    header.deliveryFee = this.findMoneyField(
      lines,
      ['delivery fee', 'delivery', 'shipping'],
      0.7,
    );
    header.total = this.findMoneyField(
      lines,
      ['grand total', 'total due', 'quotation total', 'total'],
      0.72,
    );
    header.notes = this.findStringField(lines, ['notes'], 0.6);

    return header;
  }

  private extractLineItems(lines: string[]) {
    const items: ExtractedLineItem[] = [];

    lines.forEach((line, index) => {
      const pipeParts = line.split('|').map((part) => part.trim());
      if (pipeParts.length >= 4) {
        const quantity = this.parseNumber(pipeParts[1]) ?? 0;
        const parsedUnitCandidate = this.parseMoney(pipeParts[2]);
        const hasExplicitUnit = parsedUnitCandidate === null;
        const unit = hasExplicitUnit ? pipeParts[2] || null : null;
        const unitPrice = hasExplicitUnit
          ? (this.parseMoney(pipeParts[3]) ?? 0)
          : (this.parseMoney(pipeParts[2]) ?? 0);
        const lineTotal = hasExplicitUnit
          ? (this.parseMoney(pipeParts[4]) ?? this.round2(quantity * unitPrice))
          : this.round2(quantity * unitPrice);
        const discountRaw = hasExplicitUnit ? pipeParts[5] : pipeParts[3];
        const vatRaw = hasExplicitUnit ? pipeParts[6] : pipeParts[4];
        items.push({
          description: pipeParts[0] ?? '',
          quantity,
          unit,
          unitPrice,
          lineTotal,
          discountPercent: this.parseNumber(discountRaw) ?? 0,
          vatPercent: this.parseNumber(vatRaw) ?? 15,
          sourceReference: `text:line ${index + 1}`,
        });
        return;
      }

      const inlineMatch = line.match(
        /^(?<description>.+?)\s+x\s+(?<quantity>\d+(?:[.,]\d+)?)\s+@\s+(?<unitPrice>[A-Z]{0,3}\s*[\d,]+(?:\.\d{1,2})?)(?:.*?vat\s+(?<vat>\d+(?:[.,]\d+)?)%?)?(?:.*?discount\s+(?<discount>\d+(?:[.,]\d+)?)%?)?/i,
      );

      if (inlineMatch?.groups) {
        items.push({
          description: inlineMatch.groups.description.trim(),
          quantity: this.parseNumber(inlineMatch.groups.quantity) ?? 0,
          unit: 'each',
          unitPrice: this.parseMoney(inlineMatch.groups.unitPrice) ?? 0,
          lineTotal: this.round2(
            (this.parseNumber(inlineMatch.groups.quantity) ?? 0) *
              (this.parseMoney(inlineMatch.groups.unitPrice) ?? 0),
          ),
          discountPercent: this.parseNumber(inlineMatch.groups.discount) ?? 0,
          vatPercent: this.parseNumber(inlineMatch.groups.vat) ?? 0,
          sourceReference: `text:line ${index + 1}`,
        });
      }
    });

    return items.filter(
      (item) => item.description.length > 0 && item.quantity > 0,
    );
  }

  private findStringField(
    lines: string[],
    labels: string[],
    confidence: number,
  ) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lowerLine = line.toLowerCase();
      const label = labels.find((candidate) => lowerLine.includes(candidate));
      if (!label) {
        continue;
      }

      const parts = line.split(/[:#]/, 2);
      const rawValue = parts.length > 1 ? parts[1].trim() : line.trim();
      if (!rawValue || rawValue.toLowerCase() === label) {
        continue;
      }

      return {
        value: rawValue,
        confidence,
        sourceReference: `text:line ${index + 1}`,
      };
    }

    return undefined;
  }

  private findMoneyField(
    lines: string[],
    labels: string[],
    confidence: number,
  ) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      const lowerLine = line.toLowerCase();
      const label = labels.find((candidate) => lowerLine.includes(candidate));
      if (!label) {
        continue;
      }

      const amountMatch = line.match(/([A-Z]{0,3}\s*[\d,]+(?:\.\d{1,2})?)/i);
      const amount = this.parseMoney(amountMatch?.[1]);
      if (amount === null) {
        continue;
      }

      return {
        value: amount,
        confidence,
        sourceReference: `text:line ${index + 1}`,
      };
    }

    return undefined;
  }

  private findDateField(lines: string[], labels: string[], confidence: number) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const lowerLine = line.toLowerCase();
      const label = labels.find((candidate) => lowerLine.includes(candidate));
      if (!label) {
        continue;
      }

      const dateMatch = line.match(
        /(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      );
      const isoDate = this.parseDate(dateMatch?.[1]);
      if (!isoDate) {
        continue;
      }

      return {
        value: isoDate,
        confidence,
        sourceReference: `text:line ${index + 1}`,
      };
    }

    return undefined;
  }

  private parseMoney(value: string | undefined) {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
    if (
      !normalized ||
      normalized === '-' ||
      normalized === '.' ||
      normalized === '-.'
    ) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseNumber(value: string | undefined) {
    if (!value) {
      return null;
    }

    const parsed = Number(value.replace(/,/g, '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private parseDate(value: string | undefined) {
    if (!value) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T00:00:00.000Z`).toISOString();
    }

    const parts = value.split(/[/-]/);
    if (parts.length !== 3) {
      return null;
    }

    const [dayPart, monthPart, yearPart] = parts;
    const day = Number(dayPart);
    const month = Number(monthPart);
    const year = Number(yearPart.length === 2 ? `20${yearPart}` : yearPart);
    if (
      !Number.isFinite(day) ||
      !Number.isFinite(month) ||
      !Number.isFinite(year)
    ) {
      return null;
    }

    return new Date(Date.UTC(year, month - 1, day)).toISOString();
  }

  private round2(value: number) {
    return Math.round(value * 100) / 100;
  }

  private findCurrencyField(lines: string[], confidence: number) {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const upper = line.toUpperCase();
      const codeMatch = upper.match(/\b(ZAR|USD|EUR|GBP)\b/);

      if (!codeMatch) {
        continue;
      }

      return {
        value: codeMatch[1],
        confidence,
        sourceReference: `text:line ${index + 1}`,
      };
    }

    return undefined;
  }

  private buildDeterministicMockTextFromFileName(fileName: string) {
    const baseName = fileName.replace(/\.pdf$/i, '').trim();
    const compact = baseName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const quoteSuffix = (compact.slice(-4) || '1001').padStart(4, '1');
    const supplierToken =
      baseName
        .split(/[-_\s]+/)
        .filter((chunk) => chunk.length > 0)
        .slice(0, 3)
        .join(' ') || 'Mock Supplier';

    return [
      `Supplier: ${supplierToken}`,
      `Quotation: Q-${quoteSuffix}`,
      'Quotation Date: 2026-08-03',
      'Delivery Date: 2026-08-15',
      'Currency: ZAR',
      'Subtotal: 1200.00',
      'VAT Amount: 180.00',
      'Grand Total: 1380.00',
      'Delivery Notes: Deliver to main event venue loading bay',
      'Folding Chair | 20 | each | 35.00 | 700.00 | 0 | 15',
      'Round Table Cloth | 10 | each | 50.00 | 500.00 | 0 | 15',
    ].join('\n');
  }
}
