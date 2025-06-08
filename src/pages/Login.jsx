import { useState } from "react";
import Input from "../components/Input";
import { login } from "../services/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { token, usuario } = await login(email, senha);
      localStorage.setItem("token", token);
      localStorage.setItem("usuario", JSON.stringify(usuario));
      window.location.href = "/"; // redirecionar após login
    } catch (err) {
  console.error(err); // exibe no console para debug
  setErro("Credenciais inválidas");
}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">RentKeeper Login</h1>
        {erro && <p className="text-red-500 mb-4">{erro}</p>}
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
