import { useEffect, useMemo, useState } from "react";
import { useApiKeys } from "../../context/ApiKeysContext";
import type { Product } from "../../data/products";

const PROVIDERS = [
  { key: "Printrove", label: "Sync Printrove Catalog", colour: "from-violet-500 to-purple-600" },
  { key: "Qikink", label: "Sync Qikink Catalog", colour: "from-fuchsia-500 to-pink-600" },
  { key: "Blinkstore", label: "Sync Blinkstore Catalog", colour: "from-cyan-500 to-blue-600" },
  { key: "VendorGo", label: "Sync VendorGo Catalog", colour: "from-emerald-500 to-teal-600" },
] as const;

type ProviderKey = (typeof PROVIDERS)[number]["key"];

export default function CatalogSyncPanel() {
  const { keys } = useApiKeys();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<ProviderKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const providerActive = (provider: ProviderKey) => {
    const configKey = provider.toLowerCase() as keyof typeof keys;
    return keys[configKey]?.isActive ?? false;
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    setError(null);
    try {
      const res = await fetch("/api/products.php");
      if (!res.ok) throw new Error(`Failed to load products (${res.status})`);
      const json = await res.json();
      setProducts(json.products ?? []);
    } catch (err) {
      setError((err as Error).message || "Unable to load product catalog.");
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, []);

  const syncCatalog = async (provider: ProviderKey) => {
    setSyncingProvider(provider);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/products/sync-catalog?provider=${encodeURIComponent(provider)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to sync ${provider} catalog.`);
      }
      setMessage(`✅ ${provider} sync complete. ${json.stats?.total ?? 0} items imported.`);
      await loadProducts();
    } catch (err) {
      setError((err as Error).message || `Unable to sync ${provider} catalog.`);
    } finally {
      setSyncingProvider(null);
    }
  };

  const tableRows = useMemo(() => {
    return products.map((product) => {
      const priceValue = product.retailPrice ?? product.price ?? 0;
      const priceNumber = typeof priceValue === "string" ? parseFloat(priceValue) : priceValue;
      return {
        id: product.id,
        provider: product.provider,
        providerProductId: product.providerProductId ?? "-",
        title: product.name,
        price: Number.isFinite(priceNumber) ? priceNumber : 0,
        status: product.status ?? "active",
        image: product.image,
      };
    });
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {PROVIDERS.map((provider) => {
          const isActive = providerActive(provider.key);
          const isSyncing = syncingProvider === provider.key;
          return (
            <button
              key={provider.key}
              onClick={() => void syncCatalog(provider.key)}
              disabled={isSyncing || !isActive}
              className={`rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-lg transition-all ${isActive ? `bg-gradient-to-r ${provider.colour}` : "bg-white/5 text-white/40 cursor-not-allowed"}`}
            >
              {isSyncing ? `Syncing ${provider.key}...` : provider.label}
            </button>
          );
        })}
      </div>

      <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Catalog Sync</h2>
            <p className="text-sm text-white/60">Use these buttons to import or refresh products from each provider.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="text-sm text-white/80">Total products: {products.length}</span>
            <span className="text-sm text-white/80">Providers ready: {PROVIDERS.filter((provider) => providerActive(provider.key)).length}/4</span>
          </div>
        </div>

        {(message || error) && (
          <div className={`rounded-2xl p-4 ${error ? "bg-red-500/10 border border-red-500/20 text-red-200" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-200"}`}>
            {error || message}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-slate-950/90">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Provider</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">ID</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Title</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Price</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Status</th>
              </tr>
            </thead>
            <tbody className="bg-slate-950/80 divide-y divide-white/10">
              {loadingProducts ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-white/60">
                    Loading catalog products...
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-white/60">
                    No synced catalog products found yet. Use a sync button above.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr key={`${row.provider}-${row.id}`} className="hover:bg-white/5">
                    <td className="px-4 py-4 text-white">{row.provider}</td>
                    <td className="px-4 py-4 text-white/80">{row.providerProductId}</td>
                    <td className="px-4 py-4 text-white">{row.title}</td>
                    <td className="px-4 py-4 text-emerald-300">₹{row.price?.toFixed(2) ?? "0.00"}</td>
                    <td className="px-4 py-4 text-white/80">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
