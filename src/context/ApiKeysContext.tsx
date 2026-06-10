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
  const [keys, setKeys] = useState<AllApiKeys>(defaultKeys);

  useEffect(() => {
    const loadBackendKeys = async () => {
      try {
        const res = await fetch("/api/keys");
        if (res.ok) {
          const json = await res.json();
          if (json && typeof json === "object") {
            setKeys(json);
          }
        }
      } catch (error) {
        console.error("Failed to load provider keys from backend:", error);
      }
    };

    loadBackendKeys();
  }, []);

  const saveKeys = async (provider: keyof AllApiKeys, data: ProviderKeys) => {
    const hasRequiredKeys = providerHasRequiredKeys(provider, data);
    const updatedKeys = {
      ...keys,
      [provider]: { ...data, isActive: hasRequiredKeys },
    };
    
    setKeys(updatedKeys);
    
    try {
      await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedKeys),
      });
    } catch (error) {
      console.error("Failed to save provider keys to backend:", error);
    }
  };

  const toggleProvider = (provider: keyof AllApiKeys) => {
    setKeys((prev: AllApiKeys) => ({
      ...prev,
      [provider]: { ...prev[provider], isActive: !prev[provider].isActive },
    }));
  };

  const getActiveCount = () => Object.values(keys).filter((p: ProviderKeys) => p.isActive).length;

  return (
    <ApiKeysContext.Provider value={{ keys, saveKeys, toggleProvider, getActiveCount }}>
      {children}
    </ApiKeysContext.Provider>
  );
}
