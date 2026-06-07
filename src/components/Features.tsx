import { useContent } from "../context/ContentContext";

const features = [
  { icon: "🎨", title: "3D Product View", desc: "360° immersive product visualization" },
  { icon: "🔥", title: "Auto Trending", desc: "AI picks hottest products every hour" },
  { icon: "🚚", title: "Direct Shipping", desc: "Ships straight to your customer" },
  { icon: "💳", title: "Secure Checkout", desc: "UPI, Cards, COD all supported" },
  { icon: "📦", title: "Zero Inventory", desc: "Print on each order, no stock needed" },
  { icon: "🌟", title: "Premium Quality", desc: "Top-rated print partners only" },
];

export default function Features() {
  const { content } = useContent();

  return (
    <section id="features" className="py-16 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-[10px] font-semibold mb-3 uppercase tracking-wider">
            Why BhaviX
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
            {content.featuresTitle}
          </h2>
          <p className="text-white/50 text-sm">{content.featuresSubtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group p-4 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] hover:border-violet-400/30 hover:bg-white/[0.06] transition-all duration-300 hover:-translate-y-1 text-center"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-white/5 flex items-center justify-center text-xl mb-2.5 group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-xs mb-1">{f.title}</h3>
              <p className="text-white/40 text-[11px] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
