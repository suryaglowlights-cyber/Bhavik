import { useMemo, useState } from "react";
import type { Product } from "../data/products";
import { placeOrder } from "../lib/api";

type CheckoutStep = "details" | "payment" | "confirmation";

interface CartItem extends Product {
  qty: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: (orderId: string, paymentMethod: string) => void;
}

const shippingRates = {
  standard: 0,
  express: 99,
  priority: 149,
};

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  shippingMethod: "standard",
  paymentMethod: "COD",
  paymentReference: "",
};

export default function CheckoutDrawer({
  open,
  onClose,
  items,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<CheckoutStep>("details");
  const [form, setForm] = useState(() => ({ ...initialForm }));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items]
  );

  const shippingCost = shippingRates[form.shippingMethod as keyof typeof shippingRates];
  const total = subtotal + shippingCost;
  const providers = useMemo(
    () => Array.from(new Set(items.map((item) => item.provider))),
    [items]
  );

  const isDetailsValid =
    form.fullName.trim().length > 2 &&
    form.phone.trim().length >= 10 &&
    form.address.trim().length > 5 &&
    form.city.trim().length > 1 &&
    form.state.trim().length > 1 &&
    form.pincode.trim().length >= 5;

  const isPaymentValid =
    form.paymentMethod === "COD" || form.paymentReference.trim().length > 5;

  const reset = () => {
    setForm({ ...initialForm });
    setStep("details");
    setOrderId(null);
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setError("Add at least one product to continue.");
      return;
    }
    if (!isPaymentValid) {
      setError("Please enter payment details for online checkout.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const orderPromises = providers.map((provider) => {
        const providerItems = items
          .filter((item) => item.provider === provider)
          .map((item) => ({
            product_id: item.id,
            name: item.name,
            quantity: item.qty,
            unit_price: item.price,
          }));

        return placeOrder(provider, {
          customer: {
            name: form.fullName,
            phone: form.phone,
            email: form.email,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          shipping: {
            method: form.shippingMethod,
            price: shippingCost,
          },
          payment: {
            method: form.paymentMethod,
            reference: form.paymentReference || "COD",
          },
          items: providerItems,
          metadata: {
            source: "Bhavik Website",
            provider,
          },
        });
      });

      const results = await Promise.all(orderPromises);
      const firstOrder = results[0];
      const generatedId = firstOrder?.orderId || `BHAVIK-${Date.now()}`;
      setOrderId(generatedId);
      setStep("confirmation");
      onSuccess(generatedId, form.paymentMethod);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while placing your order. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />
      <aside
        className={`fixed top-0 right-0 h-full w-full sm:w-[520px] bg-gradient-to-b from-slate-950 to-slate-900 border-l border-white/10 z-[80] shadow-2xl transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-white">Checkout</h2>
            <p className="text-sm text-white/50">Complete your order with shipping & payment.</p>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white"
          >
            ✕
          </button>
        </div>

        <div className="h-[calc(100%-200px)] overflow-y-auto p-5 space-y-5">
          {items.length === 0 ? (
            <div className="text-center py-20 text-white/60">
              <div className="text-5xl mb-4">🛍️</div>
              <p>Your cart is empty.</p>
              <p className="mt-2 text-sm text-white/40">Add products from trending items to checkout.</p>
            </div>
          ) : step === "confirmation" ? (
            <div className="space-y-6 text-white">
              <div className="rounded-3xl bg-white/5 border border-white/10 p-6 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold mb-2">Order Confirmed!</h3>
                <p className="text-white/60 mb-3">Your order is now in production and shipping.</p>
                <p className="text-sm text-white/50">Order ID: <span className="font-semibold text-white">{orderId}</span></p>
                <p className="mt-3 text-white/60">Delivery will be started within 24 hours.</p>
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-3">
                <div className="flex items-center justify-between text-white/60">
                  <span>Items</span>
                  <span>{items.length} products</span>
                </div>
                <div className="flex items-center justify-between text-white/60">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
                </div>
                <div className="flex items-center justify-between text-white font-semibold text-lg">
                  <span>Total Paid</span>
                  <span>₹{total}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-cyan-300 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-300" />
                  {step === "details" ? "Shipping details" : "Payment method"}
                </div>
                {step === "details" ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <label className="space-y-2 text-sm text-white/60">
                        Full name
                        <input
                          value={form.fullName}
                          onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                          className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400"
                          placeholder="Amit Sharma"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-white/60">
                        Phone
                        <input
                          value={form.phone}
                          onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400"
                          placeholder="9876543210"
                          inputMode="tel"
                        />
                      </label>
                    </div>
                    <label className="space-y-2 text-sm text-white/60">
                      Email
                      <input
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400"
                        placeholder="amit@domain.com"
                        type="email"
                      />
                    </label>
                    <label className="space-y-2 text-sm text-white/60">
                      Delivery address
                      <textarea
                        value={form.address}
                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                        className="w-full min-h-[100px] rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400 resize-none"
                        placeholder="Flat 102, Tower B, Sector 62, Noida"
                      />
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <label className="space-y-2 text-sm text-white/60">
                        City
                        <input
                          value={form.city}
                          onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                          className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400"
                          placeholder="Noida"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-white/60">
                        State
                        <input
                          value={form.state}
                          onChange={(e) => setForm((prev) => ({ ...prev, state: e.target.value }))}
                          className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400"
                          placeholder="Uttar Pradesh"
                        />
                      </label>
                      <label className="space-y-2 text-sm text-white/60">
                        PIN code
                        <input
                          value={form.pincode}
                          onChange={(e) => setForm((prev) => ({ ...prev, pincode: e.target.value }))}
                          className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400"
                          placeholder="201301"
                          inputMode="numeric"
                        />
                      </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { id: "standard", label: "Standard (Free)" },
                        { id: "express", label: "Express (+₹99)" },
                        { id: "priority", label: "Priority (+₹149)" },
                      ].map((option) => (
                        <button
                          type="button"
                          key={option.id}
                          onClick={() => setForm((prev) => ({ ...prev, shippingMethod: option.id }))}
                          className={`rounded-2xl border px-4 py-3 text-sm text-left transition-all ${
                            form.shippingMethod === option.id
                              ? "bg-violet-500/20 border-violet-400 text-white"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: "COD", label: "Cash on Delivery" },
                        { id: "Online", label: "Online Payment" },
                      ].map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-all ${
                            form.paymentMethod === option.id
                              ? "border-violet-400 bg-violet-500/10"
                              : "border-white/10 bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={option.id}
                            checked={form.paymentMethod === option.id}
                            onChange={() => setForm((prev) => ({ ...prev, paymentMethod: option.id }))}
                            className="accent-violet-400"
                          />
                          <div className="text-left">
                            <div className="font-semibold text-white">{option.label}</div>
                            <div className="text-sm text-white/50">
                              {option.id === "COD"
                                ? "Pay only when product arrives."
                                : "Pay securely with UPI / card."}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                    {form.paymentMethod === "Online" && (
                      <label className="space-y-2 text-sm text-white/60">
                        UPI / Card reference
                        <input
                          value={form.paymentReference}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, paymentReference: e.target.value }))
                          }
                          className="w-full rounded-2xl bg-slate-950/80 border border-white/10 px-4 py-3 text-white outline-none focus:border-violet-400"
                          placeholder="UPI ID or transaction ID"
                        />
                      </label>
                    )}
                    <div className="rounded-3xl bg-slate-950/70 border border-white/10 p-4 text-sm text-white/60">
                      <p className="font-semibold text-white mb-2">Order summary</p>
                      <div className="flex items-center justify-between">
                        <span>{items.length} items</span>
                        <span>₹{subtotal}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span>Shipping</span>
                        <span>{shippingCost === 0 ? "Free" : `₹${shippingCost}`}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3 text-white font-semibold text-lg">
                        <span>Total</span>
                        <span>₹{total}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white/5 border border-white/10 p-5 space-y-4">
                <h3 className="text-lg font-semibold text-white">Your order</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white line-clamp-1">{item.name}</p>
                        <p className="text-xs text-white/50">{item.qty} × ₹{item.price}</p>
                      </div>
                      <span className="text-sm text-cyan-300">₹{item.qty * item.price}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 pt-4 text-white/60 text-sm">
                  <p>Provider(s): {providers.join(" • ")}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 bg-slate-950/95 backdrop-blur border-t border-white/10 space-y-3">
          {error && (
            <p className="text-sm text-red-300">{error}</p>
          )}
          {step === "confirmation" ? (
            <button
              onClick={handleClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold shadow-lg shadow-cyan-500/30"
            >
              Continue Shopping
            </button>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep((prev) => (prev === "payment" ? "details" : prev))}
                disabled={step === "details" || submitting}
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-white/10 text-white/70 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (step === "details") {
                    setStep("payment");
                    return;
                  }
                  handlePlaceOrder();
                }}
                disabled={
                  submitting || (step === "details" ? !isDetailsValid : !isPaymentValid)
                }
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-fuchsia-500/30 transition-all disabled:opacity-40"
              >
                {step === "details" ? "Continue to Payment" : submitting ? "Placing order..." : "Place Order"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
