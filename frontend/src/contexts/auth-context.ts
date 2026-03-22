import { createContext } from "react";
import type { LoginPayload, RegisterPayload, User } from "@/services/auth";

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
};

export const AuthContext = createContext<AuthContextType | null>(null);