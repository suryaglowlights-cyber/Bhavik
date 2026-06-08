// Product and category types for live provider data.
// Dummy product entries have been removed so the site only shows live content.

export interface Product {
  id: string;
  provider: "Printrove" | "Qikink" | "Blinkstore" | "VendorGo";
  providerProductId?: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  originalPrice: number;
  retailPrice?: number;
  wholesaleCost?: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  badge?: string;
  status?: string;
  colors: string[];
}

export const categories = [
  { id: "all", name: "All", icon: "🛍️" },
  { id: "tshirts", name: "T-Shirts", icon: "👕" },
  { id: "hoodies", name: "Hoodies", icon: "🧥" },
  { id: "accessories", name: "Accessories", icon: "🎒" },
  { id: "footwear", name: "Footwear", icon: "👟" },
  { id: "mugs", name: "Mugs", icon: "☕" },
  { id: "bags", name: "Bags", icon: "👜" },
];
