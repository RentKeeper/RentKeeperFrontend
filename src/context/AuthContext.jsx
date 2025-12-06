import React, { createContext, useEffect, useState } from "react";
import * as authService from "../services/auth";
import { setAuthToken } from "../services/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      // Prefer localStorage (remember me) but support sessionStorage fallback
      return localStorage.getItem("token") || sessionStorage.getItem("token");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Keep axios Authorization header in sync
    setAuthToken(token);
  }, [token]);

  const login = async (email, password, remember = true) => {
    // authService.login returns a normalized object: { token, usuario, raw }
    try {
      const resp = await authService.login(email, password);
      const newToken = resp?.token ?? null;

      if (newToken) {
        setToken(newToken);
        // store token in localStorage if remember, otherwise sessionStorage
        if (remember) {
          localStorage.setItem("token", newToken);
        } else {
          sessionStorage.setItem("token", newToken);
        }
      }

      // persist usuario (user) object for other parts of the app that read it
      const usuario = resp?.usuario ?? null;
      if (usuario) {
        const ujson = JSON.stringify(usuario);
        if (remember) {
          localStorage.setItem("usuario", ujson);
          localStorage.setItem("user", ujson);
        } else {
          sessionStorage.setItem("usuario", ujson);
          sessionStorage.setItem("user", ujson);
        }
      }

      return { token: newToken, usuario: resp?.usuario ?? null, raw: resp?.raw ?? null };
    } catch (err) {
      // Normalize error payloads from backend (e.g., { mensagem: '...' })
      const message = err?.response?.data?.mensagem ?? err?.response?.data?.message ?? err?.message ?? "Erro no login";
      return { token: null, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
