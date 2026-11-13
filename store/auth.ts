import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserDataType {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthStore {
  user: UserDataType | null;
  setUser: (data: UserDataType) => void;
  logout: () => void;
}

const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (data: UserDataType) => set({ user: data }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage",
    },
  ),
);

/**
 * Indica se a sessão salva no navegador já foi lida. Antes disso (HTML do
 * servidor e primeira hidratação) `user` é sempre null, e isso não significa
 * "visitante": quem consome deve mostrar um estado neutro em vez de decidir.
 */
export function useAuthHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useAuth.persist.onFinishHydration(onChange),
    () => useAuth.persist.hasHydrated(),
    () => false,
  );
}

export default useAuth;
