import { useEffect, useMemo, useState } from "react";
import { useContent } from "../context/ContentContext";
import { products as demoProducts, categories, type Product } from "../data/products";
import ProductCard from "./ProductCard";

interface Props {
  onAdd: (p: Product) => void;
}

export default function TrendingSection({ onAdd }: Props) {
  const { content } = useContent();
  const [activeCat, setActiveCat] = useState("all");
  const [items, setItems] = useState<Product[]>(demoProducts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const sorted = [...demoProducts].sort(
        (a, b) => b.rating * b.reviews - a.rating * a.reviews
      );
      setItems(sorted);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => [...prev].sort(() => Math.random() - 0.5));
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    if (activeCat === "all") return items;
    return items.filter(
      (p) => p.category.toLowerCase() === activeCat.toLowerCase()
    );
  }, [items, activeCat]);

  return (
    <section id="trending" className="py-20 px-4 md:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-400/30 text-fuchsia-300 text-xs font-semibold mb-3 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
              Auto-Updated Live
            </div>
            <h2 id="categories" className="text-4xl md:text-5xl font-black text-white">
              {content.trendingTitle}
            </h2>
            <p className="text-white/60 mt-2">{content.trendingSubtitle}</p>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.name === "All" ? "all" : c.name)}
              className={`shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold border transition-all ${
                (activeCat === "all" && c.id === "all") || activeCat === c.name
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-lg shadow-fuchsia-500/30"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="mr-1.5">{c.icon}</span>
              {c.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-3xl bg-white/5 animate-pulse border border-white/5"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/50">
            No products in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} onAdd={onAdd} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
