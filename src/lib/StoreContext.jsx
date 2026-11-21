import { createContext, useContext } from 'react';
import { useCloudStore } from './useCloudStore';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const store = useCloudStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}