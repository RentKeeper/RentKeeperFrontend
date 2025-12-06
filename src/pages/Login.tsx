import { ArrowLeft } from "lucide-react";
import "./Login.css";
import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../services/apiService';
import { isAxiosError } from 'axios';
import Cookies from 'js-cookie';



export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const api = ApiService();
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ApiService expects the route relative to baseURL (which already contains '/api')
      const response = await api.post('auth/login', { email, senha });
      // backend may return { Token: '...' } or { token: '...' } — authService normalizes but here we read raw
      const token = response.data?.token ?? response.data?.Token ?? response.data?.data?.token ?? null;

      if (token) {
        // Save to cookie for ApiService and to localStorage for axios instance
        Cookies.set('token', token, { expires: rememberMe ? 7 : undefined });
        try {
          if (rememberMe) {
            localStorage.setItem('token', token);
            sessionStorage.removeItem('token');
          } else {
            sessionStorage.setItem('token', token);
            localStorage.removeItem('token');
          }
        } catch {}
      }

      localStorage.setItem('email', email);

      if (rememberMe) {
        localStorage.setItem('remember', 'true');
      } else {
        localStorage.removeItem('remember');
      }

      navigate('/');
    } catch (err: unknown) {
      console.error('Login falhou:', err);
      const msg = isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(msg || 'Falha ao realizar o login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <button onClick={() => navigate("/")} className="back-home-btn" type="button">
        <ArrowLeft className="back-home-icon" /> Voltar à Home
      </button>

      <form onSubmit={handleLogin} className="login-form">
        <h1 className="login-title">RentKeeper Login</h1>

        {error && <div className="login-error">{error}</div>}
        <div className="login-input-group">
          <label className="login-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            required
          />
        </div>

        <div className="login-input-group">
          <label className="login-label">Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="login-input"
            required
          />
        </div>

        <div className="login-remember">
          <label>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Manter-me conectado
          </label>
        </div>

        <button type="submit" className={`login-button ${loading ? "loading" : ""}`} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div className="login-footer">
          <p>
            Não tem uma conta? <Link to="/register">Registre-se</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
