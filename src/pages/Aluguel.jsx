import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
	Shield,
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
	const [selectedAnuncioId, setSelectedAnuncioId] = useState(null);
	const [selectedUsuario, setSelectedUsuario] = useState(null);
	const [formState, setFormState] = useState({ valor: "", avaliacao: "" });
	const [alugueis, setAlugueis] = useState([]);
	const [loadingAnuncios, setLoadingAnuncios] = useState(true);
	const [loadingAlugueis, setLoadingAlugueis] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [removingId, setRemovingId] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [feedback, setFeedback] = useState({ error: "", success: "" });

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

	const initialAnuncioParam = useMemo(() => {
		const param = searchParams.get("anuncioId") ?? searchParams.get("anuncio") ?? null;
		const numeric = resolveNumber(param);
		return numeric;
	}, [searchParams]);

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
		if (!initialAnuncioParam) return;
		if (!anuncios || anuncios.length === 0) return;

		const exists = anuncios.some((item) => item.anuncioId === initialAnuncioParam);
		if (exists) {
			setSelectedAnuncioId(initialAnuncioParam);
		}
	}, [initialAnuncioParam, anuncios]);

	useEffect(() => {
		if (!selectedAnuncioId) return;
		const selected = anuncios.find((item) => item.anuncioId === selectedAnuncioId);
		if (!selected) return;

		setFormState((prev) => ({
			...prev,
				valor:
					selected.preco !== undefined &&
					selected.preco !== null &&
					!Number.isNaN(Number(selected.preco))
						? String(selected.preco)
						: prev.valor,
				avaliacao: "",
		}));
	}, [selectedAnuncioId, anuncios]);

	useEffect(() => {
		if (!selectedAnuncioId) {
			setSelectedUsuario(null);
			return;
		}

		const selected = anuncios.find((item) => item.anuncioId === selectedAnuncioId);
		if (!selected) {
			setSelectedUsuario(null);
			return;
		}

		const usuarioId = resolveNumber(selected.usuarioId ?? selected.raw?.UsuarioId ?? selected.raw?.usuarioId);
		if (!usuarioId || usuarioId <= 0) {
			setSelectedUsuario(null);
			return;
		}

		let active = true;
		const fetchUsuario = async () => {
			try {
				const usuario = await usuariosService.getById(usuarioId);
				if (active) {
					setSelectedUsuario(usuario);
				}
			} catch (err) {
				console.error("Erro ao carregar usuário do anúncio", err);
				if (active) {
					setSelectedUsuario(null);
				}
			}
		};

		fetchUsuario();
		return () => {
			active = false;
		};
	}, [selectedAnuncioId, anuncios]);

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
		if (!searchTerm.trim()) return anuncios;
		const term = searchTerm.toLowerCase();
		return anuncios.filter((item) => {
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
		});
	}, [anuncios, searchTerm]);

	const selectedAnuncio = useMemo(() => {
		if (!selectedAnuncioId) return null;
		return anuncios.find((item) => item.anuncioId === selectedAnuncioId) ?? null;
	}, [selectedAnuncioId, anuncios]);

	const meusAlugueis = useMemo(() => {
		return alugueis.map((item) => {
			const vinculado = anunciosMap.get(Number(item.anuncioId)) ?? null;
			return {
				...item,
				anuncio: vinculado,
			};
		});
	}, [alugueis, anunciosMap]);

	const handleSelectAnuncio = (anuncioId) => {
		const numeric = resolveNumber(anuncioId);
		if (!numeric) {
			setFeedback({ error: "Não foi possível identificar este anúncio.", success: "" });
			return;
		}

		setSelectedUsuario(null);
		setSelectedAnuncioId(numeric);
		setFeedback((prev) => ({ ...prev, error: "", success: "" }));
	};

	const handleChangeForm = (event) => {
		const { name, value } = event.target;
		setFormState((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!selectedAnuncioId) {
			setFeedback({ error: "Selecione um jogador antes de contratar.", success: "" });
			return;
		}

		if (!userId) {
			setFeedback({ error: "É necessário estar autenticado para contratar um jogador.", success: "" });
			return;
		}

		const valorNumber = resolveNumber(formState.valor);
		if (!valorNumber || valorNumber <= 0) {
			setFeedback({ error: "Informe um valor válido para o aluguel.", success: "" });
			return;
		}

		const avaliacaoNumber = resolveNumber(formState.avaliacao);
		if (avaliacaoNumber !== null && (avaliacaoNumber < 0 || avaliacaoNumber > 5)) {
			setFeedback({ error: "A avaliação deve estar entre 0 e 5.", success: "" });
			return;
		}

		setSubmitting(true);
		setFeedback({ error: "", success: "" });

		try {
			const created = await aluguelService.create({
				ValorAluguel: valorNumber,
				AvaliacaoJogador: avaliacaoNumber,
				AnuncioId: selectedAnuncioId,
				ContratanteId: userId,
			});

			setFeedback({
				error: "",
				success: "Aluguel registrado com sucesso!",
			});

			setFormState((prev) => ({ ...prev, avaliacao: "" }));
			const newId = created?.id ?? created?.raw?.IdAluguel ?? null;
			if (newId) {
				navigate(`/pagamento?aluguelId=${newId}&anuncioId=${selectedAnuncioId}`);
				return;
			}
			await loadAlugueis();
		} catch (err) {
			console.error("Erro ao registrar aluguel", err);
			setFeedback({
				error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao registrar aluguel.",
				success: "",
			});
		} finally {
			setSubmitting(false);
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
						<Shield size={22} />
					</div>
					<div>
						<h1>RentKeeper</h1>
						<p>Aluguel de Jogadores</p>
					</div>
				</div>

				<button type="button" className="header-link" onClick={() => navigate("/anuncios")}>
					Ver Anúncios
				</button>
			</header>

			<main className="aluguel-main">
				<section className="aluguel-section">
					<div className="section-header">
						<div>
							<h2>Escolha um jogador</h2>
							<p>Selecione um anúncio disponível para contratar.</p>
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
							<p>Nenhum jogador encontrado com os filtros informados.</p>
						</div>
					) : (
						<div className="anuncio-grid">
							{filteredAnuncios.map((anuncio) => {
								const isSelected = selectedAnuncioId === anuncio.anuncioId;
								return (
									<button
										type="button"
										key={anuncio.anuncioId ?? anuncio.key}
										className={`anuncio-card ${isSelected ? "selected" : ""}`}
										onClick={() => handleSelectAnuncio(anuncio.anuncioId)}
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

					{selectedAnuncio ? (
						<div className="detalhes-card">
							<div className="detalhes-head">
								<div>
									<h3>{selectedAnuncio.titulo}</h3>
									<span>{selectedAnuncio.posicao}</span>
								</div>
								<div className="detalhes-price">{formatCurrency(selectedAnuncio.preco)}</div>
							</div>

							<div className="detalhes-info">
								<div className="info-row">
									<MapPin size={16} />
									<span>{selectedAnuncio.localPartida || "Local a definir"}</span>
								</div>
								<div className="info-row">
									<Calendar size={16} />
									<span>{formatDateTime(selectedAnuncio.dataHoraPartida)}</span>
								</div>
								<div className="info-row">
									<Clock3 size={16} />
									<span>
										{Array.isArray(selectedAnuncio.disponibilidade) && selectedAnuncio.disponibilidade.length > 0
											? selectedAnuncio.disponibilidade.join(", ")
											: "Horários sob consulta"}
									</span>
								</div>
								<div className="info-row">
									<QrCode size={16} />
									<span>
										{selectedUsuario?.chavePix
											? `Chave PIX: ${selectedUsuario.chavePix}`
											: "Chave PIX do jogador não informada"}
									</span>
								</div>
							</div>

							<form onSubmit={handleSubmit} className="aluguel-form">
								<div className="form-group">
									<label htmlFor="valor">
										<DollarSign size={16} /> Valor acordado
									</label>
									<input
										id="valor"
										name="valor"
										type="number"
										step="0.01"
										min="0"
										value={formState.valor}
										onChange={handleChangeForm}
										placeholder="Valor em reais"
										required
									/>
								</div>

								<div className="form-group">
									<label htmlFor="avaliacao">
										<Star size={16} /> Avaliação (opcional)
									</label>
									<input
										id="avaliacao"
										name="avaliacao"
										type="number"
										step="0.1"
										min="0"
										max="5"
										value={formState.avaliacao}
										onChange={handleChangeForm}
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

								{feedback.error && (
									<div className="feedback error">{feedback.error}</div>
								)}

								{feedback.success && (
									<div className="feedback success">{feedback.success}</div>
								)}

								<button type="submit" className="submit-btn" disabled={submitting || !userId}>
									{submitting ? (
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
					) : (
						<div className="aluguel-empty-card">
							<p>Selecione um anúncio na lista para visualizar os detalhes.</p>
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
