import { createContext, useContext, useState } from "react";

const ACCESS_TOKEN_KEY = "calm_aim:access_token";
const REFRESH_TOKEN_KEY = "calm_aim:refresh_token";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => ({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  }));

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    setAuth({ accessToken, refreshToken });
  };

  const logout = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAuth({ accessToken: null, refreshToken: null });
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!auth.accessToken, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
