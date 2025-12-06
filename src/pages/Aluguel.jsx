import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	ArrowLeft,
	Search,
	Calendar,
	Clock3,
	MapPin,
	DollarSign,
	Star,
	Trash2,
	Loader2,
	CheckCircle,
	QrCode,
} from "lucide-react";
import Cookies from "js-cookie";
import { anunciosService } from "../services/anuncios";
import { aluguelService } from "../services/aluguel";
import { usuariosService } from "../services/usuarios";
import { mapAnuncioFromBackend } from "../utils/anuncioMapper";
import { getUserIdFromToken } from "../utils/jwt";
import UserMenu from "../components/UserMenu";
import Logo from "../components/Logo";
import "./Aluguel.css";

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

export default function Aluguel() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [token, setToken] = useState(() => resolveToken());
	const [anuncios, setAnuncios] = useState([]);
	const [selectedAnuncioIds, setSelectedAnuncioIds] = useState([]);
	const [usuariosPorAnuncio, setUsuariosPorAnuncio] = useState({});
	const [formState, setFormState] = useState({});
	const [formFeedback, setFormFeedback] = useState({});
	const [alugueis, setAlugueis] = useState([]);
	const [loadingAnuncios, setLoadingAnuncios] = useState(true);
	const [loadingAlugueis, setLoadingAlugueis] = useState(true);
	const [removingId, setRemovingId] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
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

	useEffect(() => {
		const handleStorage = () => setToken(resolveToken());
		window.addEventListener("storage", handleStorage);
		setToken(resolveToken());
		return () => {
			mountedRef.current = false;
			window.removeEventListener("storage", handleStorage);
		};
	}, []);

	const initialAnuncioIds = useMemo(() => {
		const ids = new Set();
		const directParams = searchParams.getAll("anuncioId");
		directParams.forEach((value) => {
			const numeric = resolveNumber(value);
			if (numeric) ids.add(numeric);
		});

		const combined = searchParams.get("anuncioIds") ?? searchParams.get("anuncios") ?? null;
		if (combined) {
			combined
				.split(",")
				.map((value) => resolveNumber(value))
				.filter((numeric) => numeric)
				.forEach((numeric) => ids.add(numeric));
		}

		const legacySingle = searchParams.get("anuncio") ?? searchParams.get("id") ?? null;
		const numericLegacy = resolveNumber(legacySingle);
		if (numericLegacy) ids.add(numericLegacy);

		return Array.from(ids);
	}, [searchParams]);

	const restrictToSelectedList = initialAnuncioIds.length > 0;
	const hasSelectedIds = selectedAnuncioIds.length > 0;
	const emptySelectionMessage = restrictToSelectedList
		? hasSelectedIds
			? "Nenhum jogador selecionado corresponde à busca atual."
			: "Nenhum jogador selecionado no momento."
		: "Nenhum jogador encontrado com os filtros informados.";

	useEffect(() => {
		const loadAnuncios = async () => {
			setLoadingAnuncios(true);
			try {
				const response = await anunciosService.get(1, 50);
				const mapped = response.map((item) => {
					const enriched = mapAnuncioFromBackend(item);
					const anuncioId =
						resolveNumber(item?.IdAnuncio) ??
						resolveNumber(item?.id) ??
						resolveNumber(item?.anuncioId) ??
						resolveNumber(enriched.id);

					const preco =
						resolveNumber(item?.Preco) ??
						resolveNumber(item?.preco) ??
						resolveNumber(enriched.preco) ??
						0;

					const disponibilidadeList = Array.isArray(item?.Disponibilidade)
						? item.Disponibilidade
						: enriched.horarios;

					return {
						key: anuncioId ?? enriched.id,
						anuncioId,
						titulo: enriched.titulo,
						posicao: enriched.tipo,
						preco,
						rating: enriched.rating,
						reviews: enriched.reviews,
						imagem: enriched.image,
						localizacao: enriched.localizacao,
						localPartida: enriched.localPartida || enriched.localizacao,
						dataHoraPartida: item?.DataHoraPartida ?? item?.dataHoraPartida ?? enriched.dataHoraPartida,
						disponibilidade: disponibilidadeList,
						experiencia: enriched.superficie,
						descricao: enriched.descricao,
						usuarioId: resolveNumber(item?.UsuarioId) ?? resolveNumber(item?.usuarioId) ?? enriched.usuarioId,
						disponivel: enriched.disponivel,
						raw: item,
						mapped: enriched,
					};
				});

				setAnuncios(mapped);
			} catch (err) {
				console.error("Erro ao carregar anúncios", err);
				setFeedback((prev) => ({
					...prev,
					error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar anúncios",
				}));
			} finally {
				setLoadingAnuncios(false);
			}
		};

		loadAnuncios();
	}, []);

	const anunciosMap = useMemo(() => {
		const map = new Map();
		anuncios.forEach((anuncio) => {
			if (anuncio.anuncioId !== null && anuncio.anuncioId !== undefined) {
				map.set(anuncio.anuncioId, anuncio);
			}
		});
		return map;
	}, [anuncios]);

	const loadAlugueis = async () => {
		if (!userId) {
			setAlugueis([]);
			setLoadingAlugueis(false);
			return;
		}

		setLoadingAlugueis(true);
		try {
			const response = await aluguelService.get(1, 50);
			const somenteUsuario = response.filter(
				(item) => item && Number(item.contratanteId) === Number(userId)
			);
			setAlugueis(somenteUsuario);
		} catch (err) {
			console.error("Erro ao carregar aluguéis", err);
			setFeedback((prev) => ({
				...prev,
				error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar aluguéis",
			}));
		} finally {
			setLoadingAlugueis(false);
		}
	};

	useEffect(() => {
		loadAlugueis();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [userId]);

	useEffect(() => {
		if (!anuncios || anuncios.length === 0) return;
		if (!initialAnuncioIds || initialAnuncioIds.length === 0) return;

		const availableSet = new Set(
			anuncios
				.map((item) => item.anuncioId)
				.filter((id) => id !== null && id !== undefined)
		);

		const validIds = initialAnuncioIds.filter((id) => availableSet.has(id));
		if (validIds.length === 0) return;

		setSelectedAnuncioIds((prev) => {
			const merged = new Set(prev);
			validIds.forEach((id) => merged.add(id));
			return Array.from(merged);
		});
	}, [initialAnuncioIds, anuncios]);

	useEffect(() => {
		setFormState((prev) => {
			const next = { ...prev };
			let changed = false;

			selectedAnuncioIds.forEach((id) => {
				if (!next[id]) {
					const anuncio = anuncios.find((item) => item.anuncioId === id);
					next[id] = {
						valor:
							anuncio &&
							anuncio.preco !== undefined &&
							anuncio.preco !== null &&
							!Number.isNaN(Number(anuncio.preco))
								? String(anuncio.preco)
								: "",
						avaliacao: "",
					};
					changed = true;
				}
			});

			Object.keys(next).forEach((key) => {
				const numericKey = Number(key);
				if (!selectedAnuncioIds.includes(numericKey)) {
					delete next[key];
					changed = true;
				}
			});

			return changed ? next : prev;
		});

		setFormFeedback((prev) => {
			const next = { ...prev };
			let changed = false;
			Object.keys(next).forEach((key) => {
				const numericKey = Number(key);
				if (!selectedAnuncioIds.includes(numericKey)) {
					delete next[key];
					changed = true;
				}
			});
			return changed ? next : prev;
		});
	}, [selectedAnuncioIds, anuncios]);

	useEffect(() => {
		setUsuariosPorAnuncio((prev) => {
			const next = { ...prev };
			let changed = false;
			Object.keys(next).forEach((key) => {
				const numericKey = Number(key);
				if (!selectedAnuncioIds.includes(numericKey)) {
					delete next[key];
					changed = true;
				}
			});
			return changed ? next : prev;
		});

		let active = true;
		const fetchUsuarios = async () => {
			const updates = {};
			await Promise.all(
				selectedAnuncioIds.map(async (id) => {
					if (usuariosPorAnuncio[id]) return;
					const anuncio = anuncios.find((item) => item.anuncioId === id);
					if (!anuncio) return;
					const usuarioId = resolveNumber(anuncio.usuarioId ?? anuncio.raw?.UsuarioId ?? anuncio.raw?.usuarioId);
					if (!usuarioId || usuarioId <= 0) return;
					try {
						const usuario = await usuariosService.getById(usuarioId);
						if (active) {
							updates[id] = usuario;
						}
					} catch (err) {
						console.error("Erro ao carregar usuário do anúncio", err);
					}
				})
			);
			if (active && Object.keys(updates).length > 0) {
				setUsuariosPorAnuncio((prev) => ({ ...prev, ...updates }));
			}
		};

		if (selectedAnuncioIds.length > 0) {
			fetchUsuarios();
		}
		return () => {
			active = false;
		};
	}, [selectedAnuncioIds, anuncios, usuariosPorAnuncio]);

	useEffect(() => {
		if (!feedback.success) return undefined;
		const timer = setTimeout(
			() => setFeedback((prev) => ({ ...prev, success: "" })),
			4000
		);
		return () => clearTimeout(timer);
	}, [feedback.success]);

	useEffect(() => {
		if (!feedback.error) return undefined;
		const timer = setTimeout(
			() => setFeedback((prev) => ({ ...prev, error: "" })),
			5000
		);
		return () => clearTimeout(timer);
	}, [feedback.error]);

	const filteredAnuncios = useMemo(() => {
		const term = searchTerm.trim().toLowerCase();
		const base = term
			? anuncios.filter((item) => {
				return [
					item.titulo,
					item.posicao,
					item.localizacao,
					item.localPartida,
					item.experiencia,
				]
					.filter(Boolean)
					.map((text) => String(text).toLowerCase())
					.some((text) => text.includes(term));
			})
			: anuncios;
		if (!restrictToSelectedList) {
			return base;
		}
		const selectedSet = new Set(selectedAnuncioIds.map((id) => resolveNumber(id)).filter(Boolean));
		if (selectedSet.size === 0) {
			return [];
		}
		return base.filter((item) => selectedSet.has(resolveNumber(item.anuncioId)));
	}, [anuncios, restrictToSelectedList, searchTerm, selectedAnuncioIds]);

	const selectedAnuncios = useMemo(() => {
		if (!selectedAnuncioIds || selectedAnuncioIds.length === 0) return [];
		return selectedAnuncioIds
			.map((id) => anuncios.find((item) => item.anuncioId === id))
			.filter(Boolean);
	}, [selectedAnuncioIds, anuncios]);

	const meusAlugueis = useMemo(() => {
		return alugueis.map((item) => {
			const vinculado = anunciosMap.get(Number(item.anuncioId)) ?? null;
			return {
				...item,
				anuncio: vinculado,
			};
		});
	}, [alugueis, anunciosMap]);

	const handleToggleAnuncio = (anuncioId) => {
		const numeric = resolveNumber(anuncioId);
		if (!numeric) {
			setFeedback({ error: "Não foi possível identificar este anúncio.", success: "" });
			return;
		}

		setFeedback((prev) => ({ ...prev, error: "", success: "" }));
		setSelectedAnuncioIds((prev) => {
			if (prev.includes(numeric)) {
				return prev.filter((id) => id !== numeric);
			}
			return [...prev, numeric];
		});
	};

	const handleChangeForm = (anuncioId, event) => {
		const { name, value } = event.target;
		setFormState((prev) => ({
			...prev,
			[anuncioId]: {
				...prev[anuncioId],
				[name]: value,
			},
		}));
	};

	const updateFormFeedback = (anuncioId, payload) => {
		setFormFeedback((prev) => ({
			...prev,
			[anuncioId]: {
				...prev[anuncioId],
				...payload,
			},
		}));
	};

	const handleSubmit = async (event, anuncioId) => {
		event.preventDefault();
		const numeric = resolveNumber(anuncioId);
		if (!numeric) {
			updateFormFeedback(anuncioId, {
				error: "Não foi possível identificar este anúncio.",
				success: "",
			});
			return;
		}

		if (!userId) {
			updateFormFeedback(numeric, {
				error: "É necessário estar autenticado para contratar um jogador.",
				success: "",
			});
			return;
		}

		const currentState = formState[numeric] ?? {};
		const valorNumber = resolveNumber(currentState.valor);
		if (!valorNumber || valorNumber <= 0) {
			updateFormFeedback(numeric, {
				error: "Informe um valor válido para o aluguel.",
				success: "",
			});
			return;
		}

		const avaliacaoNumber = resolveNumber(currentState.avaliacao);
		if (avaliacaoNumber !== null && (avaliacaoNumber < 0 || avaliacaoNumber > 5)) {
			updateFormFeedback(numeric, {
				error: "A avaliação deve estar entre 0 e 5.",
				success: "",
			});
			return;
		}

		setFormState((prev) => {
			const current = prev[numeric] ?? {};
			return {
				...prev,
				[numeric]: {
					...current,
					submitting: true,
				},
			};
		});
		updateFormFeedback(numeric, { error: "", success: "" });

		try {
			const created = await aluguelService.create({
				ValorAluguel: valorNumber,
				AvaliacaoJogador: avaliacaoNumber,
				AnuncioId: numeric,
				ContratanteId: userId,
			});

			updateFormFeedback(numeric, {
				error: "",
				success: "Aluguel registrado com sucesso!",
			});

			setFormState((prev) => ({
				...prev,
				[numeric]: {
					...prev[numeric],
					avaliacao: "",
				},
			}));

			const newId = created?.id ?? created?.raw?.IdAluguel ?? null;
			if (newId) {
				navigate(`/pagamento?aluguelId=${newId}&anuncioId=${numeric}`);
				return;
			}

			setTimeout(() => {
				if (!mountedRef.current) return;
				setFormFeedback((prev) => {
					const current = prev[numeric];
					if (!current || !current.success) return prev;
					return {
						...prev,
						[numeric]: {
							...current,
							success: "",
						},
					};
				});
			}, 4000);
			await loadAlugueis();
		} catch (err) {
			console.error("Erro ao registrar aluguel", err);
			updateFormFeedback(numeric, {
				error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao registrar aluguel.",
				success: "",
			});
			setTimeout(() => {
				if (!mountedRef.current) return;
				setFormFeedback((prev) => {
					const current = prev[numeric];
					if (!current || !current.error) return prev;
					return {
						...prev,
						[numeric]: {
							...current,
							error: "",
						},
					};
				});
			}, 5000);
		} finally {
			setFormState((prev) => {
				const current = prev[numeric] ?? {};
				return {
					...prev,
					[numeric]: {
						...current,
						submitting: false,
					},
				};
			});
		}
	};

	const handleRemove = async (id) => {
		if (!id) return;
		setRemovingId(id);
		setFeedback((prev) => ({ ...prev, error: "", success: "" }));

		try {
			await aluguelService.remove(id);
			setFeedback({ error: "", success: "Aluguel cancelado com sucesso." });
			await loadAlugueis();
		} catch (err) {
			console.error("Erro ao remover aluguel", err);
			setFeedback({
				error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao cancelar aluguel.",
				success: "",
			});
		} finally {
			setRemovingId(null);
		}
	};

	const renderLoader = (label = "Carregando...") => (
		<div className="aluguel-loader">
			<Loader2 className="loader-icon" />
			<span>{label}</span>
		</div>
	);

	return (
		<div className="aluguel-page">
			<header className="aluguel-header">
				<button type="button" className="back-button" onClick={() => navigate(-1)}>
					<ArrowLeft size={18} />
					<span>Voltar</span>
				</button>

				<div className="brand" onClick={() => navigate("/")}>
					<div className="brand-icon">
						<Logo size={32} />
					</div>
					<div>
						<h1>RentKeeper</h1>
						<p>Aluguel de Jogadores</p>
					</div>
				</div>

				<div className="header-actions">
					<button type="button" className="header-link" onClick={() => navigate("/anuncios")}>
						Ver Anúncios
					</button>
					<UserMenu />
				</div>
			</header>

			<main className="aluguel-main">
				<section className="aluguel-section">
					<div className="section-header">
						<div>
							<h2>Escolha os jogadores</h2>
							<p>Selecione um ou mais anúncios para contratar.</p>
						</div>
						<div className="search-box">
							<Search size={16} />
							<input
								type="text"
								placeholder="Buscar por nome, posição ou local..."
								value={searchTerm}
								onChange={(event) => setSearchTerm(event.target.value)}
							/>
						</div>
					</div>

					{loadingAnuncios ? (
						renderLoader("Carregando jogadores...")
					) : filteredAnuncios.length === 0 ? (
						<div className="aluguel-empty-card">
							<p>{emptySelectionMessage}</p>
							{restrictToSelectedList && !hasSelectedIds && (
								<button type="button" className="link-btn" onClick={() => navigate("/anuncios")}>
									Voltar para a lista de goleiros
								</button>
							)}
						</div>
					) : (
						<div className="anuncio-grid">
							{filteredAnuncios.map((anuncio) => {
								const isSelected = selectedAnuncioIds.includes(anuncio.anuncioId);
								return (
									<button
										type="button"
										key={anuncio.anuncioId ?? anuncio.key}
										className={`anuncio-card ${isSelected ? "selected" : ""}`}
										onClick={() => handleToggleAnuncio(anuncio.anuncioId)}
									>
										<div className="card-header">
											<div>
												<h3>{anuncio.titulo}</h3>
												<span className="card-subtitle">{anuncio.posicao}</span>
											</div>
											<div className="card-price">{formatCurrency(anuncio.preco)}</div>
										</div>
										<div className="card-body">
											<div className="card-row">
												<MapPin size={16} />
												<span>{anuncio.localPartida || "Local a combinar"}</span>
											</div>
											<div className="card-row">
												<Calendar size={16} />
												<span>{formatDateTime(anuncio.dataHoraPartida)}</span>
											</div>
											<div className="card-row">
												<Clock3 size={16} />
												<span>
													{Array.isArray(anuncio.disponibilidade) && anuncio.disponibilidade.length > 0
														? anuncio.disponibilidade.slice(0, 3).join(", ")
														: "Horários sob consulta"}
												</span>
											</div>
										</div>
										<div className="card-footer">
											<div className="rating">
												<Star size={14} />
												<span>{anuncio.rating?.toFixed(1) ?? "5.0"}</span>
												<span className="reviews">({anuncio.reviews ?? 0})</span>
											</div>
											{isSelected && (
												<div className="selected-badge">
													<CheckCircle size={14} />
													<span>Selecionado</span>
												</div>
											)}
										</div>
									</button>
								);
							})}
						</div>
					)}
				</section>

				<section className="aluguel-section">
					<div className="section-header">
						<div>
							<h2>Detalhes do aluguel</h2>
							<p>Confirme as informações para finalizar o aluguel.</p>
						</div>
					</div>

					{feedback.error && (
						<div className="feedback error">{feedback.error}</div>
					)}

					{selectedAnuncios.length > 0 ? (
						<div className="detalhes-multiplos">
							{selectedAnuncios.map((anuncio) => {
								const usuario = usuariosPorAnuncio[anuncio.anuncioId];
								const currentState = formState[anuncio.anuncioId] ?? { valor: "", avaliacao: "", submitting: false };
								const currentFeedback = formFeedback[anuncio.anuncioId] ?? { error: "", success: "" };
								const valorInputId = `valor-${anuncio.anuncioId}`;
								const avaliacaoInputId = `avaliacao-${anuncio.anuncioId}`;
								const isSubmitting = Boolean(currentState.submitting);
								return (
									<div className="detalhes-card" key={anuncio.anuncioId ?? anuncio.key}>
										<div className="detalhes-head">
											<div>
												<h3>{anuncio.titulo}</h3>
												<span>{anuncio.posicao}</span>
											</div>
											<div className="detalhes-price">{formatCurrency(anuncio.preco)}</div>
										</div>

										<div className="detalhes-info">
											<div className="info-row">
												<MapPin size={16} />
												<span>{anuncio.localPartida || "Local a definir"}</span>
											</div>
											<div className="info-row">
												<Calendar size={16} />
												<span>{formatDateTime(anuncio.dataHoraPartida)}</span>
											</div>
											<div className="info-row">
												<Clock3 size={16} />
												<span>
													{Array.isArray(anuncio.disponibilidade) && anuncio.disponibilidade.length > 0
														? anuncio.disponibilidade.join(", ")
														: "Horários sob consulta"}
												</span>
											</div>
											<div className="info-row">
												<QrCode size={16} />
												<span>
													{usuario?.chavePix
														? `Chave PIX: ${usuario.chavePix}`
														: "Chave PIX do jogador não informada"}
												</span>
											</div>
										</div>

										<form onSubmit={(event) => handleSubmit(event, anuncio.anuncioId)} className="aluguel-form">
											<div className="form-group">
												<label htmlFor={valorInputId}>
													<DollarSign size={16} /> Valor acordado
												</label>
												<input
													id={valorInputId}
													name="valor"
													type="number"
													step="0.01"
													min="0"
													value={currentState.valor}
													onChange={(event) => handleChangeForm(anuncio.anuncioId, event)}
													placeholder="Valor em reais"
													required
												/>
											</div>

											<div className="form-group">
												<label htmlFor={avaliacaoInputId}>
													<Star size={16} /> Avaliação (opcional)
												</label>
												<input
													id={avaliacaoInputId}
													name="avaliacao"
													type="number"
													step="0.1"
													min="0"
													max="5"
													value={currentState.avaliacao}
													onChange={(event) => handleChangeForm(anuncio.anuncioId, event)}
													placeholder="0 a 5"
												/>
											</div>

											{!userId && (
												<div className="form-hint">
													Faça login para contratar um jogador.
													<button
														type="button"
														className="link-btn"
														onClick={() => navigate("/login")}
													>
														Entrar
													</button>
												</div>
											)}

											{currentFeedback.error && (
												<div className="feedback error">{currentFeedback.error}</div>
											)}

											{currentFeedback.success && (
												<div className="feedback success">{currentFeedback.success}</div>
											)}

											<button
												type="submit"
												className="submit-btn"
												disabled={isSubmitting || !userId}
											>
												{isSubmitting ? (
													<>
														<Loader2 className="spinner" size={18} />
														Registrando...
													</>
												) : (
													"Contratar jogador"
												)}
											</button>
										</form>
									</div>
								);
							})}
						</div>
					) : (
						<div className="aluguel-empty-card">
							<p>Selecione anúncios na lista para visualizar e contratar aqui.</p>
						</div>
					)}
				</section>

				<section className="aluguel-section">
					<div className="section-header">
						<div>
							<h2>Meus aluguéis</h2>
							<p>Acompanhe os contratos que você já realizou.</p>
						</div>
					</div>

								{!userId ? (
									<div className="aluguel-empty-card">
										<p>Entre em sua conta para visualizar seus aluguéis.</p>
									</div>
								) : loadingAlugueis ? (
						renderLoader("Buscando seus aluguéis...")
					) : meusAlugueis.length === 0 ? (
						<div className="aluguel-empty-card">
							<p>Você ainda não realizou nenhum aluguel.</p>
						</div>
					) : (
						<div className="aluguel-lista">
							{meusAlugueis.map((item) => (
								<div className="aluguel-item" key={item.id ?? `${item.anuncioId}-${item.valor}`}
								>
									<div className="item-header">
										<div>
											<h3>{item.anuncio?.titulo ?? `Anúncio #${item.anuncioId}`}</h3>
											<span>{item.anuncio?.posicao ?? "Jogador"}</span>
										</div>
										<div className="item-price">{formatCurrency(item.valor)}</div>
									</div>

									<div className="item-body">
										<div className="info-row">
											<MapPin size={16} />
											<span>{item.anuncio?.localPartida ?? "Local a definir"}</span>
										</div>
										<div className="info-row">
											<Calendar size={16} />
											<span>{formatDateTime(item.anuncio?.dataHoraPartida)}</span>
										</div>
										{item.avaliacao !== null && item.avaliacao !== undefined && (
											<div className="info-row">
												<Star size={16} />
												<span>{Number(item.avaliacao).toFixed(1)} / 5</span>
											</div>
										)}
									</div>

									<div className="item-footer">
										<button
											type="button"
											className="cancel-btn"
											onClick={() => handleRemove(item.id)}
											disabled={removingId === item.id}
										>
											{removingId === item.id ? (
												<Loader2 className="spinner" size={16} />
											) : (
												<Trash2 size={16} />
											)}
											<span>{removingId === item.id ? "Cancelando..." : "Cancelar aluguel"}</span>
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
