import { useState } from "react";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token")
  );
  const [userRole, setUserRole] = useState(
    () => localStorage.getItem("userRole") || null
  );

  const login = (accessToken, refreshToken, role = null) => {
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refresh", refreshToken);
    if (role) localStorage.setItem("userRole", role);
    setToken(accessToken);
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh");
    localStorage.removeItem("userRole");
    setToken(null);
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated, userRole, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
