import { ChangeEvent, FormEvent, ReactElement, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { isAxiosError } from "axios";
import ApiService from "../services/apiService";
import "./Register.css";

type FormDataState = {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  cpf: string;
  telefone: string;
  posicao: number;
  chavePix: string;
};

type PositionOption = {
  id: number;
  nome: string;
};

type ApiClient = ReturnType<typeof ApiService>;

export default function Register(): ReactElement {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormDataState>({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    cpf: "",
    telefone: "",
    posicao: 1,
    chavePix: "",
  });

  const [erro, setErro] = useState<string>("");
  const [sucesso, setSucesso] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const posicoes: PositionOption[] = [
    { id: 1, nome: "Goleiro" },
    { id: 2, nome: "Defensor" },
    { id: 3, nome: "Meia" },
    { id: 4, nome: "Atacante" },
    { id: 5, nome: "Juiz" },
  ];

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    setFormData((prev) => {
      if (name === "posicao") {
        return { ...prev, posicao: Number(value) };
      }

      return { ...prev, [name]: value } as FormDataState;
    });
  };

  const validarCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/[^\d]/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i += 1) {
      soma += parseInt(digits.charAt(i), 10) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    const dv1 = resto < 2 ? 0 : resto;

    soma = 0;
    for (let i = 0; i < 10; i += 1) {
      soma += parseInt(digits.charAt(i), 10) * (11 - i);
    }
    resto = 11 - (soma % 11);
    const dv2 = resto < 2 ? 0 : resto;

    return digits.charAt(9) === dv1.toString() && digits.charAt(10) === dv2.toString();
  };

  const validarEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validarTelefone = (telefone: string): boolean => {
    const telefoneRegex = /^\(?[1-9]{2}\)? ?(?:[2-8]|9[1-9])[0-9]{3}-?[0-9]{4}$/;
    return telefoneRegex.test(telefone);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setIsLoading(true);

    try {
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

      if (!validarCPF(formData.cpf)) {
        throw new Error("CPF inválido");
      }

      if (!validarTelefone(formData.telefone)) {
        throw new Error("Telefone inválido");
      }

      const chavePixNormalizada = formData.chavePix.trim();
      if (chavePixNormalizada && chavePixNormalizada.length < 3) {
        throw new Error("Chave PIX deve ter pelo menos 3 caracteres");
      }

      const dadosParaEnvio = {
        nome: formData.nome.trim(),
        email: formData.email.toLowerCase(),
        senha: formData.senha,
        cpf: formData.cpf.replace(/[^\d]/g, ""),
        telefone: formData.telefone.replace(/[^\d]/g, ""),
        posicao: formData.posicao,
        chavePix: chavePixNormalizada || null,
      };

      const api: ApiClient = ApiService();
      await api.post("usuario", dadosParaEnvio);

      setSucesso("Cadastro realizado com sucesso! Redirecionando para login...");
      setFormData({
        nome: "",
        email: "",
        senha: "",
        confirmarSenha: "",
        cpf: "",
        telefone: "",
        posicao: 1,
        chavePix: "",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: unknown) {
      console.error(error);
      if (isAxiosError(error) && error.response?.data?.message) {
        setErro(error.response.data.message as string);
      } else if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro("Erro ao realizar cadastro. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <button onClick={() => navigate("/")} className="back-home-btn" type="button">
        <ArrowLeft className="back-home-icon" /> Voltar à Home
      </button>
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
              onChange={(event) => {
                const valor = event.target.value.replace(/\D/g, "");
                if (valor.length <= 11) {
                  setFormData((prev) => ({
                    ...prev,
                    cpf: valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"),
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
              onChange={(event) => {
                const valor = event.target.value.replace(/\D/g, "");
                if (valor.length <= 11) {
          const formatted = valor.length > 10
          ? valor.replace(/(\d{2})(\d{5})(\d{0,4})/, (_match: string, ddd: string, first: string, second: string = "") =>
            second ? `(${ddd}) ${first}-${second}` : `(${ddd}) ${first}`)
          : valor.replace(/(\d{2})(\d{4})(\d{0,4})/, (_match: string, ddd: string, first: string, second: string = "") =>
            second ? `(${ddd}) ${first}-${second}` : `(${ddd}) ${first}`);

                  setFormData((prev) => ({
                    ...prev,
                    telefone: formatted,
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
            {posicoes.map((posicao) => (
              <option key={posicao.id} value={posicao.id}>
                {posicao.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="register-input-group">
          <label className="register-label">Chave PIX (opcional)</label>
          <input
            type="text"
            name="chavePix"
            value={formData.chavePix}
            onChange={handleInputChange}
            className="register-input"
            placeholder="Informe sua chave PIX para receber pagamentos"
            maxLength={200}
          />
          <small className="register-hint">Essa chave será exibida automaticamente ao contratar seus serviços.</small>
        </div>

        <button type="submit" className={`register-button ${isLoading ? "loading" : ""}`} disabled={isLoading}>
          {isLoading ? "Cadastrando..." : "Cadastrar"}
        </button>

        <div className="register-footer">
          <p>
            Já tem uma conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
