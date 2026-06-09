// ========================================
// EXAMPLE: Updated CheckoutDrawer Integration
// This shows how to integrate the dropshipping API into your checkout flow
// ========================================

import { useMemo, useState } from "react";
import type { Product } from "../data/products";
import {
  submitDropshipperOrder,
  checkDropshipperOrderStatus,
} from "../lib/dropshippingApi";
import { getMarginConfig, calculateRetailPrice } from "../utils/marginCalculator";

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

  // ========================================
  // Calculate prices with dropshipping margins
  // ========================================

  const marginConfig = useMemo(() => getMarginConfig(), []);

  const pricing = useMemo(() => {
    const supplierSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );

    const retailSubtotal = items.reduce((sum, item) => {
      const retailPrice = calculateRetailPrice(item.price, marginConfig);
      return sum + retailPrice * item.qty;
    }, 0);

    const marginApplied = retailSubtotal - supplierSubtotal;
    const shippingCost =
      shippingRates[form.shippingMethod as keyof typeof shippingRates] || 0;

    return {
      supplierSubtotal: Math.round(supplierSubtotal * 100) / 100,
      retailSubtotal: Math.round(retailSubtotal * 100) / 100,
      marginApplied: Math.round(marginApplied * 100) / 100,
      shippingCost,
      total: Math.round((retailSubtotal + shippingCost) * 100) / 100,
    };
  }, [items, marginConfig, form.shippingMethod]);

  // ========================================
  // Handle form changes
  // ========================================

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  // ========================================
  // Submit order to dropshipping suppliers
  // ========================================

  const handleSubmitOrder = async () => {
    try {
      setSubmitting(true);
      setError(null);

      // Validate form
      if (!form.fullName || !form.email || !form.phone) {
        throw new Error("Please fill in all required fields");
      }

      if (!form.address || !form.city || !form.state || !form.pincode) {
        throw new Error("Please provide complete shipping address");
      }

      // Group items by supplier (crucial for multi-supplier orders)
      const itemsBySupplier = items.reduce(
        (acc, item) => {
          const supplier = item.provider.toLowerCase();
          if (!acc[supplier]) acc[supplier] = [];
          acc[supplier].push({
            productId: `${supplier}:${item.id}`,
            supplier,
            quantity: item.qty,
            variantId: item.colors?.[0], // If applicable
          });
          return acc;
        },
        {} as Record<string, any[]>
      );

      // Create order payload
      const payload = {
        items: Object.values(itemsBySupplier).flat(),
        shipping: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          country: "IN",
        },
        paymentMethod: form.paymentMethod as "COD" | "PREPAID" | "WALLET",
        paymentReference:
          form.paymentMethod === "PREPAID" ? form.paymentReference : undefined,
        referenceOrderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      // Submit to Cloudflare Workers backend
      const result = await submitDropshipperOrder(payload);

      if (!result.success) {
        // Some orders may have failed
        const failedSuppliers = result.supplierOrders
          .filter((o) => o.status === "failed")
          .map((o) => o.supplier)
          .join(", ");

        setError(
          `Order partially failed for: ${failedSuppliers}. Please contact support.`
        );
        return;
      }

      // Save order reference locally for tracking
      const orderData = {
        referenceOrderId: result.referenceOrderId,
        supplierOrders: result.supplierOrders,
        cartItems: items,
        shippingDetails: form,
        pricing,
        submittedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        `order:${result.referenceOrderId}`,
        JSON.stringify(orderData)
      );

      // Track in analytics (if available)
      if (window.gtag) {
        window.gtag("event", "purchase", {
          transaction_id: result.referenceOrderId,
          value: pricing.total,
          currency: "INR",
          items: items.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            quantity: item.qty,
            price: calculateRetailPrice(item.price, marginConfig),
          })),
        });
      }

      // Update UI
      setOrderId(result.referenceOrderId);
      setStep("confirmation");

      // Notify parent component
      onSuccess(result.referenceOrderId, form.paymentMethod);

      // Show success message
      setTimeout(() => {
        onClose();
        setForm({ ...initialForm });
        setStep("details");
        setOrderId(null);
      }, 3000);
    } catch (error: any) {
      console.error("Order submission error:", error);
      setError(
        error.message ||
          "Failed to submit order. Please try again or contact support."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ========================================
  // Check order status
  // ========================================

  const handleCheckStatus = async () => {
    if (!orderId || !items.length) return;

    try {
      const supplier = items[0].provider.toLowerCase();
      const status = await checkDropshipperOrderStatus(orderId, supplier as any);

      if (status) {
        alert(
          `Order Status: ${status.status}\nTracking: ${status.tracking || "N/A"}`
        );
      }
    } catch (error) {
      console.error("Failed to check status:", error);
    }
  };

  // ========================================
  // Render components
  // ========================================

  const renderDetailsStep = () => (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Shipping Details</h2>

      <div className="space-y-3">
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={form.fullName}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="tel"
          name="phone"
          placeholder="Phone Number"
          value={form.phone}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={form.address}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            name="city"
            placeholder="City"
            value={form.city}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            name="state"
            placeholder="State"
            value={form.state}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <input
          type="text"
          name="pincode"
          placeholder="Pincode"
          value={form.pincode}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />

        <select
          name="shippingMethod"
          value={form.shippingMethod}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        >
          <option value="standard">Standard (Free)</option>
          <option value="express">Express (+₹99)</option>
          <option value="priority">Priority (+₹149)</option>
        </select>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <button
        onClick={() => setStep("payment")}
        className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700"
      >
        Continue to Payment
      </button>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Payment Method</h2>

      <div className="space-y-3">
        <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={form.paymentMethod === "COD"}
            onChange={handleInputChange}
            className="mr-3"
          />
          <span className="flex-1">Cash on Delivery (COD)</span>
        </label>

        <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="paymentMethod"
            value="PREPAID"
            checked={form.paymentMethod === "PREPAID"}
            onChange={handleInputChange}
            className="mr-3"
          />
          <span className="flex-1">Prepaid (Online Payment)</span>
        </label>

        {form.paymentMethod === "PREPAID" && (
          <input
            type="text"
            name="paymentReference"
            placeholder="Transaction ID / Reference"
            value={form.paymentReference}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          />
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded space-y-2">
        <div className="flex justify-between">
          <span>Product Subtotal:</span>
          <span>₹{pricing.retailSubtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Shipping:</span>
          <span>₹{pricing.shippingCost.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>₹{pricing.total.toFixed(2)}</span>
        </div>
      </div>

      {error && <div className="p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="flex gap-2">
        <button
          onClick={() => setStep("details")}
          className="flex-1 bg-gray-200 text-gray-800 p-3 rounded font-semibold hover:bg-gray-300"
          disabled={submitting}
        >
          Back
        </button>
        <button
          onClick={handleSubmitOrder}
          disabled={submitting}
          className="flex-1 bg-green-600 text-white p-3 rounded font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? "Processing..." : "Place Order"}
        </button>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="p-6 space-y-4 text-center">
      <div className="text-4xl mb-4">✅</div>
      <h2 className="text-2xl font-bold">Order Confirmed!</h2>
      <p className="text-gray-600">
        Your order has been successfully submitted to our suppliers.
      </p>

      <div className="bg-blue-50 p-4 rounded">
        <p className="font-semibold text-lg">Order ID: {orderId}</p>
        <p className="text-sm text-gray-600 mt-2">
          You will receive tracking information via email shortly.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm">
          <strong>Total Paid:</strong> ₹{pricing.total.toFixed(2)}
        </p>
        <p className="text-sm">
          <strong>Items:</strong> {items.length} product(s)
        </p>
      </div>

      <button
        onClick={() => {
          onClose();
          setForm({ ...initialForm });
          setStep("details");
          setOrderId(null);
        }}
        className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700"
      >
        Close
      </button>
    </div>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {step === "details" && renderDetailsStep()}
        {step === "payment" && renderPaymentStep()}
        {step === "confirmation" && renderConfirmationStep()}

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={submitting || step === "confirmation"}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
