const providers = [
  {
    name: "Printrove",
    desc: "India's largest print-on-demand platform. T-shirts, hoodies, mugs & more shipped directly to customers.",
    color: "from-violet-500 to-purple-600",
    icon: "🖨️",
    features: ["No inventory", "White-label shipping", "100+ products"],
  },
  {
    name: "Qikink",
    desc: "End-to-end POD & dropshipping. High-quality printing with same-day dispatch options.",
    color: "from-fuchsia-500 to-pink-600",
    icon: "⚡",
    features: ["Same-day dispatch", "Bulk discounts", "API integration"],
  },
  {
    name: "Blinkstore",
    desc: "Modern POD platform with seamless integrations. Perfect for creators and small businesses.",
    color: "from-cyan-500 to-blue-600",
    icon: "💎",
    features: ["Easy setup", "Global shipping", "Designer tools"],
  },
  {
    name: "VendorGo",
    desc: "Multi-vendor marketplace connector. Sell products from multiple vendors under one roof.",
    color: "from-emerald-500 to-teal-600",
    icon: "🚀",
    features: ["Multi-vendor", "Auto sync", "Smart routing"],
  },
];

export default function Providers() {
  return (
    <section id="providers" className="py-24 px-4 md:px-6 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-400/30 text-violet-300 text-xs font-semibold mb-4 uppercase tracking-wider">
            Powered By
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            4 Powerful{" "}
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              POD Providers
            </span>
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Auto-synced inventory, instant order routing, and zero-touch fulfillment from India's top print-on-demand services.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {providers.map((p, i) => (
            <div
              key={i}
              className="group relative [perspective:1000px]"
            >
              <div className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(-6deg)_rotateX(6deg)_translateZ(10px)] group-hover:border-white/30 group-hover:shadow-2xl">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-3xl mb-4 shadow-xl [transform:translateZ(20px)]`}>
                  {p.icon}
                </div>
                <h3 className="text-xl font-black text-white mb-2">{p.name}</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-4">{p.desc}</p>
                <ul className="space-y-1.5">
                  {p.features.map((f, j) => (
                    <li key={j} className="text-xs text-cyan-300/80 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-cyan-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    API Connected
                  </span>
                  <span className="text-xs text-white/40">v1.0</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
