import { createContext, useContext, useState, type ReactNode } from "react";

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

  const saveKeys = (provider: keyof AllApiKeys, data: ProviderKeys) => {
    setKeys((prev) => ({ ...prev, [provider]: { ...data, isActive: true } }));
  };

  const toggleProvider = (provider: keyof AllApiKeys) => {
    setKeys((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], isActive: !prev[provider].isActive },
    }));
  };

  const getActiveCount = () =>
    Object.values(keys).filter((p) => p.isActive && p.apiKey.length > 0).length;

  return (
    <ApiKeysContext.Provider value={{ keys, saveKeys, toggleProvider, getActiveCount }}>
      {children}
    </ApiKeysContext.Provider>
  );
}
