import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  imageUrl: string;
  isLive: boolean;
}

export default function InventoryPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    stock: "",
    sku: "",
    imageUrl: "",
  });
  const [siteStatus, setSiteStatus] = useState<"checking" | "online" | "offline">("checking");
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    loadProducts();
    checkSiteStatus();
    loadSyncStatus();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch("/api/products.php");
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          const inventoryProducts = data.products.map((p: any) => ({
            id: p.id || p.providerProductId,
            name: p.name,
            price: p.price || p.retailPrice,
            stock: p.stock || 10,
            sku: p.sku || p.providerProductId,
            imageUrl: p.image || p.imageUrl || "",
            isLive: p.status === "active" || p.isLive !== false,
          }));
          setProducts(inventoryProducts);
          updateCounts(inventoryProducts);
        }
      }
    } catch (error) {
      console.error("Failed to load products:", error);
    }
  };

  const loadSyncStatus = async () => {
    try {
      // Get sync timestamp from KV
      const res = await fetch("/api/sync-status");
      if (res.ok) {
        const data = await res.json();
        setLastSync(data.lastSync || null);
      }
    } catch (error) {
      console.error("Failed to load sync status:", error);
    }
  };

  const checkSiteStatus = async () => {
    setSiteStatus("checking");
    try {
      const response = await fetch("https://bhavik.pages.dev", {
        method: "HEAD",
        mode: "no-cors",
      });
      // Since no-cors mode doesn't give us status, we'll assume success if no error
      setSiteStatus("online");
    } catch (error) {
      setSiteStatus("offline");
    }
  };

  const updateCounts = (productList: Product[]) => {
    setLiveCount(productList.filter((p) => p.isLive).length);
    setDraftCount(productList.filter((p) => !p.isLive).length);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      id: `manual-${Date.now()}`,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      sku: newProduct.sku,
      imageUrl: newProduct.imageUrl,
      isLive: false,
    };

    try {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });

      setProducts([...products, product]);
      updateCounts([...products, product]);
      setNewProduct({ name: "", price: "", stock: "", sku: "", imageUrl: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Failed to add product:", error);
    }
  };

  const toggleLiveStatus = async (productId: string) => {
    const updatedProducts = products.map((p) =>
      p.id === productId ? { ...p, isLive: !p.isLive } : p
    );
    setProducts(updatedProducts);
    updateCounts(updatedProducts);

    try {
      await fetch("/api/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, isLive: !products.find((p) => p.id === productId)?.isLive }),
      });
    } catch (error) {
      console.error("Failed to update product status:", error);
    }
  };

  const getStockColor = (stock: number) => {
    if (stock > 10) return "bg-emerald-500";
    if (stock >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getStockLabel = (stock: number) => {
    if (stock > 10) return "In Stock";
    if (stock >= 5) return "Low Stock";
    return "Out of Stock";
  };

  return (
    <div className="space-y-6">
      {/* Website Status Panel */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          🌐 Website Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${siteStatus === "online" ? "bg-emerald-500" : siteStatus === "offline" ? "bg-red-500" : "bg-yellow-500"}`} />
              <span className="text-sm text-white/70">Site Status</span>
            </div>
            <p className="text-xl font-bold text-white">
              {siteStatus === "checking" ? "Checking..." : siteStatus === "online" ? "Online ✓" : "Offline"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/70 mb-2">Live Products</p>
            <p className="text-xl font-bold text-emerald-400">{liveCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/70 mb-2">Draft Products</p>
            <p className="text-xl font-bold text-yellow-400">{draftCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-white/70 mb-2">Last Sync</p>
            <p className="text-sm font-bold text-white">
              {lastSync ? new Date(lastSync).toLocaleString() : "Never"}
            </p>
          </div>
        </div>
        <button
          onClick={checkSiteStatus}
          className="mt-4 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-semibold hover:bg-violet-500/30 transition-all"
        >
          🔄 Check Live Status
        </button>
      </div>

      {/* Inventory Management */}
      <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            📦 Inventory Management
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold hover:opacity-90 transition-all"
          >
            {showAddForm ? "Cancel" : "+ Add Product"}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddProduct} className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Price (₹)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">Stock Quantity</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-2">SKU</label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-white/70 mb-2">Image URL</label>
                <input
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold"
            >
              Add Product
            </button>
          </form>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-sm text-white/70 font-semibold">Product</th>
                <th className="text-left py-3 px-4 text-sm text-white/70 font-semibold">SKU</th>
                <th className="text-left py-3 px-4 text-sm text-white/70 font-semibold">Price</th>
                <th className="text-left py-3 px-4 text-sm text-white/70 font-semibold">Stock</th>
                <th className="text-left py-3 px-4 text-sm text-white/70 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-sm text-white/70 font-semibold">Live</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <span className="text-white font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white/70">{product.sku}</td>
                  <td className="py-3 px-4 text-white font-medium">₹{product.price.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStockColor(product.stock)}`} />
                      <span className="text-white/70">{product.stock}</span>
                      <span className="text-xs text-white/50">({getStockLabel(product.stock)})</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
                      product.stock > 10 
                        ? "bg-emerald-500/20 text-emerald-300" 
                        : product.stock >= 5 
                        ? "bg-yellow-500/20 text-yellow-300" 
                        : "bg-red-500/20 text-red-300"
                    }`}>
                      {getStockLabel(product.stock)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleLiveStatus(product.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        product.isLive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/5 text-white/50 border border-white/10"
                      }`}
                    >
                      {product.isLive ? "LIVE ✓" : "DRAFT"}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/50">
                    No products yet. Add your first product above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
