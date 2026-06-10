import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApiKeys } from "../../context/ApiKeysContext";
import ApiKeysPanel from "./ApiKeysPanel";
import ContentEditor from "./ContentEditor";
import CatalogSyncPanel from "./CatalogSyncPanel";
import InventoryPanel from "./InventoryPanel";

interface Props {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: Props) {
  const { adminName, logout } = useAuth();
  const { getActiveCount } = useApiKeys();
  const [activeSection, setActiveSection] = useState<"apikeys" | "content" | "orders" | "settings" | "catalog" | "inventory">("apikeys");
  const [kvConnected, setKvConnected] = useState(false);

  useEffect(() => {
    // Check if KV is connected by testing the API
    fetch("/api/keys")
      .then((res) => setKvConnected(res.ok))
      .catch(() => setKvConnected(false));
  }, []);

  const handleLogout = () => {
    logout();
    onBack();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-slate-950/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white/70 transition-all"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Bhavik
              </span>
              <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-bold">
                ADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {kvConnected && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-300 font-semibold">🟢 Cloud Storage Connected</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
                {adminName.charAt(0)}
              </div>
              <span className="text-sm text-white/80">{adminName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/20 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-white/50">Manage your store, API keys, and content.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Providers", value: `${getActiveCount()}/4`, icon: "🔌", color: "from-violet-500 to-purple-600" },
            { label: "Total Products", value: "10K+", icon: "📦", color: "from-fuchsia-500 to-pink-600" },
            { label: "Orders Today", value: "0", icon: "🛒", color: "from-cyan-500 to-blue-600" },
            { label: "Revenue", value: "₹0", icon: "💰", color: "from-emerald-500 to-teal-600" },
          ].map((stat, i) => (
            <div key={i} className="p-4 md:p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} opacity-30`} />
              </div>
              <p className="text-2xl md:text-3xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-white/50 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "apikeys" as const, label: "🔑 API Keys", desc: "Provider configurations" },
            { id: "catalog" as const, label: "🛒 Catalog Sync", desc: "Sync vendor products" },
            { id: "inventory" as const, label: "📦 Inventory", desc: "Manage products" },
            { id: "content" as const, label: "📝 Content Editor", desc: "Edit website content" },
            { id: "orders" as const, label: "📦 Orders", desc: "Coming soon" },
            { id: "settings" as const, label: "⚙️ Settings", desc: "Store settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-5 py-3 rounded-2xl text-sm font-semibold border transition-all whitespace-nowrap ${
                activeSection === tab.id
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-transparent shadow-lg shadow-fuchsia-500/20"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSection === "apikeys" && <ApiKeysPanel />}

        {activeSection === "catalog" && <CatalogSyncPanel />}

        {activeSection === "inventory" && <InventoryPanel />}

        {activeSection === "content" && <ContentEditor />}

        {activeSection === "orders" && (
          <div className="p-12 rounded-3xl bg-white/5 border border-white/10 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">Orders Management</h3>
            <p className="text-white/50">Coming soon — view, track, and manage all orders from one place.</p>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">⚙️ Store Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Store Name</label>
                  <input
                    type="text"
                    defaultValue="Bhavik"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Store URL</label>
                  <input
                    type="text"
                    defaultValue="https://bhavik.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Currency</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50">
                    <option value="INR">₹ INR - Indian Rupee</option>
                    <option value="USD">$ USD - US Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Default Order Routing</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500/50">
                    <option>Auto (Best price)</option>
                    <option>Printrove (Primary)</option>
                    <option>Qikink (Primary)</option>
                    <option>Blinkstore (Primary)</option>
                    <option>VendorGo (Primary)</option>
                  </select>
                </div>
                <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold">
                  💾 Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
