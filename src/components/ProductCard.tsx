import { useState } from "react";
import type { Product } from "../data/products";

interface Props {
  product: Product;
  onAdd: (p: Product) => void;
}

export default function ProductCard({ product, onAdd }: Props) {
  const [hovered, setHovered] = useState(false);
  const discount = Math.round(
    ((product.originalPrice - product.price) / product.originalPrice) * 100
  );

  return (
    <div
      className="group relative [perspective:1500px]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`relative bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/10 transition-all duration-500 [transform-style:preserve-3d] ${
          hovered
            ? "[transform:rotateY(-8deg)_rotateX(4deg)_translateZ(20px)] shadow-[0_30px_60px_-20px_rgba(168,85,247,0.5)]"
            : "shadow-xl"
        }`}
      >
        {/* Glow ring */}
        <div className="absolute -inset-px rounded-3xl bg-gradient-to-r from-violet-500/0 via-fuchsia-500/0 to-cyan-500/0 group-hover:from-violet-500/40 group-hover:via-fuchsia-500/40 group-hover:to-cyan-500/40 transition-all duration-500 -z-10 blur-xl" />

        {/* Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {product.badge && (
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg shadow-fuchsia-500/50 backdrop-blur">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 shadow-lg">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Provider badge */}
        <div className="absolute top-3 right-3 z-20">
          <span className="px-2 py-1 text-[10px] font-semibold rounded-md bg-black/60 text-white/80 backdrop-blur border border-white/10">
            via {product.provider}
          </span>
        </div>

        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-violet-900/30 to-cyan-900/30">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-all duration-700 ${
              hovered ? "scale-110 rotate-2" : "scale-100"
            }`}
          />
          {/* Floating action button */}
          <button
            onClick={() => onAdd(product)}
            className={`absolute bottom-4 right-4 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-2xl shadow-fuchsia-500/50 flex items-center justify-center transition-all duration-500 hover:scale-110 ${
              hovered
                ? "[transform:translateZ(40px)] opacity-100"
                : "opacity-0 translate-y-4"
            }`}
            aria-label="Add to cart"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-cyan-300/80 font-semibold">
              {product.category}
            </span>
            <div className="flex items-center gap-1 text-amber-400 text-sm">
              <span>★</span>
              <span className="text-white/90 font-medium">{product.rating}</span>
              <span className="text-white/40 text-xs">({product.reviews})</span>
            </div>
          </div>
          <h3 className="font-bold text-white text-lg leading-tight line-clamp-2 min-h-[3.5rem]">
            {product.name}
          </h3>

          {/* Color swatches */}
          <div className="flex gap-1.5">
            {product.colors.map((c, i) => (
              <span
                key={i}
                className="w-5 h-5 rounded-full border-2 border-white/20 shadow-inner"
                style={{ background: c }}
              />
            ))}
          </div>

          <div className="flex items-end justify-between pt-1">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                  ₹{product.price}
                </span>
                <span className="text-sm text-white/40 line-through">
                  ₹{product.originalPrice}
                </span>
              </div>
            </div>
            <button
              onClick={() => onAdd(product)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-gradient-to-r hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-semibold border border-white/10 transition-all"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
