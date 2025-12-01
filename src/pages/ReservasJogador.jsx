import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Search,
	MapPin,
	Calendar,
	Clock3,
	DollarSign,
	User,
	Mail,
	Phone,
	QrCode,
	Loader2,
	AlertCircle,
	RefreshCcw,
	CheckCircle,
	CheckCircle2,
	Trash2,
} from "lucide-react";
import Cookies from "js-cookie";
import "./ReservasJogador.css";
import { anunciosService } from "../services/anuncios";
import { aluguelService } from "../services/aluguel";
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

export default function ReservasJogador() {
	const navigate = useNavigate();
	const [token, setToken] = useState(() => resolveToken());
	const [anunciosJogador, setAnunciosJogador] = useState([]);
	const [reservas, setReservas] = useState([]);
	const [contratantes, setContratantes] = useState({});
	const [loadingAnuncios, setLoadingAnuncios] = useState(true);
	const [loadingReservas, setLoadingReservas] = useState(true);
	const [loadingContratantes, setLoadingContratantes] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [feedback, setFeedback] = useState({ error: "", success: "" });
	const [confirmedReservas, setConfirmedReservas] = useState(() => new Set());
	const [deletingAnuncios, setDeletingAnuncios] = useState(() => new Set());
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

	const anuncioMap = useMemo(() => {
		return new Map(
			anunciosJogador.map((item) => [resolveNumber(item.anuncioId ?? item.id), item])
		);
	}, [anunciosJogador]);

	const filteredReservas = useMemo(() => {
		if (!searchTerm.trim()) return reservas;
		const term = searchTerm.toLowerCase();
		return reservas.filter((reserva) => {
			const anuncio = anuncioMap.get(resolveNumber(reserva.anuncioId));
			const contratante = contratantes[reserva.contratanteId] ?? {};
			const source = [
				anuncio?.titulo,
				anuncio?.localPartida,
				anuncio?.posicao,
				contratante?.nome,
				contratante?.email,
				contratante?.telefone,
			]
				.filter(Boolean)
				.map((text) => String(text).toLowerCase());
			return source.some((text) => text.includes(term));
		});
	}, [reservas, anuncioMap, contratantes, searchTerm]);

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
			setAnunciosJogador([]);
			setReservas([]);
			return;
		}

		let active = true;

		const loadAnuncios = async () => {
			setLoadingAnuncios(true);
			setFeedback((prev) => ({ ...prev, error: "" }));

			try {
				const response = await anunciosService.get(1, 100);
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
						anuncioId: anuncioId,
						usuarioId: resolveNumber(item?.UsuarioId ?? item?.usuarioId ?? normalized?.usuarioId),
					};
				});

				const apenasDoJogador = mapped.filter(
					(item) => resolveNumber(item.usuarioId) === userId
				);

				setAnunciosJogador(apenasDoJogador);
			} catch (err) {
				if (!active) return;
				console.error("Erro ao carregar anúncios do jogador", err);
				setFeedback((prev) => ({
					...prev,
					error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar anúncios do jogador.",
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
	}, [userId]);

	useEffect(() => {
		if (!userId) return;
		if (anunciosJogador.length === 0) {
			setReservas([]);
			setLoadingReservas(false);
			return;
		}

		let active = true;
		const anuncioIds = anunciosJogador
			.map((item) => resolveNumber(item.anuncioId ?? item.id))
			.filter(Boolean);

		const loadReservas = async () => {
			setLoadingReservas(true);
			try {
				const response = await aluguelService.get(1, 200);
				if (!active) return;
				const filtro = new Set(anuncioIds);
				const apenasMeus = response.filter((item) => filtro.has(resolveNumber(item.anuncioId)));
				setReservas(apenasMeus);
			} catch (err) {
				if (!active) return;
				console.error("Erro ao carregar reservas", err);
				setFeedback((prev) => ({
					...prev,
					error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar reservas recebidas.",
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
	}, [userId, anunciosJogador]);

	useEffect(() => {
		if (reservas.length === 0) return;
		const uniqueIds = Array.from(
			new Set(
				reservas
					.map((item) => resolveNumber(item.contratanteId))
					.filter((id) => id)
			)
		);
		const missingIds = uniqueIds.filter((id) => !contratantes[id]);
		if (missingIds.length === 0) return;

		let active = true;

		const loadContratantes = async () => {
			setLoadingContratantes(true);
			try {
				const results = await Promise.all(
					missingIds.map(async (id) => {
						try {
							const data = await usuariosService.getById(id);
							return { id, data };
						} catch (err) {
							console.error(`Erro ao buscar contratante ${id}`, err);
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
					setContratantes((prev) => ({ ...prev, ...mapped }));
				}
			} finally {
				if (active) {
					setLoadingContratantes(false);
				}
			}
		};

		loadContratantes();

		return () => {
			active = false;
		};
	}, [reservas, contratantes]);

	const handleRefresh = async () => {
		if (!userId) return;
		setFeedback((prev) => ({ ...prev, error: "", success: "" }));
		setLoadingAnuncios(true);
		setLoadingReservas(true);
		try {
			const anuncios = await anunciosService.get(1, 100);
			const mapped = anuncios.map((item) => {
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
			const apenasDoJogador = mapped.filter((item) => resolveNumber(item.usuarioId) === userId);
			setAnunciosJogador(apenasDoJogador);

			const anuncioIds = apenasDoJogador.map((item) => resolveNumber(item.anuncioId ?? item.id)).filter(Boolean);
			if (anuncioIds.length === 0) {
				setReservas([]);
				return;
			}

			const alugueis = await aluguelService.get(1, 200);
			const filtro = new Set(anuncioIds);
			const apenasMeus = alugueis.filter((item) => filtro.has(resolveNumber(item.anuncioId)));
			setReservas(apenasMeus);
			setFeedback((prev) => ({ ...prev, success: "Reservas atualizadas." }));
		} catch (err) {
			console.error("Erro ao atualizar reservas", err);
			setFeedback((prev) => ({
				...prev,
				error: err?.response?.data?.mensagem ?? err?.message ?? "Não foi possível atualizar as reservas.",
			}));
		} finally {
			setLoadingAnuncios(false);
			setLoadingReservas(false);
		}
	};

	const handleConfirmReserva = (aluguelId) => {
		const parsed = resolveNumber(aluguelId);
		if (!parsed) return;
		setConfirmedReservas((prev) => {
			const next = new Set(prev);
			next.add(parsed);
			return next;
		});
		setFeedback((prev) => ({ ...prev, error: "", success: "Reserva marcada como confirmada." }));
	};

	const handleDeleteAnuncio = async (anuncioId) => {
		const parsed = resolveNumber(anuncioId);
		if (!parsed) return;
		const confirmed =
			typeof window === "undefined"
				? true
				: window.confirm("Tem certeza de que deseja apagar este anúncio? Reservas associadas deixarão de aparecer.");
		if (!confirmed) return;

		setFeedback((prev) => ({ ...prev, error: "", success: "" }));
		setDeletingAnuncios((prev) => {
			const next = new Set(prev);
			next.add(parsed);
			return next;
		});

		try {
			await anunciosService.remove(parsed);
			setAnunciosJogador((prev) => prev.filter((item) => resolveNumber(item.anuncioId ?? item.id) !== parsed));
			setReservas((prev) => prev.filter((item) => resolveNumber(item.anuncioId) !== parsed));
			setConfirmedReservas((prev) => {
				const next = new Set(prev);
				for (const reserva of reservas) {
					const reservaAnuncio = resolveNumber(reserva?.anuncioId);
					if (reservaAnuncio === parsed) {
						const aluguelId =
							resolveNumber(reserva?.id) ??
							resolveNumber(reserva?.raw?.IdAluguel ?? reserva?.raw?.idAluguel);
						if (aluguelId) {
							next.delete(aluguelId);
						}
					}
				}
				return next;
			});
			setFeedback((prev) => ({ ...prev, success: "Anúncio removido com sucesso." }));
		} catch (err) {
			console.error("Erro ao remover anúncio", err);
			setFeedback((prev) => ({
				...prev,
				error: err?.response?.data?.mensagem ?? err?.message ?? "Não foi possível remover o anúncio.",
			}));
		} finally {
			setDeletingAnuncios((prev) => {
				const next = new Set(prev);
				next.delete(parsed);
				return next;
			});
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
		<div className="reservas-container">
			<header className="reservas-header">
				<div className="brand" onClick={() => navigate("/")}>
					<div className="brand-icon">
						<Logo size={32} />
					</div>
					<div>
						<h1>RentKeeper</h1>
						<p>Reservas Recebidas</p>
					</div>
				</div>

				<div className="header-actions">
					<button type="button" className="header-link" onClick={() => navigate("/anuncios")}>
						Ver anúncios
					</button>
					<button type="button" className="header-link" onClick={() => navigate("/criar-anuncio")}>
						Criar anúncio
					</button>
					<UserMenu />
				</div>
			</header>

			<main className="reservas-main">
				<section className="reservas-section">
					<div className="section-header">
						<div>
							<h2>Suas reservas</h2>
							<p>Acompanhe quem contratou seus serviços como goleiro.</p>
						</div>
						<div className="section-actions">
							<div className="search-box">
								<Search size={16} />
								<input
									type="text"
									placeholder="Buscar por jogador, anúncio ou local..."
									value={searchTerm}
									onChange={(event) => setSearchTerm(event.target.value)}
								/>
							</div>
							<button type="button" className="refresh-btn" onClick={handleRefresh}>
								{(loadingAnuncios || loadingReservas) ? (
									<Loader2 className="spinner" size={18} />
								) : (
									<RefreshCcw size={18} />
								)}
							</button>
						</div>
					</div>

					<div className="stats-row">
						<div className="stat-card">
							<span className="stat-label">Anúncios ativos</span>
							<strong className="stat-value">{anunciosJogador.length}</strong>
						</div>
						<div className="stat-card">
							<span className="stat-label">Reservas recebidas</span>
							<strong className="stat-value">{reservas.length}</strong>
						</div>
						<div className="stat-card">
							<span className="stat-label">Clientes conhecidos</span>
							<strong className="stat-value">{Object.keys(contratantes).length}</strong>
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
							<p>Entre em sua conta de goleiro para visualizar as reservas recebidas.</p>
							<button type="button" className="link-btn" onClick={() => navigate("/login")}>
								Fazer login
							</button>
						</div>
					) : loadingAnuncios || loadingReservas || loadingContratantes ? (
						<div className="reservas-loader">
							<Loader2 className="spinner" size={32} />
							<p>Carregando suas reservas...</p>
						</div>
					) : reservas.length === 0 ? (
						<div className="reservas-empty">
							<p>Nenhuma reserva identificada para os seus anúncios.</p>
							<button type="button" className="link-btn" onClick={() => navigate("/criar-anuncio")}>
								Criar novo anúncio
							</button>
						</div>
					) : filteredReservas.length === 0 ? (
						<div className="reservas-empty">
							<p>Nenhuma reserva corresponde à busca aplicada.</p>
						</div>
					) : (
						<div className="reservas-grid">
							{filteredReservas.map((reserva) => {
								const anuncio = anuncioMap.get(resolveNumber(reserva.anuncioId));
								const contratante = contratantes[reserva.contratanteId] ?? {};
								const aluguelId =
									reserva?.id ??
									reserva?.raw?.IdAluguel ??
									reserva?.raw?.idAluguel ??
									null;
								const anuncioId =
									resolveNumber(anuncio?.anuncioId) ??
									resolveNumber(anuncio?.id) ??
									resolveNumber(reserva.anuncioId);
								const isConfirmada = confirmedReservas.has(resolveNumber(aluguelId));
								const isDeleting = deletingAnuncios.has(resolveNumber(anuncioId));
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
											<div className="contratante-info">
												<h4>Dados do contratante</h4>
												<div className="info-row">
													<User size={16} />
													<span>{contratante?.nome ?? "Nome não informado"}</span>
												</div>
												<div className="info-row">
													<Mail size={16} />
													<span>{contratante?.email ?? "Email não informado"}</span>
												</div>
												<div className="info-row">
													<Phone size={16} />
													<span>{contratante?.telefone ?? "Telefone não informado"}</span>
												</div>
												<div className="info-row">
													<QrCode size={16} />
													<span>
														{contratante?.chavePix
															? `Chave PIX: ${contratante.chavePix}`
															: "Chave PIX não informada"}
													</span>
												</div>
											</div>
											<div className="contrato-info">
												<h4>Detalhes do contrato</h4>
												<div className="info-row">
													<DollarSign size={16} />
													<span>Valor acordado: {formatCurrency(reserva.valor)}</span>
												</div>
												<div className="info-row">
													<Calendar size={16} />
													<span>Criado em: {formatDateTime(reserva.raw?.dataCriacao ?? reserva.raw?.DataCriacao)}</span>
												</div>
											</div>
											<div className="reserva-actions">
												<h4>Ações do anúncio</h4>
												<p>Confirme o atendimento ou remova o anúncio se não desejar mais ofertas.</p>
												<div className="reserva-actions-buttons">
													<button
														type="button"
														className={`confirmar-btn${isConfirmada ? " confirmada" : ""}`}
														onClick={() => handleConfirmReserva(aluguelId)}
														disabled={isConfirmada || isDeleting}
													>
														<CheckCircle2 size={16} />
														<span>{isConfirmada ? "Reserva confirmada" : "Confirmar atendimento"}</span>
													</button>
													<button
														type="button"
														className="excluir-btn"
														onClick={() => handleDeleteAnuncio(anuncioId)}
														disabled={isDeleting}
													>
														{isDeleting ? (
															<>
																<Loader2 className="spinner" size={16} />
																<span>Removendo...</span>
															</>
														) : (
															<>
																<Trash2 size={16} />
																<span>Excluir anúncio</span>
															</>
														)}
													</button>
												</div>
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
