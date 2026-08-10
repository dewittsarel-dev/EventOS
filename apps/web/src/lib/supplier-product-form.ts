import type { SupplierProductPayload, SupplierProductRecord } from './supplier-products-types';

export type SupplierProductFormValues = {
  productName: string; sku: string; category: SupplierProductPayload['category']; subcategory: string;
  brand: string; description: string; marketplaceDescription: string; unit: SupplierProductPayload['unit'];
  costPrice: string; sellingPrice: string; vatPercent: string; leadTimeDays: string; minimumOrderQuantity: string;
  totalQuantity: string; availability: NonNullable<SupplierProductPayload['availability']>; condition: string;
  colour: string; material: string; style: string; deliveryAvailable: boolean; pickupAvailable: boolean;
  deliveryRadiusKm: string; deliveryFee: string; tags: string; searchTerms: string; imageUrls: string[];
  preferredProduct: boolean; active: boolean; notes: string;
};

export const DEFAULT_SUPPLIER_PRODUCT_FORM: SupplierProductFormValues = {
  productName: '', sku: '', category: 'Other', subcategory: '', brand: '', description: '', marketplaceDescription: '',
  unit: 'Each', costPrice: '', sellingPrice: '', vatPercent: '', leadTimeDays: '', minimumOrderQuantity: '',
  totalQuantity: '', availability: 'Available', condition: '', colour: '', material: '', style: '',
  deliveryAvailable: false, pickupAvailable: true, deliveryRadiusKm: '', deliveryFee: '', tags: '', searchTerms: '',
  imageUrls: [], preferredProduct: false, active: true, notes: '',
};

const numberOrUndefined = (value: string) => value.trim() ? Number(value) : undefined;
const terms = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export function formToSupplierProductPayload(form: SupplierProductFormValues): Omit<SupplierProductPayload, 'organizationId'> {
  return {
    productName: form.productName.trim(), sku: form.sku.trim() || undefined, category: form.category,
    subcategory: form.subcategory.trim() || undefined,
    attributes: { colour: form.colour.trim(), material: form.material.trim(), style: form.style.trim() },
    condition: form.condition.trim() || undefined, brand: form.brand.trim() || undefined,
    description: form.description.trim() || undefined, marketplaceDescription: form.marketplaceDescription.trim() || undefined,
    unit: form.unit, costPrice: Number(form.costPrice), sellingPrice: numberOrUndefined(form.sellingPrice),
    vatPercent: numberOrUndefined(form.vatPercent), leadTimeDays: numberOrUndefined(form.leadTimeDays),
    minimumOrderQuantity: numberOrUndefined(form.minimumOrderQuantity), totalQuantity: numberOrUndefined(form.totalQuantity),
    availability: form.availability, deliveryAvailable: form.deliveryAvailable, pickupAvailable: form.pickupAvailable,
    deliveryRadiusKm: numberOrUndefined(form.deliveryRadiusKm), deliveryFee: numberOrUndefined(form.deliveryFee),
    tags: terms(form.tags), searchTerms: terms(form.searchTerms), imageUrls: form.imageUrls,
    preferredProduct: form.preferredProduct, active: form.active, notes: form.notes.trim() || undefined,
  };
}

export function supplierProductToForm(product: SupplierProductRecord): SupplierProductFormValues {
  const attributes = product.attributes ?? {};
  const text = (value: number | null) => value === null ? '' : String(value);
  return {
    ...DEFAULT_SUPPLIER_PRODUCT_FORM, productName: product.productName, sku: product.sku ?? '', category: product.category,
    subcategory: product.subcategory ?? '', brand: product.brand ?? '', description: product.description ?? '',
    marketplaceDescription: product.marketplaceDescription ?? '', unit: product.unit, costPrice: String(product.costPrice),
    sellingPrice: text(product.sellingPrice), vatPercent: text(product.vatPercent), leadTimeDays: text(product.leadTimeDays),
    minimumOrderQuantity: text(product.minimumOrderQuantity), totalQuantity: text(product.totalQuantity),
    availability: product.availability, condition: product.condition ?? '', colour: attributes.colour ?? '',
    material: attributes.material ?? '', style: attributes.style ?? '', deliveryAvailable: product.deliveryAvailable,
    pickupAvailable: product.pickupAvailable, deliveryRadiusKm: text(product.deliveryRadiusKm), deliveryFee: text(product.deliveryFee),
    tags: product.tags.join(', '), searchTerms: product.searchTerms.join(', '), imageUrls: product.imageUrls,
    preferredProduct: product.preferredProduct, active: product.active, notes: product.notes ?? '',
  };
}
