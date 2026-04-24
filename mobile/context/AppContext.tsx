import { createContext, useContext, useState, type ReactNode } from 'react';

type AppContextType = {
  userName: string;
  setUserName: (name: string) => void;
  isOnboarded: boolean;
  completeOnboarding: (name: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userName, setUserName] = useState('');
  const [isOnboarded, setIsOnboarded] = useState(false);

  const completeOnboarding = (name: string) => {
    setUserName(name);
    setIsOnboarded(true);
  };

  return (
    <AppContext.Provider value={{ userName, setUserName, isOnboarded, completeOnboarding }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
