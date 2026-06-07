// Trending products data - In production, this will auto-fetch from
// Printrove / Qikink / Blinkstore / VendorGo APIs

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviews: number;
  trending: boolean;
  badge?: string;
  provider: "Printrove" | "Qikink" | "Blinkstore" | "VendorGo";
  colors: string[];
}

// Auto-trending logic: products sorted by reviews × rating
export const products: Product[] = [
  {
    id: "p1",
    name: "Cosmic Galaxy Oversized T-Shirt",
    category: "T-Shirts",
    price: 599,
    originalPrice: 1299,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
    rating: 4.8,
    reviews: 2341,
    trending: true,
    badge: "🔥 Bestseller",
    provider: "Printrove",
    colors: ["#000", "#fff", "#7c3aed"],
  },
  {
    id: "p2",
    name: "Neon Cyberpunk Hoodie",
    category: "Hoodies",
    price: 1299,
    originalPrice: 2499,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
    rating: 4.9,
    reviews: 1876,
    trending: true,
    badge: "⚡ Trending",
    provider: "Qikink",
    colors: ["#000", "#1e293b", "#7c3aed"],
  },
  {
    id: "p3",
    name: "Anime Aesthetic Phone Case",
    category: "Accessories",
    price: 299,
    originalPrice: 699,
    image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=600&q=80",
    rating: 4.7,
    reviews: 3201,
    trending: true,
    badge: "💎 Hot",
    provider: "Blinkstore",
    colors: ["#ec4899", "#06b6d4", "#000"],
  },
  {
    id: "p4",
    name: "3D Holographic Sneakers",
    category: "Footwear",
    price: 2499,
    originalPrice: 4999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    rating: 4.9,
    reviews: 4523,
    trending: true,
    badge: "🚀 Top Pick",
    provider: "VendorGo",
    colors: ["#fff", "#000", "#ef4444"],
  },
  {
    id: "p5",
    name: "Minimalist Coffee Mug",
    category: "Mugs",
    price: 249,
    originalPrice: 499,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80",
    rating: 4.6,
    reviews: 1543,
    trending: true,
    provider: "Printrove",
    colors: ["#fff", "#000"],
  },
  {
    id: "p6",
    name: "Vintage Retro Cap",
    category: "Accessories",
    price: 449,
    originalPrice: 899,
    image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80",
    rating: 4.5,
    reviews: 987,
    trending: false,
    provider: "Qikink",
    colors: ["#000", "#92400e", "#1e293b"],
  },
  {
    id: "p7",
    name: "Gradient Sunset Tote Bag",
    category: "Bags",
    price: 399,
    originalPrice: 799,
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600&q=80",
    rating: 4.7,
    reviews: 1234,
    trending: true,
    badge: "🌟 New",
    provider: "Blinkstore",
    colors: ["#f97316", "#ec4899", "#7c3aed"],
  },
  {
    id: "p8",
    name: "Premium Streetwear Joggers",
    category: "Bottoms",
    price: 999,
    originalPrice: 1999,
    image: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600&q=80",
    rating: 4.8,
    reviews: 2876,
    trending: true,
    badge: "🔥 Bestseller",
    provider: "VendorGo",
    colors: ["#000", "#374151", "#7c3aed"],
  },
];

export const categories = [
  { id: "all", name: "All", icon: "🛍️" },
  { id: "tshirts", name: "T-Shirts", icon: "👕" },
  { id: "hoodies", name: "Hoodies", icon: "🧥" },
  { id: "accessories", name: "Accessories", icon: "🎒" },
  { id: "footwear", name: "Footwear", icon: "👟" },
  { id: "mugs", name: "Mugs", icon: "☕" },
  { id: "bags", name: "Bags", icon: "👜" },
];
