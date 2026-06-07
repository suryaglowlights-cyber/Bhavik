import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface SiteContent {
  // Brand
  logoText: string;
  logoSubtext: string;
  heroTitle1: string;
  heroTitle2: string;
  heroSubtitle: string;
  ctaButton1: string;
  ctaButton2: string;

  // Features
  featuresTitle: string;
  featuresSubtitle: string;

  // Trending
  trendingTitle: string;
  trendingSubtitle: string;

  // Footer pages
  aboutContent: string;
  contactContent: string;
  shippingContent: string;
  returnsContent: string;

  // Footer links labels
  aboutLabel: string;
  contactLabel: string;
  shippingLabel: string;
  returnsLabel: string;
}

const defaultContent: SiteContent = {
  logoText: "Bhavik",
  logoSubtext: "SHOP MORE, LIVE BETTER",
  heroTitle1: "Welcome to",
  heroTitle2: "Bhavik",
  heroSubtitle:
    "India's first 3D shopping experience with auto-trending products powered by Printrove, Qikink, Blinkstore & VendorGo.",
  ctaButton1: "🔥 Shop Trending Now",
  ctaButton2: "Explore Features →",
  featuresTitle: "Built for the Future of Shopping",
  featuresSubtitle: "Why thousands of sellers trust Bhavik",
  trendingTitle: "🔥 Trending Right Now",
  trendingSubtitle: "Hand-picked by our AI based on real-time sales & reviews.",
  aboutContent:
    "Bhavik is India's first 3D-experience print-on-demand ecommerce platform. We connect sellers with India's top POD providers — Printrove, Qikink, Blinkstore, and VendorGo — to offer a seamless, zero-inventory selling experience.\n\nOur mission is to make ecommerce accessible to everyone. No inventory, no shipping hassles, no upfront costs. Just design, list, and sell.\n\nFounded in 2026, Bhavik has grown to serve over 50,000 happy buyers and 10,000+ products across categories like T-shirts, Hoodies, Mugs, Phone Cases, and more.",
  contactContent:
    "📧 Email: support@bhavik.com\n📞 Phone: +91-98765-43210\n🏢 Address: Bhavik HQ, Sector 62, Noida, UP, India - 201301\n\n🕐 Support Hours: Mon-Sat, 10 AM - 7 PM IST\n\nFor API integration support, contact our developer team at dev@bhavik.com",
  shippingContent:
    "🚚 Free Shipping on orders above ₹499\n\n📦 Standard Delivery: 3-5 business days\n⚡ Express Delivery: 1-2 business days (₹99 extra)\n\n🌍 We ship across India including metro cities, tier-2 & tier-3 towns.\n\nAll orders are printed on-demand and shipped directly from our partner facilities. Tracking details are sent via SMS and email within 24 hours of dispatch.",
  returnsContent:
    "↩️ Easy 7-Day Returns\n\n✅ Damaged or wrong product? Full refund, no questions asked.\n✅ Size issue? Free exchange available.\n✅ Changed your mind? Store credit issued.\n\n📌 To initiate a return:\n1. Go to My Orders\n2. Select the item\n3. Click 'Return/Exchange'\n4. Our team will arrange pickup within 48 hours\n\nRefunds are processed within 5-7 business days to your original payment method.",
  aboutLabel: "About",
  contactLabel: "Contact",
  shippingLabel: "Shipping",
  returnsLabel: "Returns",
};

interface ContentContextType {
  content: SiteContent;
  updateContent: (key: keyof SiteContent, value: string) => void;
  resetContent: () => void;
}

const ContentContext = createContext<ContentContextType | null>(null);

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(() => {
    const saved = localStorage.getItem("bhavix_content");
    return saved ? JSON.parse(saved) : defaultContent;
  });

  useEffect(() => {
    localStorage.setItem("bhavix_content", JSON.stringify(content));
  }, [content]);

  const updateContent = (key: keyof SiteContent, value: string) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  };

  const resetContent = () => {
    setContent(defaultContent);
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, resetContent }}>
      {children}
    </ContentContext.Provider>
  );
}
