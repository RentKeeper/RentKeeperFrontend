import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Search,
	MapPin,
	Calendar,
	Clock3,
	DollarSign,
	Loader2,
	AlertCircle,
	RefreshCcw,
	CheckCircle,
	User,
	Phone,
	Mail,
	QrCode,
	Star,
} from "lucide-react";
import Cookies from "js-cookie";
import "./ReservasContratante.css";
import { aluguelService } from "../services/aluguel";
import { anunciosService } from "../services/anuncios";
import { usuariosService } from "../services/usuarios";
import { mapAnuncioFromBackend } from "../utils/anuncioMapper";
import { getUserIdFromToken } from "../utils/jwt";
import UserMenu from "../components/UserMenu";
import Logo from "../components/Logo";

const resolveNumber = (value) => {
	if (value === null || value === undefined || value === "") {
		return null;
	}
	const numeric = Number(value);
	return Number.isFinite(numeric) ? numeric : null;
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

const resolveToken = () => {
	if (typeof window === "undefined") return null;
	return (
		Cookies.get("token") ||
		localStorage.getItem("token") ||
		sessionStorage.getItem("token") ||
		null
	);
};

export default function ReservasContratante() {
	const navigate = useNavigate();
	const [token, setToken] = useState(() => resolveToken());
	const [reservas, setReservas] = useState([]);
	const [anunciosPorId, setAnunciosPorId] = useState({});
	const [jogadores, setJogadores] = useState({});
	const [searchTerm, setSearchTerm] = useState("");
	const [loadingReservas, setLoadingReservas] = useState(true);
	const [loadingJogadores, setLoadingJogadores] = useState(false);
	const [loadingAnuncios, setLoadingAnuncios] = useState(false);
	const [feedback, setFeedback] = useState({ error: "", success: "" });
	const mountedRef = useRef(true);

	const userId = useMemo(() => {
		if (!token) return null;
		const candidate = getUserIdFromToken(token);
		if (candidate === null || candidate === undefined || candidate === "") {
			return null;
		}
		const numeric = Number(candidate);
		return Number.isFinite(numeric) ? numeric : null;
	}, [token]);

	const resolveAnuncio = (anuncioId) => anunciosPorId[anuncioId] ?? null;
	const resolveJogador = (usuarioId) => jogadores[usuarioId] ?? null;

	const filteredReservas = useMemo(() => {
		if (!searchTerm.trim()) return reservas;
		const term = searchTerm.toLowerCase();
		return reservas.filter((reserva) => {
			const anuncio = resolveAnuncio(reserva.anuncioId);
			const jogador = resolveJogador(anuncio?.usuarioId);
			const campos = [
				anuncio?.titulo,
				anuncio?.posicao,
				anuncio?.localPartida,
				anuncio?.localizacao,
				jogador?.nome,
				jogador?.email,
				jogador?.telefone,
			]
				.filter(Boolean)
				.map((text) => String(text).toLowerCase());
			return campos.some((text) => text.includes(term));
		});
	}, [reservas, anunciosPorId, jogadores, searchTerm]);

	useEffect(() => {
		const handleStorage = () => setToken(resolveToken());
		window.addEventListener("storage", handleStorage);
		setToken(resolveToken());
		return () => {
			mountedRef.current = false;
			window.removeEventListener("storage", handleStorage);
		};
	}, []);

	useEffect(() => {
		if (!userId) {
			setReservas([]);
			return;
		}

		let active = true;

		const loadReservas = async () => {
			setLoadingReservas(true);
			setFeedback((prev) => ({ ...prev, error: "" }));
			try {
				const response = await aluguelService.get(1, 200);
				if (!active) return;
				const minhas = response.filter((item) => resolveNumber(item.contratanteId) === userId);
				setReservas(minhas);
			} catch (err) {
				if (!active) return;
				console.error("Erro ao carregar reservas do contratante", err);
				setFeedback((prev) => ({
					...prev,
					error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar suas reservas.",
				}));
			} finally {
				if (active) {
					setLoadingReservas(false);
				}
			}
		};

		loadReservas();

		return () => {
			active = false;
		};
	}, [userId]);

	useEffect(() => {
		if (reservas.length === 0) return;
		const anuncioIds = Array.from(
			new Set(
				reservas
					.map((item) => resolveNumber(item.anuncioId))
					.filter(Boolean)
			)
		);
		const missingAnuncios = anuncioIds.filter((id) => !anunciosPorId[id]);
		if (missingAnuncios.length === 0) return;

		let active = true;
		setLoadingAnuncios(true);

		const loadAnuncios = async () => {
			try {
				const response = await anunciosService.get(1, 200);
				if (!active) return;
				const mapped = response.map((item) => {
					const normalized = mapAnuncioFromBackend(item);
					const anuncioId =
						resolveNumber(item?.IdAnuncio) ??
						resolveNumber(item?.id) ??
						resolveNumber(item?.anuncioId) ??
						resolveNumber(normalized?.id);
					return {
						...normalized,
						anuncioId,
						usuarioId: resolveNumber(item?.UsuarioId ?? item?.usuarioId ?? normalized?.usuarioId),
					};
				});
				const selected = mapped.filter((item) => missingAnuncios.includes(item.anuncioId));
				const mapEntries = {};
				selected.forEach((item) => {
					if (item.anuncioId) {
						mapEntries[item.anuncioId] = item;
					}
				});
				setAnunciosPorId((prev) => ({ ...prev, ...mapEntries }));
			} catch (err) {
				if (!active) return;
				console.error("Erro ao carregar anúncios contratados", err);
				setFeedback((prev) => ({
					...prev,
					error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar detalhes dos anúncios.",
				}));
			} finally {
				if (active) {
					setLoadingAnuncios(false);
				}
			}
		};

		loadAnuncios();

		return () => {
			active = false;
		};
	}, [reservas, anunciosPorId]);

	useEffect(() => {
		const anuncioUsuarios = Array.from(
			new Set(
				Object.values(anunciosPorId)
					.map((item) => resolveNumber(item.usuarioId))
					.filter(Boolean)
			)
		);
		if (anuncioUsuarios.length === 0) return;
		const missing = anuncioUsuarios.filter((id) => !jogadores[id]);
		if (missing.length === 0) return;

		let active = true;
		setLoadingJogadores(true);

		const loadJogadores = async () => {
			try {
				const results = await Promise.all(
					missing.map(async (id) => {
						try {
							const data = await usuariosService.getById(id);
							return { id, data };
						} catch (err) {
							console.error(`Erro ao buscar jogador ${id}`, err);
							return { id, data: null };
						}
					})
				);

				if (!active) return;

				const mapped = {};
				results.forEach(({ id, data }) => {
					if (data) {
						mapped[id] = data;
					}
				});

				if (Object.keys(mapped).length > 0) {
					setJogadores((prev) => ({ ...prev, ...mapped }));
				}
			} finally {
				if (active) {
					setLoadingJogadores(false);
				}
			}
		};

		loadJogadores();

		return () => {
			active = false;
		};
	}, [anunciosPorId, jogadores]);

	const handleRefresh = async () => {
		if (!userId) return;
		setFeedback((prev) => ({ ...prev, error: "", success: "" }));
		setLoadingReservas(true);
		try {
			const alugueis = await aluguelService.get(1, 200);
			const minhas = alugueis.filter((item) => resolveNumber(item.contratanteId) === userId);
			setReservas(minhas);
			setFeedback((prev) => ({ ...prev, success: "Reservas atualizadas." }));
		} catch (err) {
			console.error("Erro ao atualizar reservas de contratante", err);
			setFeedback((prev) => ({
				...prev,
				error: err?.response?.data?.mensagem ?? err?.message ?? "Não foi possível atualizar as reservas.",
			}));
		} finally {
			setLoadingReservas(false);
		}
	};

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

	return (
		<div className="reservas-contratante-container">
			<header className="reservas-contratante-header">
				<div className="brand" onClick={() => navigate("/")}>
					<div className="brand-icon">
						<Logo size={32} />
					</div>
					<div>
						<h1>RentKeeper</h1>
						<p>Minhas Contratações</p>
					</div>
				</div>

				<div className="header-actions">
					<button type="button" className="header-link" onClick={() => navigate("/anuncios")}>Explorar anúncios</button>
					<button type="button" className="header-link" onClick={() => navigate("/aluguel")}>Contratar goleiro</button>
					<UserMenu />
				</div>
			</header>

			<main className="reservas-contratante-main">
				<section className="reservas-contratante-section">
					<div className="section-header">
						<div>
							<h2>Suas contratações</h2>
							<p>Revise os detalhes dos goleiros que você contratou.</p>
						</div>
						<div className="section-actions">
							<div className="search-box">
								<Search size={16} />
								<input
									type="text"
									placeholder="Buscar por goleiro, posição ou local..."
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
								/>
							</div>
							<button type="button" className="refresh-btn" onClick={handleRefresh}>
								{loadingReservas ? <Loader2 className="spinner" size={18} /> : <RefreshCcw size={18} />}
							</button>
						</div>
					</div>

					<div className="stats-row">
						<div className="stat-card">
							<span className="stat-label">Reservas ativas</span>
							<strong className="stat-value">{reservas.length}</strong>
						</div>
						<div className="stat-card">
							<span className="stat-label">Goleiros diferentes</span>
							<strong className="stat-value">{Object.keys(jogadores).length}</strong>
						</div>
						<div className="stat-card">
							<span className="stat-label">Total comprometido</span>
							<strong className="stat-value">{formatCurrency(reservas.reduce((total, reserva) => total + (Number(reserva.valor) || 0), 0))}</strong>
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

					{!userId ? (
						<div className="reservas-empty">
							<p>Entre em sua conta para visualizar as contratações realizadas.</p>
							<button type="button" className="link-btn" onClick={() => navigate("/login")}>
								Fazer login
							</button>
						</div>
					) : loadingReservas || loadingAnuncios || loadingJogadores ? (
						<div className="reservas-loader">
							<Loader2 className="spinner" size={32} />
							<p>Carregando suas contratações...</p>
						</div>
					) : reservas.length === 0 ? (
						<div className="reservas-empty">
							<p>Você ainda não contratou nenhum goleiro.</p>
							<button type="button" className="link-btn" onClick={() => navigate("/anuncios")}>
								Explorar goleiros
							</button>
						</div>
					) : filteredReservas.length === 0 ? (
						<div className="reservas-empty">
							<p>Nenhum resultado encontrado para a busca aplicada.</p>
						</div>
					) : (
						<div className="reservas-grid">
							{filteredReservas.map((reserva) => {
								const anuncio = resolveAnuncio(reserva.anuncioId);
								const jogador = resolveJogador(anuncio?.usuarioId);
								const avaliacao =
									reserva?.avaliacao ??
									reserva?.raw?.AvaliacaoJogador ??
									reserva?.raw?.avaliacaoJogador ??
									null;
								const aluguelId =
									reserva?.id ??
									reserva?.raw?.IdAluguel ??
									reserva?.raw?.idAluguel ??
									null;
								return (
									<div className="reserva-card" key={`${reserva.id}-${reserva.anuncioId}`}>
										<div className="reserva-header">
											<div>
												<h3>{anuncio?.titulo ?? `Anúncio #${reserva.anuncioId}`}</h3>
												<span>{anuncio?.posicao ?? "Posição não informada"}</span>
											</div>
											<div className="reserva-price">{formatCurrency(reserva.valor)}</div>
										</div>

										<div className="reserva-body">
											<div className="info-row">
												<MapPin size={16} />
												<span>{anuncio?.localPartida ?? anuncio?.localizacao ?? "Local a combinar"}</span>
											</div>
											<div className="info-row">
												<Calendar size={16} />
												<span>{formatDateTime(anuncio?.dataHoraPartida)}</span>
											</div>
											<div className="info-row">
												<Clock3 size={16} />
												<span>
													{Array.isArray(anuncio?.disponibilidade) && anuncio.disponibilidade.length > 0
														? anuncio.disponibilidade.join(", ")
														: "Horários sob consulta"}
												</span>
											</div>
										</div>

										<div className="reserva-divider" />

										<div className="reserva-footer">
											<div className="jogador-info">
												<h4>Dados do goleiro</h4>
												<div className="info-row">
													<User size={16} />
													<span>{jogador?.nome ?? "Nome não informado"}</span>
												</div>
												<div className="info-row">
													<Mail size={16} />
													<span>{jogador?.email ?? "Email não informado"}</span>
												</div>
												<div className="info-row">
													<Phone size={16} />
													<span>{jogador?.telefone ?? "Telefone não informado"}</span>
												</div>
												<div className="info-row">
													<QrCode size={16} />
													<span>
														{jogador?.chavePix
															? `Chave PIX: ${jogador.chavePix}`
															: "Chave PIX não informada"}
													</span>
												</div>
											</div>
											<div className="contrato-info">
												<h4>Detalhes do contrato</h4>
												<div className="info-row">
													<DollarSign size={16} />
													<span>Valor pago: {formatCurrency(reserva.valor)}</span>
												</div>
												<div className="info-row">
													<Calendar size={16} />
													<span>Contratado em: {formatDateTime(reserva.raw?.dataCriacao ?? reserva.raw?.DataCriacao)}</span>
												</div>
											</div>

											<div className="avaliacao-info">
												<h4>Avaliação</h4>
												<div className={`avaliacao-status ${avaliacao ? "avaliado" : "pendente"}`}>
													<Star size={16} />
													<span>{avaliacao ? `Nota registrada: ${avaliacao}` : "Avaliação pendente"}</span>
												</div>
												<button
													type="button"
													className="avaliar-btn"
													onClick={() => {
														if (!aluguelId) return;
														navigate(`/avaliacoes/${aluguelId}`);
													}}
												>
													{avaliacao ? "Editar avaliação" : "Avaliar goleiro"}
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
