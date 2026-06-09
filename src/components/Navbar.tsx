import Logo3D from "./Logo3D";

interface Props {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
}

export default function Navbar({ cartCount, onCartClick, onAdminClick }: Props) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-slate-950/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        <Logo3D size="sm" />

        <div className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="#trending" className="hover:text-white transition">Trending</a>
          <a href="#categories" className="hover:text-white transition">Categories</a>
          <a href="#features" className="hover:text-white transition">Features</a>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Button */}
          <button
            onClick={onAdminClick}
            className="hidden sm:flex w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/30 hover:bg-violet-500/20 items-center justify-center text-violet-300 hover:text-violet-200 transition-all"
            title="Admin Panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>

          <button className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 items-center justify-center text-white/80">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>

          <button
            onClick={onCartClick}
            className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all flex items-center gap-2"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center shadow-lg shadow-blue-500/50">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
