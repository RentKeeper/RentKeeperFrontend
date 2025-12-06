import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	User,
	Mail,
	Phone,
	Save,
	Loader2,
	AlertCircle,
	CheckCircle,
	LogOut,
	QrCode,
} from "lucide-react";
import Cookies from "js-cookie";
import "./PerfilUsuario.css";
import { usuariosService } from "../services/usuarios";
import { getUserIdFromToken } from "../utils/jwt";
import UserMenu from "../components/UserMenu";
import Logo from "../components/Logo";

const resolveToken = () => {
	if (typeof window === "undefined") return null;
	return (
		Cookies.get("token") ||
		localStorage.getItem("token") ||
		sessionStorage.getItem("token") ||
		null
	);
};

const POSICOES = [
	{ value: "Goleiro", label: "Goleiro" },
	{ value: "Defensor", label: "Defensor" },
	{ value: "Meia", label: "Meia" },
	{ value: "Atacante", label: "Atacante" },
];

export default function PerfilUsuario() {
	const navigate = useNavigate();
	const [token, setToken] = useState(() => resolveToken());
	const [form, setForm] = useState({ nome: "", email: "", telefone: "", posicao: "", chavePix: "" });
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState({ error: "", success: "" });

	const userId = useMemo(() => {
		if (!token) return null;
		const id = getUserIdFromToken(token);
		const numeric = Number(id);
		return Number.isFinite(numeric) ? numeric : null;
	}, [token]);

	useEffect(() => {
		const handleStorage = () => setToken(resolveToken());
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);

	useEffect(() => {
		if (!userId) return;
		const loadProfile = async () => {
			setLoading(true);
			setFeedback({ error: "", success: "" });
			try {
				const usuario = await usuariosService.getById(userId);
				setForm({
					nome: usuario?.nome ?? "",
					email: usuario?.email ?? "",
					telefone: usuario?.telefone ?? "",
					posicao: usuario?.posicao ?? "",
					chavePix: usuario?.chavePix ?? "",
				});
			} catch (err) {
				console.error("Erro ao carregar perfil", err);
				setFeedback({
					error: err?.response?.data?.mensagem ?? err?.message ?? "Não foi possível carregar seu perfil.",
					success: "",
				});
			} finally {
				setLoading(false);
			}
		};

		loadProfile();
	}, [userId]);

	useEffect(() => {
		if (!feedback.success) return undefined;
		const timer = setTimeout(() => setFeedback((prev) => ({ ...prev, success: "" })), 4000);
		return () => clearTimeout(timer);
	}, [feedback.success]);

	useEffect(() => {
		if (!feedback.error) return undefined;
		const timer = setTimeout(() => setFeedback((prev) => ({ ...prev, error: "" })), 5000);
		return () => clearTimeout(timer);
	}, [feedback.error]);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!userId) {
			setFeedback({ error: "Faça login para atualizar seus dados.", success: "" });
			return;
		}

		setSaving(true);
		setFeedback({ error: "", success: "" });
		try {
			const payload = {
				Nome: form.nome,
				Email: form.email,
				Telefone: form.telefone,
				Posicao: form.posicao,
				ChavePix: form.chavePix,
			};
			await usuariosService.update(userId, payload);
			setFeedback({ error: "", success: "Perfil atualizado com sucesso." });
		} catch (err) {
			console.error("Erro ao atualizar perfil", err);
			setFeedback({
				error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao salvar as alterações.",
				success: "",
			});
		} finally {
			setSaving(false);
		}
	};

	const handleLogout = () => {
		Cookies.remove("token");
		localStorage.removeItem("token");
		sessionStorage.removeItem("token");
		navigate("/login");
	};

	if (!userId) {
		return (
			<div className="perfil-container">
				<header className="perfil-header">
					<div className="brand" onClick={() => navigate("/")}>
						<div className="brand-icon">
							<Logo size={32} />
						</div>
						<div>
							<h1>RentKeeper</h1>
							<p>Perfil do Usuário</p>
						</div>
					</div>
				</header>
				<main className="perfil-main">
					<div className="perfil-card">
						<p>Faça login para visualizar e editar suas informações.</p>
						<button type="button" className="primary-btn" onClick={() => navigate("/login")}>
							Entrar
						</button>
					</div>
				</main>
			</div>
		);
	}

	return (
		<div className="perfil-container">
			<header className="perfil-header">
				<div className="brand" onClick={() => navigate("/")}>
					<div className="brand-icon">
						<Logo size={32} />
					</div>
					<div>
						<h1>RentKeeper</h1>
						<p>Perfil do Usuário</p>
					</div>
				</div>

				<div className="header-actions">
					<UserMenu />
				</div>
			</header>

			<main className="perfil-main">
				<section className="perfil-section">
					<div className="section-header">
						<div>
							<h2>Seus dados</h2>
							<p>Atualize suas informações básicas e contatos.</p>
						</div>
						{loading && (
							<span className="loading-indicator">
								<Loader2 className="spinner" size={16} /> Carregando...
							</span>
						)}
					</div>

					{feedback.error && (
						<div className="feedback error">
							<AlertCircle size={18} />
							<span>{feedback.error}</span>
						</div>
					)}

					{feedback.success && (
						<div className="feedback success">
							<CheckCircle size={18} />
							<span>{feedback.success}</span>
						</div>
					)}

					<form className="perfil-form" onSubmit={handleSubmit}>
						<div className="form-grid">
							<label className="form-field">
								<span>
									<User size={16} /> Nome completo
								</span>
								<input
									type="text"
									name="nome"
									value={form.nome}
									onChange={handleChange}
									required
									disabled={loading || saving}
								/>
							</label>

							<label className="form-field">
								<span>
									<Mail size={16} /> E-mail
								</span>
								<input
									type="email"
									name="email"
									value={form.email}
									onChange={handleChange}
									required
									disabled={loading || saving}
								/>
							</label>

							<label className="form-field">
								<span>
									<Phone size={16} /> Telefone
								</span>
								<input
									type="tel"
									name="telefone"
									value={form.telefone}
									onChange={handleChange}
									placeholder="(00) 00000-0000"
									disabled={loading || saving}
								/>
							</label>

							<label className="form-field">
								<span>
									<User size={16} /> Posição
								</span>
								<select name="posicao" value={form.posicao} onChange={handleChange} disabled={loading || saving}>
									<option value="">Selecione</option>
									{POSICOES.map((option) => (
										<option key={option.value} value={option.value}>
											{option.label}
										</option>
									))}
								</select>
							</label>

							<label className="form-field">
								<span>
									<QrCode size={16} /> Chave PIX
								</span>
								<input
									type="text"
									name="chavePix"
									value={form.chavePix}
									onChange={handleChange}
									placeholder="Informe sua chave PIX para recebimentos"
									disabled={loading || saving}
								/>
							</label>
						</div>

						<div className="form-actions">
							<button type="submit" className="primary-btn" disabled={saving || loading}>
								{saving ? (
									<>
										<Loader2 className="spinner" size={18} />
										Salvando...
									</>
								) : (
									<>
										<Save size={16} />
										Salvar alterações
									</>
								)}
							</button>
							<button type="button" className="secondary-btn" onClick={handleLogout}>
								<LogOut size={16} />
								Sair da conta
							</button>
						</div>
					</form>
				</section>
			</main>
		</div>
	);
}