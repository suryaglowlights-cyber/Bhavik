import { useEffect, useState } from "react";
import { useApiKeys, type ProviderKeys, type AllApiKeys } from "../../context/ApiKeysContext";

const providerConfig = {
  printrove: {
    name: "Printrove",
    icon: "🖨️",
    color: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/40",
    desc: "India's largest POD platform",
    fields: [
      { key: "apiKey", label: "Bearer Token", placeholder: "Enter Printrove Bearer Token" },
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://yourdomain.com/webhook/printrove" },
    ],
  },
  qikink: {
    name: "Qikink",
    icon: "⚡",
    color: "from-fuchsia-500 to-pink-600",
    glow: "shadow-fuchsia-500/40",
    desc: "End-to-end POD & dropshipping",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "Enter Qikink Client ID" },
      { key: "accessToken", label: "Access Token", placeholder: "Enter Qikink Access Token" },
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://yourdomain.com/webhook/qikink" },
    ],
  },
  blinkstore: {
    name: "Blinkstore",
    icon: "💎",
    color: "from-cyan-500 to-blue-600",
    glow: "shadow-cyan-500/40",
    desc: "Modern POD for creators",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Enter Blinkstore API Key" },
      { key: "secretKey", label: "Secret Key", placeholder: "Enter Blinkstore Secret Key" },
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://yourdomain.com/webhook/blinkstore" },
    ],
  },
  vendorgo: {
    name: "VendorGo",
    icon: "🚀",
    color: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-500/40",
    desc: "Multi-vendor marketplace connector",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Enter VendorGo API Key" },
      { key: "secretKey", label: "Secret Key", placeholder: "Enter VendorGo Secret Key" },
      { key: "webhookUrl", label: "Webhook URL", placeholder: "https://yourdomain.com/webhook/vendorgo" },
    ],
  },
};

type ProviderKey = keyof AllApiKeys;

export default function ApiKeysPanel() {
  const { keys, saveKeys, toggleProvider, getActiveCount } = useApiKeys();
  const [activeTab, setActiveTab] = useState<ProviderKey>("printrove");
  const [formData, setFormData] = useState<ProviderKeys>(keys.printrove);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; success: boolean } | null>(null);

  const providerHasRequiredKeys = (provider: ProviderKey, data: ProviderKeys) => {
    switch (provider) {
      case "printrove":
        return data.apiKey.trim().length > 0;
      case "qikink":
        return data.clientId.trim().length > 0 && data.accessToken.trim().length > 0;
      case "blinkstore":
      case "vendorgo":
        return data.apiKey.trim().length > 0 && data.secretKey.trim().length > 0;
      default:
        return false;
    }
  };

  const providerHasAnyKeys = (data: ProviderKeys) =>
    data.apiKey.trim().length > 0 ||
    data.secretKey.trim().length > 0 ||
    data.clientId.trim().length > 0 ||
    data.accessToken.trim().length > 0 ||
    data.webhookUrl.trim().length > 0;

  const switchTab = (tab: ProviderKey) => {
    setActiveTab(tab);
    setFormData(keys[tab]);
    setSaved(false);
    setTestResult(null);
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  useEffect(() => {
    setFormData(keys[activeTab]);
    setSaved(false);
    setTestResult(null);
  }, [activeTab, keys]);

  const handleSave = () => {
    saveKeys(activeTab, formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = (provider: string) => {
    setTesting(provider);
    setTestResult(null);
    setTimeout(() => {
      const data = keys[provider as ProviderKey];
      const hasKeys = providerHasRequiredKeys(provider as ProviderKey, data);
      setTesting(null);
      setTestResult({ provider, success: hasKeys });
    }, 1500);
  };

  const config = providerConfig[activeTab];
  const activeCount = getActiveCount();

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(providerConfig).map(([key, cfg]) => {
          const data = keys[key as ProviderKey];
          const hasRequiredKeys = providerHasRequiredKeys(key as ProviderKey, data);
          const hasAnyKeys = providerHasAnyKeys(data);
          return (
            <div
              key={key}
              onClick={() => switchTab(key as ProviderKey)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                activeTab === key
                  ? "bg-white/10 border-violet-400/50 shadow-lg"
                  : "bg-white/5 border-white/10 hover:bg-white/8"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{cfg.icon}</span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    data.isActive && hasRequiredKeys
                      ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                      : hasAnyKeys
                      ? "bg-amber-400"
                      : "bg-red-400/60"
                  }`}
                />
              </div>
              <p className="text-white font-bold text-sm">{cfg.name}</p>
              <p className="text-[10px] text-white/50 mt-0.5">
                {data.isActive && hasRequiredKeys
                  ? "✅ Active"
                  : hasAnyKeys
                  ? "⏸️ Configured"
                  : "❌ Not Set"}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Providers Count */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-400/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl">📊</div>
          <div>
            <p className="text-white font-semibold text-sm">Active Providers</p>
            <p className="text-white/50 text-xs">{activeCount} of 4 providers configured & active</p>
          </div>
        </div>
        <span className="text-3xl font-black bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
          {activeCount}/4
        </span>
      </div>

      {/* Config Panel */}
      <div className="bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
        {/* Tab Header */}
        <div className={`p-6 bg-gradient-to-r ${config.color} bg-opacity-20 border-b border-white/10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{config.icon}</span>
              <div>
                <h3 className="text-xl font-black text-white">{config.name} Configuration</h3>
                <p className="text-white/70 text-sm">{config.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleTest(activeTab)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/10 transition-all flex items-center gap-2"
              >
                {testing === activeTab ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Testing...
                  </>
                ) : (
                  "🔌 Test Connection"
                )}
              </button>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={keys[activeTab].isActive}
                  onChange={() => toggleProvider(activeTab)}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-400 peer-checked:to-cyan-400" />
                <span className="ml-2 text-sm text-white/70 font-medium">
                  {keys[activeTab].isActive ? "ON" : "OFF"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl border ${
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}
          >
            {testResult.success
              ? `✅ ${testResult.provider} API keys are configured. Connection test passed!`
              : `❌ ${testResult.provider} API keys are missing. Please fill in the required fields.`}
          </div>
        )}

        {/* Form Fields */}
        <div className="p-6 space-y-5">
          {config.fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm text-white/70 mb-2 font-medium">{field.label}</label>
              <div className="relative">
                <input
                  type={showKeys[field.key] ? "text" : "password"}
                  value={(formData as any)[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3.5 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKeys((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showKeys[field.key] ? "\u{1F648}" : "\u{1F441}"}
                </button>
              </div>
              {(formData as any)[field.key] && (
                <p className="text-[10px] text-emerald-400/60 mt-1 ml-1">
                  ✓ {(formData as any)[field.key].length} characters entered
                </p>
              )}
            </div>
          ))}

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
                saved
                  ? "bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-emerald-500/30"
                  : `bg-gradient-to-r ${config.color} ${config.glow} hover:shadow-xl`
              }`}
            >
              {saved ? "✅ Saved Successfully!" : `💾 Save ${config.name} Keys`}
            </button>
            <button
              type="button"
              onClick={() => {
                const emptyData = {
                  apiKey: "",
                  secretKey: "",
                  clientId: "",
                  accessToken: "",
                  webhookUrl: "",
                  isActive: false,
                };
                setFormData(emptyData);
                saveKeys(activeTab, emptyData);
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }}
              className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-semibold hover:bg-white/10 hover:text-white transition-all"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <h4 className="text-amber-300 font-bold text-sm mb-2 flex items-center gap-2">⚡ Quick Tips</h4>
          <ul className="space-y-1.5 text-xs text-white/50">
            <li>• Get API keys from your provider's dashboard</li>
            <li>• Test connection after adding keys</li>
            <li>• Toggle ON/OFF to enable/disable a provider</li>
            <li>• Keys are stored locally in your browser</li>
          </ul>
        </div>
        <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
          <h4 className="text-violet-300 font-bold text-sm mb-2 flex items-center gap-2">🔗 Provider Dashboards</h4>
          <ul className="space-y-1.5 text-xs text-white/50">
            <li>• Printrove: <a href="https://app.printrove.com" target="_blank" className="text-cyan-300 hover:underline">app.printrove.com</a></li>
            <li>• Qikink: <a href="https://app.qikink.com" target="_blank" className="text-cyan-300 hover:underline">app.qikink.com</a></li>
            <li>• Blinkstore: <a href="https://dashboard.blinkstore.in" target="_blank" className="text-cyan-300 hover:underline">dashboard.blinkstore.in</a></li>
            <li>• VendorGo: <a href="https://dashboard.vendorgo.in" target="_blank" className="text-cyan-300 hover:underline">dashboard.vendorgo.in</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
