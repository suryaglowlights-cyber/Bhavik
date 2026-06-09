import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface ProviderKeys {
  apiKey: string;
  secretKey: string;
  clientId: string;
  accessToken: string;
  webhookUrl: string;
  isActive: boolean;
}

export interface AllApiKeys {
  printrove: ProviderKeys;
  qikink: ProviderKeys;
  blinkstore: ProviderKeys;
  vendorgo: ProviderKeys;
}

const defaultKeys: AllApiKeys = {
  printrove: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
  qikink: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
  blinkstore: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
  vendorgo: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
};

const providerHasRequiredKeys = (provider: keyof AllApiKeys, data: ProviderKeys) => {
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

interface ApiKeysContextType {
  keys: AllApiKeys;
  saveKeys: (provider: keyof AllApiKeys, data: ProviderKeys) => void;
  toggleProvider: (provider: keyof AllApiKeys) => void;
  getActiveCount: () => number;
}

const ApiKeysContext = createContext<ApiKeysContextType | null>(null);

export function useApiKeys() {
  const ctx = useContext(ApiKeysContext);
  if (!ctx) throw new Error("useApiKeys must be used within ApiKeysProvider");
  return ctx;
}

export function ApiKeysProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<AllApiKeys>(() => {
    const saved = localStorage.getItem("bhavik_api_keys");
    return saved ? JSON.parse(saved) : defaultKeys;
  });

  useEffect(() => {
    localStorage.setItem("bhavik_api_keys", JSON.stringify(keys));
  }, [keys]);

  useEffect(() => {
    const loadBackendKeys = async () => {
      try {
        const res = await fetch("/api/provider-keys");
        if (!res.ok) return;
        const json = await res.json();
        if (json && typeof json === "object") {
          setKeys((prev) => ({ ...prev, ...json }));
        }
      } catch {
        // Backend not available yet; continue using local storage.
      }
    };

    loadBackendKeys();
  }, []);

  const saveKeys = (provider: keyof AllApiKeys, data: ProviderKeys) => {
    const hasRequiredKeys = providerHasRequiredKeys(provider, data);
    setKeys((prev) => ({
      ...prev,
      [provider]: { ...data, isActive: hasRequiredKeys },
    }));
  };

  const toggleProvider = (provider: keyof AllApiKeys) => {
    setKeys((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], isActive: !prev[provider].isActive },
    }));
  };

  const getActiveCount = () => Object.values(keys).filter((p) => p.isActive).length;

  return (
    <ApiKeysContext.Provider value={{ keys, saveKeys, toggleProvider, getActiveCount }}>
      {children}
    </ApiKeysContext.Provider>
  );
}
