import { createContext, useContext, useState } from "react";
import { login as apiLogin, logout as apiLogout, signup as apiSignup } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null);

  async function login(credentials) {
    const data = await apiLogin(credentials);
    setTeacher(data);
    return data;
  }

  async function signup(credentials) {
    const data = await apiSignup(credentials);
    setTeacher(data);
    return data;
  }

  async function logout() {
    await apiLogout();
    setTeacher(null);
  }

  return (
    <AuthContext.Provider value={{ teacher, login, logout, signup, isAuthenticated: !!teacher }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
