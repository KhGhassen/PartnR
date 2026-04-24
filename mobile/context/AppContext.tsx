import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { UserInfo } from '../api/auth';

type AppContextType = {
  token: string | null;
  user: UserInfo | null;
  isLoading: boolean;
  // Kept for onboarding pre-fill
  pendingName: string;
  setPendingName: (n: string) => void;
  login: (token: string, user: UserInfo) => Promise<void>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingName, setPendingName] = useState('');

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      if (stored && storedUser) {
        setToken(stored);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    })();
  }, []);

  const login = async (tok: string, u: UserInfo) => {
    await SecureStore.setItemAsync('token', tok);
    await SecureStore.setItemAsync('user', JSON.stringify(u));
    setToken(tok);
    setUser(u);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AppContext.Provider value={{ token, user, isLoading, pendingName, setPendingName, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
