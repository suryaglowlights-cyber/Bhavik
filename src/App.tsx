import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ApiKeysProvider } from "./context/ApiKeysContext";
import { ContentProvider } from "./context/ContentContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import TrendingSection from "./components/TrendingSection";
import Features from "./components/Features";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import CheckoutDrawer from "./components/CheckoutDrawer";
import LoginPage from "./components/admin/LoginPage";
import AdminDashboard from "./components/admin/AdminDashboard";
import type { Product } from "./data/products";

interface CartItem extends Product {
  qty: number;
}

type Page = "home" | "admin-login" | "admin-dashboard";

function AppContent() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState<Page>("home");
  const { isLoggedIn } = useAuth();

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === p.id);
      if (found) {
        return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...p, qty: 1 }];
    });
    setToast(`✓ ${p.name.slice(0, 30)}... added to cart`);
    setTimeout(() => setToast(null), 2200);
  };

  const removeFromCart = (id: string) =>
    setCart((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id: string, delta: number) =>
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0)
    );

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleAdminClick = () => {
    if (isLoggedIn) {
      setPage("admin-dashboard");
    } else {
      setPage("admin-login");
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setToast("Add at least one item before checkout.");
      setTimeout(() => setToast(null), 2200);
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const handleOrderSuccess = (orderId: string, paymentMethod: string) => {
    setCart([]);
    setCheckoutOpen(false);
    setToast(`Order placed! ${paymentMethod} selected. ID: ${orderId}`);
    setTimeout(() => setToast(null), 3200);
  };

  if (page === "admin-login") {
    return <LoginPage onLogin={() => setPage("admin-dashboard")} />;
  }

  if (page === "admin-dashboard") {
    return <AdminDashboard onBack={() => setPage("home")} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-fuchsia-500/40 overflow-x-hidden">
      {/* Animated background grid */}
      <div
        className="fixed inset-0 -z-20 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Star particles */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.6 + 0.2,
            }}
          />
        ))}
      </div>

      <Navbar
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onAdminClick={handleAdminClick}
      />
      <main>
        <Hero />
        <TrendingSection onAdd={addToCart} />
        <Features />
      </main>
      <Footer />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onRemove={removeFromCart}
        onQty={updateQty}
        onCheckout={handleCheckout}
      />

      <CheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart}
        onSuccess={handleOrderSuccess}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold shadow-2xl shadow-fuchsia-500/40 animate-slide-up">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ApiKeysProvider>
        <ContentProvider>
          <AppContent />
        </ContentProvider>
      </ApiKeysProvider>
    </AuthProvider>
  );
}
