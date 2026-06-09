import { useContent } from "../context/ContentContext";
import Logo3D from "./Logo3D";

export default function Hero() {
  const { content } = useContent();

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-12">
      {/* Animated 3D background blobs updated for Orange/Blue theme */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-orange-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full bg-blue-600/20 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      {/* Floating 3D geometric shapes */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float opacity-60"
            style={{
              left: `${10 + i * 15}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${6 + i}s`,
            }}
          >
            <div
              className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-500/30 to-blue-400/30 backdrop-blur-md border border-white/20 shadow-2xl"
              style={{
                transform: `rotate(${i * 45}deg) perspective(400px) rotateY(${i * 20}deg)`,
              }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <div className="mb-10">
          <span className="block text-xs md:text-sm font-semibold uppercase tracking-[0.55em] text-orange-300/90 mb-5 hero-welcome">
            {content.heroTitle1}
          </span>

          <div className="relative inline-flex items-center justify-center mx-auto">
            <div className="absolute inset-x-0 top-1/2 h-24 bg-gradient-to-r from-orange-500/15 via-fuchsia-500/10 to-cyan-500/15 blur-3xl" />
            <h1 className="relative text-6xl md:text-[5.8rem] lg:text-[7rem] font-black leading-[0.95] tracking-[-0.05em] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-fuchsia-400 to-cyan-400 hero-title">
              {content.heroTitle2}
            </h1>
          </div>

          <p className="mt-6 text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed hero-subtitle">
            {content.heroSubtitle}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-white/80 tracking-wide">
            Live · Auto-Trending Products · Updated Every Hour
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a
            href="#trending"
            className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/70 transition-all hover:scale-105"
          >
            <span className="relative z-10">{content.ctaButton1}</span>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
          <a
            href="#features"
            className="px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
          >
            {content.ctaButton2}
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mt-16 max-w-3xl mx-auto">
          {[
            { v: "10K+", l: "Products" },
            { v: "4.9★", l: "Rating" },
            { v: "50K+", l: "Happy Buyers" },
          ].map((s, i) => (
            <div
              key={i}
              className="p-4 md:p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-orange-400/50 transition-all hover:[transform:translateY(-4px)]"
            >
              <div className="text-2xl md:text-4xl font-black bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
                {s.v}
              </div>
              <div className="text-xs md:text-sm text-white/60 mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
