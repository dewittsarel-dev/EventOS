export type ProductImageNameResult = {
  visibleText: string;
  suggestedName: string;
};

const REJECTED_LINE = /(?:https?:\/\/|www\.|@|\b(?:tel|phone|email|whatsapp|price|total|subtotal|vat|sku|code)\b)/i;
const PRICE_ONLY = /^(?:r|zar|\$|\u20ac|\u00a3)?\s*[\d\s.,]+(?:\s*(?:each|ea))?$/i;

export function suggestProductNameFromVisibleText(text: string): string {
  const candidates = text
    .split(/\r?\n/)
    .filter((line) => !REJECTED_LINE.test(line))
    .map((line) => line.replace(/[^\p{L}\p{N}&'()\-/ ]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter((line) => {
      const words = line.split(' ').filter(Boolean);
      return line.length >= 3
        && line.length <= 80
        && words.length <= 10
        && /\p{L}/u.test(line)
        && !PRICE_ONLY.test(line);
    });

  if (candidates.length === 0) return '';

  return candidates
    .map((line, index) => {
      const words = line.split(' ');
      const productWords = /\b(chair|table|glass|tumbler|plate|fork|knife|spoon|linen|runner|napkin|vase|plinth|ottoman|sofa|couch|light|lamp|tent|marquee|stage|speaker|microphone|flower|floral|bar|stool|bench|charger|underplate|candle|stand|arch|backdrop)\b/i.test(line);
      const mostlyLetters = (line.match(/\p{L}/gu)?.length ?? 0) / line.length > 0.6;
      const score = (productWords ? 8 : 0) + (words.length >= 2 && words.length <= 6 ? 4 : 0) + (mostlyLetters ? 2 : 0) - index * 0.25;
      return { line, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.line ?? '';
}

export async function readProductNameFromImage(file: File): Promise<ProductImageNameResult> {
  const { recognize } = await import('tesseract.js');
  const result = await recognize(file, 'eng');
  const visibleText = result.data.text.trim();
  return { visibleText, suggestedName: suggestProductNameFromVisibleText(visibleText) };
}
