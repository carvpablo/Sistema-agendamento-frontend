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

export default useAuth;
