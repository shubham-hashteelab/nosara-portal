import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { login as loginApi } from "@/api/auth";
import { setToken, clearToken, getToken } from "@/api/client";
import type { User } from "@/types/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const USER_KEY = "nosara_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as User;
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setTokenState] = useState<string | null>(() => getToken());

  const isAuthenticated = !!token && !!user;

  const login = useCallback(async (username: string, password: string) => {
    const response = await loginApi(username, password);
    setToken(response.access_token);
    setTokenState(response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setUser(null);
      setTokenState(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
