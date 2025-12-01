import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Loader2,
	AlertCircle,
	CheckCircle,
	Calendar,
	MapPin,
	DollarSign,
	Star,
	Filter,
} from "lucide-react";
import Cookies from "js-cookie";
import "./Avaliacoes.css";
import { aluguelService } from "../services/aluguel";
import { anunciosService } from "../services/anuncios";
import { mapAnuncioFromBackend } from "../utils/anuncioMapper";
import { getUserIdFromToken } from "../utils/jwt";
import UserMenu from "../components/UserMenu";
import Logo from "../components/Logo";

const resolveToken = () => {
	if (typeof window === "undefined") return null;
	return (
		Cookies.get("token") ||
		window.localStorage?.getItem("token") ||
		window.sessionStorage?.getItem("token") ||
		null
	);
};

const formatCurrency = (value) => {
	const numeric = Number(value ?? 0);
	if (!Number.isFinite(numeric)) {
		return "R$ 0,00";
	}
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
		minimumFractionDigits: 2,
	}).format(numeric);
};

const formatDateTime = (value) => {
	if (!value) return "Data não informada";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	const formattedDate = date.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	const formattedTime = date.toLocaleTimeString("pt-BR", {
		hour: "2-digit",
		minute: "2-digit",
	});

	return `${formattedDate} • ${formattedTime}`;
};

const resolveAluguelId = (aluguel) => {
	if (!aluguel) return null;
	return (
		aluguel.id ??
		aluguel.IdAluguel ??
		aluguel.raw?.IdAluguel ??
		aluguel.raw?.idAluguel ??
		null
	);
};

  export default function Avaliacoes() {
  	const navigate = useNavigate();
  	const [token, setToken] = useState(() => resolveToken());
  	const [alugueis, setAlugueis] = useState([]);
  	const [anuncios, setAnuncios] = useState({});
  	const [loading, setLoading] = useState(false);
  	const [feedback, setFeedback] = useState({ error: "", success: "" });
  	const [showPendingOnly, setShowPendingOnly] = useState(true);

  	const userId = useMemo(() => {
  		if (!token) return null;
  		const candidate = getUserIdFromToken(token);
  		if (candidate === null || candidate === undefined || candidate === "") {
  			return null;
  		}
  		const numeric = Number(candidate);
  		return Number.isFinite(numeric) ? numeric : null;
  	}, [token]);

  	useEffect(() => {
  		const handleStorage = () => setToken(resolveToken());
  		window.addEventListener("storage", handleStorage);
  		setToken(resolveToken());
  		return () => window.removeEventListener("storage", handleStorage);
  	}, []);

  	useEffect(() => {
  		if (!userId) {
  			setAlugueis([]);
  			return;
  		}

  		let active = true;
  		setLoading(true);
  		setFeedback({ error: "", success: "" });

  		const loadAlugueis = async () => {
  			try {
  				const response = await aluguelService.get(1, 200);
  				if (!active) return;
  				const meus = response.filter((item) => Number(item.contratanteId) === Number(userId));
  				setAlugueis(meus);

  				const ids = Array.from(
  					new Set(
  						meus
  							.map((item) => Number(item.anuncioId))
  							.filter((id) => Number.isFinite(id) && id > 0)
  					)
  				);

  				if (ids.length > 0) {
  					const detalhes = await Promise.all(
  						ids.map(async (id) => {
  							try {
  								const raw = await anunciosService.getById(id);
  								return raw ? { id, data: mapAnuncioFromBackend(raw) } : null;
  							} catch (error) {
  								console.error(`Erro ao buscar anúncio ${id}`, error);
  								return null;
  							}
  						})
  					);

  					const mapped = {};
  					detalhes.filter(Boolean).forEach((entry) => {
  						mapped[entry.id] = entry.data;
  					});
  					setAnuncios((prev) => ({ ...prev, ...mapped }));
  				}
  			} catch (err) {
  				console.error("Erro ao carregar alugueis para avaliação", err);
  				setFeedback({
  					error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar seus alugueis.",
  					success: "",
  				});
  			} finally {
  				if (active) {
  					setLoading(false);
  				}
  			}
  		};

  		loadAlugueis();
  		return () => {
  			active = false;
  		};
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

  	const filteredAlugueis = useMemo(() => {
  		const predicate = (item) => item.avaliacao === null || item.avaliacao === undefined;
  		return showPendingOnly ? alugueis.filter(predicate) : alugueis;
  	}, [alugueis, showPendingOnly]);

  	const handleEvaluate = (aluguel) => {
  		const id = resolveAluguelId(aluguel);
  		if (!id) return;
  		navigate(`/avaliacoes/${id}`);
  	};

	return (
		<div className="avaliacoes-container">
			<header className="avaliacoes-header">
				<div className="brand" onClick={() => navigate("/")}>
					<div className="brand-icon">
						<Logo size={32} />
					</div>
					<div>
						<h1>RentKeeper</h1>
						<p>Avaliações de Aluguel</p>
					</div>
				</div>

				<div className="header-actions">
					<button type="button" className="header-link" onClick={() => navigate("/minhas-contratacoes")}>
						Minhas contratações
					</button>
					<UserMenu />
				</div>
			</header>

			<main className="avaliacoes-main">
				<section className="avaliacoes-section">
					<div className="section-header">
						<div>
							<h2>Notas para goleiros contratados</h2>
							<p>Revise os jogos e mantenha suas avaliações sempre em dia.</p>
						</div>
						<div className="section-actions">
							<button
								type="button"
								className={`filter-btn ${showPendingOnly ? "active" : ""}`}
								onClick={() => setShowPendingOnly((prev) => !prev)}
							>
								<Filter size={16} /> {showPendingOnly ? "Exibindo pendentes" : "Exibindo todos"}
							</button>
						</div>
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

					{loading ? (
						<div className="avaliacoes-loading">
							<Loader2 className="spinner" size={20} />
							<span>Carregando suas avaliações...</span>
						</div>
					) : filteredAlugueis.length === 0 ? (
						<div className="avaliacoes-empty">
							<p>
								{showPendingOnly
									? "Nenhum goleiro aguardando avaliação."
									: "Nenhum aluguel encontrado para exibição."}
							</p>
							{showPendingOnly && (
								<button type="button" className="link-btn" onClick={() => setShowPendingOnly(false)}>
									Ver todos os registros
								</button>
							)}
						</div>
					) : (
						<ul className="avaliacoes-list">
							{filteredAlugueis.map((item) => {
								const anuncio = anuncios[item.anuncioId];
								const titulo = anuncio?.titulo ?? anuncio?.nome ?? `Anúncio #${item.anuncioId}`;
								const local = anuncio?.localPartida ?? anuncio?.localizacao ?? "Local a combinar";
								const horario = anuncio?.dataHoraPartida ?? item.raw?.DataHora ?? item.raw?.dataHora;
								const avaliacao = item.avaliacao ?? item.raw?.AvaliacaoJogador ?? null;
								const valor = item.valor ?? item.raw?.ValorAluguel ?? item.raw?.valorAluguel;

								return (
									<li key={resolveAluguelId(item)} className="avaliacao-card">
										<div className="avaliacao-header">
											<div>
												<h3>{titulo}</h3>
												<p>{local}</p>
											</div>
											<span className="avaliacao-price">{formatCurrency(valor)}</span>
										</div>

										<div className="avaliacao-body">
											<div className="avaliacao-info">
												<Calendar size={16} />
												<span>{formatDateTime(horario)}</span>
											</div>
											<div className="avaliacao-info">
												<MapPin size={16} />
												<span>{local}</span>
											</div>
											<div className="avaliacao-info">
												<DollarSign size={16} />
												<span>Valor contratado: {formatCurrency(valor)}</span>
											</div>
										</div>

										<div className="avaliacao-footer">
											<div className={`avaliacao-status ${avaliacao ? "avaliado" : "pendente"}`}>
												<Star size={16} />
												<span>{avaliacao ? `Nota registrada: ${avaliacao}` : "Avaliação pendente"}</span>
											</div>
											<button type="button" className="avaliar-btn" onClick={() => handleEvaluate(item)}>
												{avaliacao ? "Editar avaliação" : "Avaliar goleiro"}
											</button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</section>
			</main>
		</div>
	);
}
