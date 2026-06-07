import type { Product } from "../data/products";

interface CartItem extends Product {
  qty: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  onQty: (id: string, delta: number) => void;
}

export default function CartDrawer({ open, onClose, items, onRemove, onQty }: Props) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-gradient-to-b from-slate-950 to-slate-900 border-l border-white/10 z-[70] shadow-2xl transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            🛒 Your Cart
            <span className="text-xs text-cyan-300">({items.length})</span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-200px)] p-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🛍️</div>
              <p className="text-white/60">Your cart is empty</p>
              <p className="text-white/40 text-sm mt-2">Add some trending products!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm line-clamp-2">{item.name}</h4>
                  <p className="text-[10px] text-cyan-300/70 mt-0.5">via {item.provider}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1">
                      <button
                        onClick={() => onQty(item.id, -1)}
                        className="w-6 h-6 rounded bg-white/10 text-white text-sm"
                      >
                        −
                      </button>
                      <span className="text-white text-sm w-6 text-center">{item.qty}</span>
                      <button
                        onClick={() => onQty(item.id, 1)}
                        className="w-6 h-6 rounded bg-white/10 text-white text-sm"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-violet-300 font-bold">₹{item.price * item.qty}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-white/40 hover:text-red-400 text-sm self-start"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-slate-950/95 backdrop-blur border-t border-white/10 space-y-3">
          <div className="flex justify-between text-white">
            <span className="text-white/60">Total:</span>
            <span className="text-2xl font-black bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
              ₹{total}
            </span>
          </div>
          <button
            disabled={items.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-fuchsia-500/40 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-fuchsia-500/60 transition-all"
          >
            Checkout via Provider →
          </button>
        </div>
      </aside>
    </>
  );
}
