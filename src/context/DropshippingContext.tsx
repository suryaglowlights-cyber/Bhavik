// ========================================
// Dropshipping Context - Global State Management
// ========================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDropshippersHealth } from '../lib/dropshippingApi';

export interface SupplierStatus {
  id: string;
  name: string;
  isActive: boolean;
  baseUrl: string;
  lastSync: string | null;
}

interface DropshippingContextType {
  suppliers: SupplierStatus[];
  loadingSuppliers: boolean;
  defaultMargin: number;
  setDefaultMargin: (margin: number) => void;
  refreshSuppliers: () => Promise<void>;
}

const DropshippingContext = createContext<DropshippingContextType | undefined>(undefined);

export function DropshippingProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<SupplierStatus[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [defaultMargin, setDefaultMargin] = useState(() => {
    const saved = localStorage.getItem('dropshipping:default:margin');
    return saved ? parseFloat(saved) : 30;
  });

  useEffect(() => {
    refreshSuppliers();
    
    // Refresh every 30 minutes
    const interval = setInterval(refreshSuppliers, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('dropshipping:default:margin', String(defaultMargin));
  }, [defaultMargin]);

  const refreshSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const data = await getDropshippersHealth();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to refresh suppliers:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  return (
    <DropshippingContext.Provider
      value={{
        suppliers,
        loadingSuppliers,
        defaultMargin,
        setDefaultMargin,
        refreshSuppliers,
      }}
    >
      {children}
    </DropshippingContext.Provider>
  );
}

export function useDropshipping() {
  const context = useContext(DropshippingContext);
  if (!context) {
    throw new Error('useDropshipping must be used within DropshippingProvider');
  }
  return context;
}
