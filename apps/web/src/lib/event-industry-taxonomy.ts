import { enrichProductDiscovery } from './event-product-intelligence';
import type { SupplierProductCategory } from './supplier-products-types';

export const EVENT_INDUSTRY_TAXONOMY: Record<SupplierProductCategory, string[]> = {
  Equipment: ['Furniture', 'Tables', 'Chairs', 'Lounge furniture', 'Bars and counters', 'Staging', 'Dance floors', 'Tents and marquees', 'Heating and cooling', 'Generators and power', 'Catering equipment', 'Tools and event equipment'],
  Service: ['Event planning', 'Coordination', 'Staffing', 'Security', 'Entertainment', 'Photography', 'Videography', 'Hair and makeup', 'Cleaning', 'Waste management', 'Setup and breakdown', 'Technical production'],
  Consumable: ['Candles', 'Confetti', 'Disposable tableware', 'Cleaning consumables', 'Fuel and gas', 'Packaging', 'Guest amenities'],
  Material: ['Linen', 'Table runners', 'Fabric and draping', 'Carpets and flooring', 'Artificial grass', 'Backdrops', 'Building and fabrication materials'],
  Lighting: ['Ambient lighting', 'Decorative lighting', 'Stage lighting', 'Outdoor lighting', 'Festoon and fairy lights', 'Chandeliers', 'LED and intelligent lighting', 'Lighting control'],
  AudioVisual: ['Sound systems', 'Microphones', 'DJ equipment', 'Screens and projectors', 'LED walls', 'Cameras', 'Streaming', 'Conferencing', 'Rigging', 'Technical accessories'],
  Decor: ['Floral arrangements', 'Fresh flowers', 'Artificial flowers', 'Centrepieces', 'Vases and vessels', 'Plinths and pedestals', 'Arches and structures', 'Signage decor', 'Props', 'Candles and holders', 'Table decor', 'Themed decor', 'Balloons', 'Stationery decor'],
  Catering: ['Caterers', 'Beverages', 'Bar service', 'Crockery', 'Cutlery', 'Glassware', 'Underplates', 'Serving ware', 'Buffet equipment', 'Kitchen equipment', 'Coffee and tea', 'Cakes and desserts'],
  Venue: ['Wedding venue', 'Conference venue', 'Hotel', 'Restaurant', 'Outdoor venue', 'Private estate', 'Community hall', 'Exhibition venue', 'Sports venue', 'Virtual venue'],
  Transport: ['Delivery', 'Collection', 'Guest transport', 'Bridal transport', 'Luxury vehicles', 'Shuttles', 'Freight', 'Warehousing', 'Courier', 'Logistics coordination'],
  Printing: ['Invitations', 'Menus', 'Place cards', 'Seating plans', 'Banners', 'Large-format printing', 'Vinyl and decals', 'Directional signage', 'Branding', 'Promotional items'],
  Other: ['Venue compliance', 'Permits', 'Insurance', 'Accommodation', 'Childcare', 'Pet care', 'Specialist supplier', 'Other'],
};

export type ProductSuggestionInput = {
  productName: string;
  category: SupplierProductCategory;
  subcategory: string;
  colour: string;
  material: string;
  style: string;
};

export function suggestProductDiscovery(input: ProductSuggestionInput) {
  return enrichProductDiscovery(input);
}
