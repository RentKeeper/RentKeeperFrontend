import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/auth";
import { ArrowLeft } from "lucide-react";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErro("");
    
    try {
      const { token, usuario } = await login(email, senha);
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      window.location.href = "/"; // redirecionar após login
    } catch (err) {
      console.error(err); // exibe no console para debug
      setErro("Credenciais inválidas");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <button 
        onClick={() => navigate('/')} 
        className="back-home-btn"
        type="button"
      >
        <ArrowLeft className="back-home-icon" />
        Voltar à Home
      </button>
      <form onSubmit={handleSubmit} className="login-form">
        <h1 className="login-title">RentKeeper Login</h1>
        
        {erro && <div className="login-error">{erro}</div>}
        
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
        
        <button
          type="submit"
          className={`login-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
        
        <div className="login-footer">
          <p>Não tem uma conta? <Link to="/register">Registre-se</Link></p>
        </div>
      </form>
    </div>
  );
}
