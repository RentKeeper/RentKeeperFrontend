import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../services/auth";
import "./Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    cpf: "",
    telefone: "",
    posicao: 1 // Goleiro por padrão
  });

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const posicoes = [
    { id: 1, nome: "Goleiro" },
    { id: 2, nome: "Defensor" },
    { id: 3, nome: "Meia" },
    { id: 4, nome: "Atacante" },
    { id: 5, nome: "Juiz" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validarCPF = (cpf) => {
    cpf = cpf.replace(/[^\d]/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let dv1 = resto < 2 ? 0 : resto;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let dv2 = resto < 2 ? 0 : resto;
    
    return cpf.charAt(9) === dv1.toString() && cpf.charAt(10) === dv2.toString();
  };

  const validarEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validarTelefone = (telefone) => {
    const telefoneRegex = /^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}\-?[0-9]{4}$/;
    return telefoneRegex.test(telefone);
  };

  const formatarCPF = (cpf) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatarTelefone = (telefone) => {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    try {
      // Validações
      if (!formData.nome.trim()) {
        throw new Error("Nome é obrigatório");
      }

      if (!validarEmail(formData.email)) {
        throw new Error("Email inválido");
      }

      if (formData.senha.length < 6) {
        throw new Error("Senha deve ter pelo menos 6 caracteres");
      }

      if (formData.senha !== formData.confirmarSenha) {
        throw new Error("Senhas não coincidem");
      }

      if (!validarCPF(formData.cpf.replace(/[^\d]/g, ''))) {
        throw new Error("CPF inválido");
      }

      if (!validarTelefone(formData.telefone.replace(/[^\d]/g, ''))) {
        throw new Error("Telefone inválido");
      }

      // Preparar dados para envio
      const dadosParaEnvio = {
        nome: formData.nome.trim(),
        email: formData.email.toLowerCase(),
        senha: formData.senha,
        cpf: formData.cpf.replace(/[^\d]/g, ''),
        telefone: formData.telefone.replace(/[^\d]/g, ''),
        posicao: parseInt(formData.posicao)
      };

      // Enviar para o backend
      const usuarioCriado = await register(dadosParaEnvio);
      
      setSucesso("Cadastro realizado com sucesso! Redirecionando para login...");
      
      // Limpar formulário
      setFormData({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
        cpf: "",
        telefone: "",
        posicao: 1
      });

      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setErro(err.response.data.message);
      } else if (err.message) {
        setErro(err.message);
      } else {
        setErro("Erro ao realizar cadastro. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <form onSubmit={handleSubmit} className="register-form">
        <h1 className="register-title">RentKeeper</h1>
        <p className="register-subtitle">Cadastre-se e encontre seu lugar no campo!</p>
        
        {erro && <div className="register-error">{erro}</div>}
        {sucesso && <div className="register-success">{sucesso}</div>}
        
        <div className="register-input-group">
          <label className="register-label">Nome Completo</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            className="register-input"
            placeholder="Digite seu nome completo"
            required
          />
        </div>

        <div className="register-input-group">
          <label className="register-label">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="register-input"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="register-row">
          <div className="register-input-group">
            <label className="register-label">Senha</label>
            <input
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              className="register-input"
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className="register-input-group">
            <label className="register-label">Confirmar Senha</label>
            <input
              type="password"
              name="confirmarSenha"
              value={formData.confirmarSenha}
              onChange={handleInputChange}
              className="register-input"
              placeholder="Confirme sua senha"
              required
            />
          </div>
        </div>

        <div className="register-row">
          <div className="register-input-group">
            <label className="register-label">CPF</label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '');
                if (valor.length <= 11) {
                  setFormData(prev => ({
                    ...prev,
                    cpf: valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                  }));
                }
              }}
              className="register-input"
              placeholder="000.000.000-00"
              required
            />
          </div>

          <div className="register-input-group">
            <label className="register-label">Telefone</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={(e) => {
                const valor = e.target.value.replace(/\D/g, '');
                if (valor.length <= 11) {
                  setFormData(prev => ({
                    ...prev,
                    telefone: valor.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
                  }));
                }
              }}
              className="register-input"
              placeholder="(00) 00000-0000"
              required
            />
          </div>
        </div>

        <div className="register-input-group">
          <label className="register-label">Posição</label>
          <select
            name="posicao"
            value={formData.posicao}
            onChange={handleInputChange}
            className="register-select"
            required
          >
            {posicoes.map(posicao => (
              <option key={posicao.id} value={posicao.id}>
                {posicao.nome}
              </option>
            ))}
          </select>
        </div>
        
        <button
          type="submit"
          className={`register-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        
        <div className="register-footer">
          <p>Já tem uma conta? <Link to="/login">Faça login</Link></p>
        </div>
      </form>
    </div>
  );
}
