'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { getTenantSettings, TenantSettings } from '../lib/getTenantSettings';

interface TenantSettingsContextValue {
  settings: TenantSettings | null;
  refresh: () => Promise<void>;
}

const TenantSettingsContext = createContext<TenantSettingsContextValue | undefined>(undefined);

export function useTenantSettings() {
  const ctx = useContext(TenantSettingsContext);
  if (!ctx) throw new Error('useTenantSettings must be used within TenantSettingsProvider');
  return ctx;
}

export default function TenantSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<TenantSettings | null>(null);

  const load = async () => {
    const res = await getTenantSettings();
    setSettings(res);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TenantSettingsContext.Provider value={{ settings, refresh: load }}>
      {children}
    </TenantSettingsContext.Provider>
  );
} 