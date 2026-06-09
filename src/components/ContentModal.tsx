import { useContent } from "../context/ContentContext";

interface Props {
  page: "about" | "contact" | "shipping" | "returns" | null;
  onClose: () => void;
}

export default function ContentModal({ page, onClose }: Props) {
  const { content } = useContent();

  if (!page) return null;

  const config = {
    about: { title: content.aboutLabel, body: content.aboutContent },
    contact: { title: content.contactLabel, body: content.contactContent },
    shipping: { title: content.shippingLabel, body: content.shippingContent },
    returns: { title: content.returnsLabel, body: content.returnsContent },
  };

  const { title, body } = config[page];

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-[70] px-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto">
            <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {body}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium border border-white/10 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
