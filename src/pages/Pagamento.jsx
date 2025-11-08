import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  DollarSign,
  CheckCircle,
  Copy,
  CreditCard,
  QrCode,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Cookies from "js-cookie";
import { aluguelService } from "../services/aluguel";
import { anunciosService } from "../services/anuncios";
import { pagamentosService } from "../services/pagamentos";
import { usuariosService } from "../services/usuarios";
import { mapAnuncioFromBackend } from "../utils/anuncioMapper";
import { getUserIdFromToken } from "../utils/jwt";
import "./Pagamento.css";

const FORMA_OPTIONS = [
  {
    key: "Pix",
    label: "PIX instantâneo",
    description: "Pagamento confirmado em segundos com chave dinâmica.",
    icon: QrCode,
  },
  {
    key: "CartaoVirtual",
    label: "Cartão virtual",
    description: "Use um cartão virtual temporário para concluir a contratação.",
    icon: CreditCard,
  },
];

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

const resolveToken = () => {
  return (
    Cookies.get("token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token") ||
    null
  );
};

export default function Pagamento() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const aluguelIdParam = searchParams.get("aluguelId");
  const anuncioIdParam = searchParams.get("anuncioId");
  const aluguelId = useMemo(() => {
    const parsed = Number(aluguelIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [aluguelIdParam]);

  const [token] = useState(() => resolveToken());
  const [aluguel, setAluguel] = useState(null);
  const [anuncio, setAnuncio] = useState(null);
  const [usuarioAnuncio, setUsuarioAnuncio] = useState(null);
  const [existingPayment, setExistingPayment] = useState(null);
  const [formaPagamento, setFormaPagamento] = useState("Pix");
  const [porcentagem, setPorcentagem] = useState("100");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ error: "", success: "" });
  const [copied, setCopied] = useState(false);

  const userId = useMemo(() => {
    if (!token) return null;
    const candidate = getUserIdFromToken(token);
    if (candidate === null || candidate === undefined || candidate === "") {
      return null;
    }
    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? numeric : null;
  }, [token]);

  const valorTotal = useMemo(() => {
    if (!aluguel) return 0;
    return Number(aluguel.valor ?? aluguel.raw?.ValorAluguel ?? 0) || 0;
  }, [aluguel]);

  useEffect(() => {
    if (!aluguelId) {
      setFeedback({ error: "ID de aluguel inválido. Retorne e selecione um anúncio novamente.", success: "" });
      setLoading(false);
    }
  }, [aluguelId]);

  useEffect(() => {
    if (!aluguelId) return;

    const loadData = async () => {
      setLoading(true);
      setFeedback({ error: "", success: "" });

      try {
        const aluguelDetalhe = await aluguelService.getById(aluguelId);
        setAluguel(aluguelDetalhe);

        setAnuncio(null);
        setUsuarioAnuncio(null);

        const anuncioId =
          Number(anuncioIdParam) ||
          Number(aluguelDetalhe?.anuncioId) ||
          Number(aluguelDetalhe?.raw?.AnuncioId);

        if (anuncioId) {
          try {
            const anuncioDetalhe = await anunciosService.getById(anuncioId);
            const mappedAnuncio = anuncioDetalhe ? mapAnuncioFromBackend(anuncioDetalhe) : null;
            setAnuncio(mappedAnuncio);

            const ownerCandidate =
              mappedAnuncio?.usuarioId ??
              anuncioDetalhe?.UsuarioId ??
              anuncioDetalhe?.usuarioId ??
              aluguelDetalhe?.raw?.Anuncio?.UsuarioId ??
              aluguelDetalhe?.raw?.Anuncio?.usuarioId ??
              null;

            const ownerId = Number(ownerCandidate);
            if (Number.isFinite(ownerId) && ownerId > 0) {
              try {
                const usuarioDetalhe = await usuariosService.getById(ownerId);
                setUsuarioAnuncio(usuarioDetalhe);
              } catch (userErr) {
                console.error("Erro ao buscar usuário do anúncio", userErr);
              }
            }
          } catch (err) {
            console.error("Erro ao buscar anúncio", err);
          }
        }

        try {
          const pagamentos = await pagamentosService.list(1, 100);
          const vinculado = pagamentos.find(
            (item) => Number(item.aluguelId) === Number(aluguelId)
          );

          if (vinculado) {
            setExistingPayment(vinculado);
            setFormaPagamento(vinculado.formaPagamento ?? "Pix");
            setPorcentagem(String(vinculado.porcentagemRecebida ?? 100));
            setFeedback({ error: "", success: "Pagamento já foi registrado para este aluguel." });
          }
        } catch (err) {
          console.error("Erro ao carregar pagamentos", err);
        }
      } catch (err) {
        console.error("Erro ao carregar detalhes do aluguel", err);
        setFeedback({
          error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao carregar os detalhes do aluguel.",
          success: "",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aluguelId]);

  useEffect(() => {
    if (!feedback.success) return undefined;
    const timer = setTimeout(() => setFeedback((prev) => ({ ...prev, success: "" })), 5000);
    return () => clearTimeout(timer);
  }, [feedback.success]);

  useEffect(() => {
    if (!feedback.error) return undefined;
    const timer = setTimeout(() => setFeedback((prev) => ({ ...prev, error: "" })), 7000);
    return () => clearTimeout(timer);
  }, [feedback.error]);

  const pixKey = useMemo(() => {
    const candidates = [
      usuarioAnuncio?.chavePix,
      usuarioAnuncio?.raw?.ChavePix,
      usuarioAnuncio?.raw?.chavePix,
    ];

    const found = candidates.find(
      (value) => typeof value === "string" && value.trim().length > 0
    );

    return found ? found.trim() : "";
  }, [usuarioAnuncio]);

  const hasPixKey = pixKey.length > 0;

  const handleCopyPix = async () => {
    if (!pixKey) {
      setFeedback({ error: "O jogador ainda não cadastrou uma chave PIX.", success: "" });
      return;
    }
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Falha ao copiar PIX", err);
      setFeedback({ error: "Não foi possível copiar a chave PIX.", success: "" });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!aluguelId) {
      setFeedback({ error: "Não foi possível identificar o aluguel.", success: "" });
      return;
    }

    if (!userId) {
      setFeedback({ error: "Faça login para registrar o pagamento.", success: "" });
      return;
    }

    const percNumber = Number(porcentagem);
    if (!Number.isFinite(percNumber) || percNumber < 0 || percNumber > 100) {
      setFeedback({ error: "Informe uma porcentagem entre 0% e 100%.", success: "" });
      return;
    }

    setSaving(true);
    setFeedback({ error: "", success: "" });

    try {
      let resultado;
      if (existingPayment?.id) {
        resultado = await pagamentosService.update(existingPayment.id, {
          Valor: valorTotal,
          FormaPagamento: formaPagamento,
          PorcentagemRecebida: percNumber,
          AluguelId: aluguelId,
        });
      } else {
        resultado = await pagamentosService.create({
          Valor: valorTotal,
          FormaPagamento: formaPagamento,
          PorcentagemRecebida: percNumber,
          AluguelId: aluguelId,
        });
      }

      setExistingPayment(resultado);
      if (resultado?.formaPagamento) {
        setFormaPagamento(resultado.formaPagamento);
      }
      if (Number.isFinite(Number(resultado?.porcentagemRecebida))) {
        setPorcentagem(String(resultado.porcentagemRecebida));
      }
      setFeedback({
        error: "",
        success: existingPayment?.id
          ? "Pagamento atualizado com sucesso!"
          : "Pagamento registrado com sucesso!",
      });
    } catch (err) {
      console.error("Erro ao registrar pagamento", err);
      setFeedback({
        error: err?.response?.data?.mensagem ?? err?.message ?? "Erro ao registrar pagamento.",
        success: "",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleNovaBusca = () => {
    navigate("/anuncios");
  };

  const handleVoltar = () => {
    navigate(-1);
  };

  if (!aluguelId) {
    return (
      <div className="pagamento-page">
        <header className="pagamento-header">
          <button type="button" className="back-button" onClick={handleVoltar}>
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </button>
        </header>
        <div className="pagamento-alert">
          <AlertCircle size={24} />
          <p>Parâmetros inválidos. Retorne à lista de anúncios e tente novamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pagamento-page">
      <header className="pagamento-header">
        <button type="button" className="back-button" onClick={handleVoltar}>
          <ArrowLeft size={18} />
          <span>Voltar</span>
        </button>

        <div className="brand" onClick={() => navigate("/")}>
          <div className="brand-icon">
            <Shield size={22} />
          </div>
          <div>
            <h1>RentKeeper</h1>
            <p>Pagamento seguro</p>
          </div>
        </div>

        <button type="button" className="header-link" onClick={handleNovaBusca}>
          Ver outros jogadores
        </button>
      </header>

      <main className="pagamento-main">
        {loading ? (
          <div className="pagamento-loader">
            <Loader2 className="loader-icon" size={28} />
            <span>Carregando dados do aluguel...</span>
          </div>
        ) : feedback.error && !aluguel ? (
          <div className="pagamento-alert">
            <AlertCircle size={24} />
            <p>{feedback.error}</p>
          </div>
        ) : (
          <div className="pagamento-grid">
            <section className="pagamento-section destaque">
              <h2>Resumo da contratação</h2>
              <div className="resumo-card">
                <div className="resumo-row">
                  <span>Jogador</span>
                  <strong>{anuncio?.titulo ?? `Anúncio #${aluguel?.anuncioId}`}</strong>
                </div>
                <div className="resumo-row">
                  <span>Posição</span>
                  <strong>{anuncio?.tipo ?? "--"}</strong>
                </div>
                <div className="resumo-row">
                  <span>Local</span>
                  <strong>{anuncio?.localPartida ?? anuncio?.localizacao ?? "A definir"}</strong>
                </div>
                <div className="resumo-row">
                  <span>Chave PIX</span>
                  <strong>{hasPixKey ? pixKey : "Não informada"}</strong>
                </div>
                <div className="resumo-divider" />
                <div className="resumo-total">
                  <div>
                    <span>Valor do aluguel</span>
                    <strong>{formatCurrency(valorTotal)}</strong>
                  </div>
                  <DollarSign size={20} />
                </div>
                {feedback.success && (
                  <div className="resumo-feedback success">{feedback.success}</div>
                )}
              </div>
            </section>

            <section className="pagamento-section">
              <h2>Escolha a forma de pagamento</h2>
              <form className="pagamento-form" onSubmit={handleSubmit}>
                <div className="forma-grid">
                  {FORMA_OPTIONS.map(({ key, label, description, icon: Icon }) => {
                    const active = formaPagamento === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        className={`forma-card ${active ? "active" : ""}`}
                        onClick={() => setFormaPagamento(key)}
                      >
                        <div className="forma-icon">
                          <Icon size={24} />
                        </div>
                        <div>
                          <strong>{label}</strong>
                          <p>{description}</p>
                        </div>
                        {active && (
                          <span className="forma-badge">
                            <CheckCircle size={16} />
                            Selecionado
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="form-group">
                  <label htmlFor="porcentagem">
                    Taxa do jogador (%)
                    <span>Defina quanto do valor será repassado diretamente ao jogador.</span>
                  </label>
                  <input
                    id="porcentagem"
                    name="porcentagem"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={porcentagem}
                    onChange={(event) => setPorcentagem(event.target.value)}
                  />
                </div>

                {formaPagamento === "Pix" && (
                  <div className="pix-card">
                    <div>
                      <span>Chave PIX do jogador</span>
                      <strong>{pixKey || "Não informada"}</strong>
                      {!hasPixKey && (
                        <small className="pix-hint">
                          O jogador ainda não cadastrou uma chave PIX. Utilize o cartão virtual ou combine outra forma.
                        </small>
                      )}
                    </div>
                    <button type="button" onClick={handleCopyPix} disabled={!hasPixKey}>
                      <Copy size={16} />
                      {copied ? "Copiado!" : hasPixKey ? "Copiar" : "Indisponível"}
                    </button>
                  </div>
                )}

                {feedback.error && (
                  <div className="form-feedback error">{feedback.error}</div>
                )}

                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="spinner" size={18} />
                      Processando pagamento...
                    </>
                  ) : existingPayment?.id ? (
                    "Atualizar pagamento"
                  ) : (
                    "Confirmar pagamento"
                  )}
                </button>
              </form>
            </section>

            <section className="pagamento-section">
              <h2>Comprovante e status</h2>
              <div className="status-card">
                <div className="status-row">
                  <span>Status atual</span>
                  <strong>{existingPayment ? "Pagamento registrado" : "Aguardando pagamento"}</strong>
                </div>
                <div className="status-row">
                  <span>Forma escolhida</span>
                  <strong>{existingPayment?.formaPagamento ?? formaPagamento}</strong>
                </div>
                <div className="status-row">
                  <span>Última atualização</span>
                  <strong>
                    {existingPayment?.raw?.DataAtualizacao
                      ? new Date(existingPayment.raw.DataAtualizacao).toLocaleString("pt-BR")
                      : new Date().toLocaleString("pt-BR")}
                  </strong>
                </div>
                <div className="status-actions">
                  <button type="button" onClick={handleNovaBusca}>
                    Contratar outro jogador
                  </button>
                  <button type="button" onClick={() => navigate("/")}>Voltar à Home</button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
