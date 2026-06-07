import { useState } from "react";
import { useContent } from "../context/ContentContext";
import Logo3D from "./Logo3D";
import ContentModal from "./ContentModal";

export default function Footer() {
  const { content } = useContent();
  const [modalPage, setModalPage] = useState<"about" | "contact" | "shipping" | "returns" | null>(null);

  return (
    <>
      <footer className="relative border-t border-white/10 bg-slate-950/60 backdrop-blur-md mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Logo3D size="sm" />
              <p className="text-white/60 text-sm mt-4 max-w-md leading-relaxed">
                {content.heroSubtitle}
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm">Shop</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#trending" className="hover:text-white">Trending</a></li>
                <li><a href="#categories" className="hover:text-white">Categories</a></li>
                <li><a href="#" className="hover:text-white">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white">Best Sellers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <button onClick={() => setModalPage("about")} className="hover:text-white text-left">
                    {content.aboutLabel}
                  </button>
                </li>
                <li>
                  <button onClick={() => setModalPage("contact")} className="hover:text-white text-left">
                    {content.contactLabel}
                  </button>
                </li>
                <li>
                  <button onClick={() => setModalPage("shipping")} className="hover:text-white text-left">
                    {content.shippingLabel}
                  </button>
                </li>
                <li>
                  <button onClick={() => setModalPage("returns")} className="hover:text-white text-left">
                    {content.returnsLabel}
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
            <p>© 2026 {content.logoText}. All rights reserved.</p>
            <div className="flex gap-4">
              <button onClick={() => setModalPage("contact")} className="hover:text-white font-semibold px-3 py-1 rounded bg-white/5">Subscribe</button>
            </div>
          </div>
        </div>
      </footer>

      <ContentModal page={modalPage} onClose={() => setModalPage(null)} />
    </>
  );
}
