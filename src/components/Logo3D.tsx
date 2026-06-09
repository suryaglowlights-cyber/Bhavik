import { useEffect, useState } from "react";
import { useContent } from "../context/ContentContext";

interface Logo3DProps {
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  showText?: boolean;
  layout?: "horizontal" | "vertical";
}

export default function Logo3D({ size = "md", showText = true, layout = "horizontal" }: Logo3DProps) {
  const { content } = useContent();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Thodi delay ke baad animation start hoga taaki smooth lage
    const timer = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const sizes = {
    sm: { box: "w-10 h-10 shrink-0", text: "text-xl md:text-2xl", sub: "text-[0.2em]" },
    md: { box: "w-14 h-14 shrink-0", text: "text-3xl md:text-4xl", sub: "text-[0.25em]" },
    lg: { box: "w-24 h-24 shrink-0", text: "text-5xl md:text-6xl", sub: "text-[0.25em]" },
    xl: { box: "w-40 h-40 shrink-0", text: "text-7xl md:text-8xl", sub: "text-[0.3em]" },
    hero: { box: "w-48 h-48 md:w-64 md:h-64 shrink-0", text: "text-6xl md:text-8xl lg:text-[10rem]", sub: "text-[0.2em] md:text-[0.25em]" },
  };
  const s = sizes[size];

  // Text ko automatic half me todne ka logic taaki left/right se alag alag aaye
  const textVal = content.logoText || "Bhavik";
  const half = Math.ceil(textVal.length / 2);
  const leftText = textVal.substring(0, half);
  const rightText = textVal.substring(half);

  // 3D layers generator (Icon ko mota dikhane ke liye)
  const IconLayer = ({ z = 0, opacity = 1 }) => (
    <div
      className="absolute inset-0 flex items-center justify-center drop-shadow-2xl"
      style={{ transform: `translateZ(${z}px)`, opacity }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>

        {/* Top Orange Arc */}
        <path d="M 22 38 A 38 38 0 0 1 82 25" fill="none" stroke="url(#orangeGrad)" strokeWidth="8" strokeLinecap="round" />

        {/* Bottom Blue Arc */}
        <path d="M 78 62 A 38 38 0 0 1 18 75" fill="none" stroke="url(#blueGrad)" strokeWidth="8" strokeLinecap="round" />

        {/* The Navy B */}
        <text x="56" y="73" fontFamily="system-ui, -apple-system, sans-serif" fontSize="62" fontWeight="900" fill="url(#blueGrad)" textAnchor="middle">
          B
        </text>

        {/* Orange Shopping Cart over the 'B' */}
        <g transform="translate(10, 35) scale(0.65)">
          <path d="M 0 10 L 10 10 L 22 45 L 55 45 L 65 15 L 15 15" fill="none" stroke="url(#orangeGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 20 25 L 60 25 M 22 35 L 56 35 M 35 15 L 35 45 M 48 15 L 48 45" fill="none" stroke="url(#orangeGrad)" strokeWidth="4" />
          <circle cx="28" cy="55" r="5" fill="url(#orangeGrad)" />
          <circle cx="50" cy="55" r="5" fill="url(#orangeGrad)" />
        </g>
      </svg>
    </div>
  );

  return (
    <div className={`flex ${layout === "vertical" ? "flex-col" : "flex-row"} items-center justify-center gap-3 md:gap-5 group select-none`}>
      {/* 1. Upar Ka Rotating Logo Icon */}
      <div className={`relative ${s.box} [perspective:1000px]`}>
        <div className="relative w-full h-full [transform-style:preserve-3d] animate-spin-slow hover:[animation-duration:4s]">
          <IconLayer z={10} opacity={0.9} />
          <IconLayer z={6} opacity={0.7} />
          <IconLayer z={3} opacity={0.5} />
          <IconLayer z={0} opacity={1} />
          <IconLayer z={-3} opacity={0.5} />
          <IconLayer z={-6} opacity={0.7} />
          <IconLayer z={-10} opacity={0.9} />
        </div>
      </div>

      {/* 2. Niche ka Animated Text */}
      {showText && (
        <div className={`flex flex-col items-${layout === "vertical" ? "center" : "start"} justify-center overflow-visible`}>
          <div className={`flex items-center overflow-hidden font-black tracking-tight leading-none ${s.text} py-2`}>
            {/* Left part (Bha) */}
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 transition-transform duration-1000 ease-out ${
                animate ? "translate-x-0" : "-translate-x-[150%]"
              }`}
              style={{ textShadow: size === "hero" ? "0 10px 40px rgba(234,88,12,0.3)" : "none" }}
            >
              {leftText}
            </span>
            {/* Right part (vik) */}
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-600 transition-transform duration-1000 ease-out ${
                animate ? "translate-x-0" : "translate-x-[150%]"
              }`}
              style={{ textShadow: size === "hero" ? "0 10px 40px rgba(37,99,235,0.3)" : "none" }}
            >
              {rightText}
            </span>
          </div>
          
          {/* Subtext Fade In (Shop More, Live Better) */}
          <div className="relative flex items-center gap-2 mt-1">
            <div className={`h-px bg-orange-500/50 transition-all duration-1000 delay-700 ${animate ? "w-6 md:w-10 opacity-100" : "w-0 opacity-0"}`} />
            <span
              className={`text-white/60 ${s.sub} tracking-[0.25em] uppercase font-bold transition-opacity duration-1000 delay-500 ${
                animate ? "opacity-100" : "opacity-0"
              }`}
            >
              {content.logoSubtext}
            </span>
            <div className={`h-px bg-orange-500/50 transition-all duration-1000 delay-700 ${animate ? "w-6 md:w-10 opacity-100" : "w-0 opacity-0"}`} />
          </div>
        </div>
      )}
    </div>
  );
}
