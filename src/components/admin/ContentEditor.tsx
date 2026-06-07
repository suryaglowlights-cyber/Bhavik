import { useState } from "react";
import { useContent, type SiteContent } from "../../context/ContentContext";

type SectionKey =
  | "brand"
  | "hero"
  | "features"
  | "trending"
  | "footerPages"
  | "footerLabels";

const sections: { key: SectionKey; label: string; icon: string }[] = [
  { key: "brand", label: "Brand Identity", icon: "🏷️" },
  { key: "hero", label: "Hero Section", icon: "🖼️" },
  { key: "features", label: "Features Section", icon: "✨" },
  { key: "trending", label: "Trending Section", icon: "🔥" },
  { key: "footerPages", label: "Footer Pages", icon: "📄" },
  { key: "footerLabels", label: "Footer Labels", icon: "🏷️" },
];

const fieldGroups: Record<
  SectionKey,
  { key: keyof SiteContent; label: string; type: "text" | "textarea"; rows?: number }[]
> = {
  brand: [
    { key: "logoText", label: "Logo Text", type: "text" },
    { key: "logoSubtext", label: "Logo Subtext", type: "text" },
  ],
  hero: [
    { key: "heroTitle1", label: "Hero Title Line 1", type: "text" },
    { key: "heroTitle2", label: "Hero Title Line 2", type: "text" },
    { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea", rows: 3 },
    { key: "ctaButton1", label: "CTA Button 1 Text", type: "text" },
    { key: "ctaButton2", label: "CTA Button 2 Text", type: "text" },
  ],
  features: [
    { key: "featuresTitle", label: "Features Section Title", type: "text" },
    { key: "featuresSubtitle", label: "Features Subtitle", type: "text" },
  ],
  trending: [
    { key: "trendingTitle", label: "Trending Section Title", type: "text" },
    { key: "trendingSubtitle", label: "Trending Subtitle", type: "textarea", rows: 2 },
  ],
  footerPages: [
    { key: "aboutContent", label: "About Page Content", type: "textarea", rows: 8 },
    { key: "contactContent", label: "Contact Page Content", type: "textarea", rows: 8 },
    { key: "shippingContent", label: "Shipping Page Content", type: "textarea", rows: 8 },
    { key: "returnsContent", label: "Returns Page Content", type: "textarea", rows: 8 },
  ],
  footerLabels: [
    { key: "aboutLabel", label: "About Link Label", type: "text" },
    { key: "contactLabel", label: "Contact Link Label", type: "text" },
    { key: "shippingLabel", label: "Shipping Link Label", type: "text" },
    { key: "returnsLabel", label: "Returns Link Label", type: "text" },
  ],
};

export default function ContentEditor() {
  const { content, updateContent, resetContent } = useContent();
  const [activeSection, setActiveSection] = useState<SectionKey>("brand");
  const [saved, setSaved] = useState(false);

  const handleChange = (key: keyof SiteContent, value: string) => {
    updateContent(key, value);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields = fieldGroups[activeSection];

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
              activeSection === s.key
                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-lg"
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
            }`}
          >
            <span className="mr-1.5">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Editor Panel */}
      <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {sections.find((s) => s.key === activeSection)?.icon}{" "}
            {sections.find((s) => s.key === activeSection)?.label}
          </h3>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                ✅ Saved
              </span>
            )}
            <button
              onClick={resetContent}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 hover:text-white transition-all"
            >
              ↺ Reset All
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm text-white/70 mb-2 font-medium flex items-center justify-between">
                <span>{field.label}</span>
                <span className="text-[10px] text-white/30 font-normal">
                  {(content[field.key] as string).length} chars
                </span>
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={content[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={field.rows || 4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm leading-relaxed resize-y"
                />
              ) : (
                <input
                  type="text"
                  value={content[field.key] as string}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSave}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-fuchsia-500/30 hover:shadow-fuchsia-500/50 transition-all"
          >
            💾 Save Changes
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
          👁️ Live Preview — {sections.find((s) => s.key === activeSection)?.label}
        </h4>
        <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-2">
          {fields.map((field) => (
            <div key={field.key}>
              <span className="text-[10px] text-white/30 uppercase tracking-wider">{field.label}</span>
              <p className="text-sm text-white/80 mt-0.5">
                {(content[field.key] as string) || "(empty)"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
