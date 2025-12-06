import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  DollarSign,
  Star,
  ArrowLeft,
} from "lucide-react";
import Cookies from "js-cookie";
import "./AvaliarAluguel.css";
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

export default function AvaliarAluguel() {
  const navigate = useNavigate();
  const { aluguelId } = useParams();
  const [token, setToken] = useState(() => resolveToken());
  const [aluguel, setAluguel] = useState(null);
  const [anuncio, setAnuncio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnuncio, setLoadingAnuncio] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState({ error: "", success: "" });

  const userId = useMemo(() => {
    if (!token) return null;
    const candidate = getUserIdFromToken(token);
    if (!candidate && candidate !== 0) return null;
    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? numeric : null;
  }, [token]);

  const isOwner = useMemo(() => {
    if (!userId || !aluguel) return false;
    return Number(aluguel.contratanteId) === Number(userId);
  }, [userId, aluguel]);

  useEffect(() => {
    const handleStorage = () => setToken(resolveToken());
    window.addEventListener("storage", handleStorage);
    setToken(resolveToken());
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!aluguelId) {
      setFeedback({ error: "Identificador do aluguel inválido.", success: "" });
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setFeedback({ error: "", success: "" });

    const loadAluguel = async () => {
      try {
        const data = await aluguelService.getById(Number(aluguelId));
        if (!active) return;
        if (!data) {
          setFeedback({ error: "Aluguel não encontrado.", success: "" });
          setAluguel(null);
          return;
        }
        setAluguel(data);
        setRating(data.avaliacao ? String(data.avaliacao) : "");
      } catch (err) {
        if (!active) return;
        console.error("Erro ao carregar aluguel para avaliação", err);
        setFeedback({
          error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar dados do aluguel.",
          success: "",
        });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAluguel();

    return () => {
      active = false;
    };
  }, [aluguelId]);

  useEffect(() => {
    if (!aluguel?.anuncioId) {
      setAnuncio(null);
      return;
    }

    let active = true;
    setLoadingAnuncio(true);

    const loadAnuncio = async () => {
      try {
        const raw = await anunciosService.getById(Number(aluguel.anuncioId));
        if (!active) return;
        if (!raw) {
          setAnuncio(null);
          return;
        }
        setAnuncio({ ...mapAnuncioFromBackend(raw), anuncioId: Number(aluguel.anuncioId) });
      } catch (err) {
        if (!active) return;
        console.error("Erro ao carregar anúncio associado ao aluguel", err);
        setAnuncio(null);
      } finally {
        if (active) {
          setLoadingAnuncio(false);
        }
      }
    };

    loadAnuncio();

    return () => {
      active = false;
    };
  }, [aluguel]);

  useEffect(() => {
    if (!feedback.success) return undefined;
    const timer = setTimeout(() => setFeedback((prev) => ({ ...prev, success: "" })), 3500);
    return () => clearTimeout(timer);
  }, [feedback.success]);

  useEffect(() => {
    if (!feedback.error) return undefined;
    const timer = setTimeout(() => setFeedback((prev) => ({ ...prev, error: "" })), 5000);
    return () => clearTimeout(timer);
  }, [feedback.error]);

  const handleBack = () => {
    navigate("/avaliacoes");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!aluguelId) return;

    if (!userId) {
      setFeedback({ error: "Faça login para avaliar o aluguel.", success: "" });
      return;
    }

    if (!isOwner) {
      setFeedback({ error: "Somente o contratante pode avaliar este aluguel.", success: "" });
      return;
    }

    const numeric = Number(rating);
    if (!Number.isFinite(numeric) || numeric < 1 || numeric > 5) {
      setFeedback({ error: "Selecione uma nota entre 1 e 5.", success: "" });
      return;
    }

    setSubmitting(true);
    setFeedback({ error: "", success: "" });

    try {
      await aluguelService.rate(Number(aluguelId), numeric);
      navigate("/avaliacoes", {
        state: { successMessage: "Avaliação registrada com sucesso." },
      });
    } catch (err) {
      console.error("Erro ao salvar avaliação", err);
      setFeedback({
        error: err?.response?.data?.mensagem ?? err?.message ?? "Não foi possível registrar a avaliação.",
        success: "",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    if (!userId) {
      return (
        <div className="avaliar-empty">
          <p>Faça login para avaliar seus alugueis.</p>
          <button type="button" className="link-btn" onClick={() => navigate("/login")}>Fazer login</button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="avaliar-loading">
          <Loader2 className="spinner" size={24} /> Carregando aluguel...
        </div>
      );
    }

    if (!aluguel) {
      return (
        <div className="avaliar-empty">
          <p>Aluguel não encontrado ou indisponível.</p>
          <button type="button" className="link-btn" onClick={handleBack}>Voltar para avaliações</button>
        </div>
      );
    }

    return (
      <form className="avaliar-form" onSubmit={handleSubmit}>
        <div className="avaliar-card">
          <div className="avaliar-card-header">
            <h2>{anuncio?.titulo ?? `Anúncio #${aluguel.anuncioId}`}</h2>
            <span className="avaliar-price">{formatCurrency(aluguel.valor)}</span>
          </div>
          <div className="avaliar-card-body">
            <div className="info-item">
              <Calendar size={16} />
              <span>{formatDateTime(anuncio?.dataHoraPartida ?? anuncio?.dataPartida)}</span>
            </div>
            <div className="info-item">
              <MapPin size={16} />
              <span>{anuncio?.localPartida ?? anuncio?.localizacao ?? "Local não informado"}</span>
            </div>
            <div className="info-item">
              <DollarSign size={16} />
              <span>{formatCurrency(aluguel.valor)}</span>
            </div>
          </div>
        </div>

        <div className="avaliar-rating-card">
          <h3>Como você avalia o goleiro contratado?</h3>
          <p>Escolha uma nota de 1 a 5 estrelas. Você pode atualizar essa nota futuramente.</p>
          <div className="rating-options">
            {[1, 2, 3, 4, 5].map((value) => {
              const selected = Number(rating) === value;
              return (
                <label key={value} className={`rating-option ${selected ? "selected" : ""}`}>
                  <input
                    type="radio"
                    name="avaliacao"
                    value={value}
                    checked={selected}
                    onChange={(event) => setRating(event.target.value)}
                  />
                  <Star size={20} />
                  <span>{value}</span>
                </label>
              );
            })}
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

        <div className="avaliar-actions">
          <button type="button" className="secondary-btn" onClick={handleBack}>
            <ArrowLeft size={16} />
            Voltar
          </button>
          <button type="submit" className="primary-btn" disabled={submitting || loadingAnuncio}>
            {submitting ? (
              <>
                <Loader2 className="spinner" size={18} />
                Salvando...
              </>
            ) : (
              <>
                <Star size={16} />
                Registrar avaliação
              </>
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="avaliar-container">
      <header className="avaliar-header">
        <div className="brand" onClick={() => navigate("/")}>
          <div className="brand-icon">
            <Logo size={28} />
          </div>
          <div>
            <h1>RentKeeper</h1>
            <p>Avaliar aluguel</p>
          </div>
        </div>

        <div className="header-actions">
          <button type="button" className="header-link" onClick={handleBack}>
            Voltar para lista
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="avaliar-main">
        <section className="avaliar-section">{renderContent()}</section>
      </main>
    </div>
  );
}
