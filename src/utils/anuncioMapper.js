const parseNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normaliseText = (value, fallback = "") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
};

const normaliseArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined && String(item).trim() !== "")
      .map((item) => String(item).trim());
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const ensureBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return false;
};

const POSICAO_LABEL = {
  0: "Goleiro",
  1: "Defensor",
  2: "Meia",
  3: "Atacante",
  4: "Juiz",
};

const formatExperience = (years, fallback = "0 anos") => {
  const numeric = parseNumber(years, NaN);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric === 1 ? "1 ano" : `${numeric} anos`;
  }
  return normaliseText(years, fallback);
};

const resolvePosicao = (value, fallback = "Goleiro") => {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "number") {
    return POSICAO_LABEL[value] ?? fallback;
  }

  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return POSICAO_LABEL[numeric] ?? normaliseText(value, fallback);
    }
    return normaliseText(value, fallback);
  }

  return fallback;
};

export const mapAnuncioFromBackend = (anuncio = {}) => {
  const id =
    anuncio.id ??
    anuncio.Id ??
    anuncio.anuncioId ??
    anuncio.IdAnuncio ??
    anuncio.uuid ??
    anuncio._id ??
    null;

  const preco = parseNumber(
    anuncio.preco ?? anuncio.Preco ?? anuncio.valor ?? anuncio.Valor ?? anuncio.price,
    0
  );

  const averageRaw =
    anuncio.mediaAvaliacao ??
    anuncio.MediaAvaliacao ??
    anuncio.media_avaliacao ??
    anuncio.averageRating ??
    anuncio.average_rating ??
    anuncio.rating ??
    anuncio.Rating ??
    anuncio.nota ??
    anuncio.Nota ??
    anuncio.avaliacao ??
    anuncio.Avaliacao;

  const parsedAverage = (() => {
    if (averageRaw === null || averageRaw === undefined || averageRaw === "") {
      return null;
    }
    const numeric = Number(averageRaw);
    return Number.isFinite(numeric) ? numeric : null;
  })();

  const rating = (() => {
    if (parsedAverage !== null) {
      const clamped = Math.max(0, Math.min(5, parsedAverage));
      return Number.parseFloat(clamped.toFixed(2));
    }
    return parseNumber(
      averageRaw,
      parseNumber(
        anuncio.rating ?? anuncio.Rating ?? anuncio.nota ?? anuncio.Nota ?? anuncio.avaliacao ?? anuncio.Avaliacao,
        0
      )
    );
  })();

  const totalAvaliacoesRaw =
    anuncio.totalAvaliacoes ??
    anuncio.TotalAvaliacoes ??
    anuncio.qtdAvaliacoes ??
    anuncio.QtdAvaliacoes ??
    anuncio.reviews ??
    anuncio.Reviews;

  const reviews = (() => {
    if (totalAvaliacoesRaw === null || totalAvaliacoesRaw === undefined || totalAvaliacoesRaw === "") {
      return 0;
    }
    const numeric = Number(totalAvaliacoesRaw);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    return parseNumber(totalAvaliacoesRaw, 0);
  })();

  const reservasCompletadas = parseNumber(
    anuncio.reservasCompletadas ??
      anuncio.ReservasCompletadas ??
      anuncio.jogosRealizados ??
      anuncio.JogosRealizados ??
      anuncio.totalReservas ??
      anuncio.TotalReservas,
    0
  );

  const experiencia =
    anuncio.capacidade ??
    anuncio.Capacidade ??
    anuncio.experiencia ??
    anuncio.Experiencia ??
    anuncio.anosExperiencia ??
    anuncio.AnosExperiencia;

  const disponibilidade =
    anuncio.disponibilidade ??
    anuncio.Disponibilidade ??
    anuncio.disponivelEm ??
    anuncio.DisponivelEm ??
    anuncio.statusDisponibilidade ??
    anuncio.StatusDisponibilidade ??
    "Disponível hoje";

  const comodidades = normaliseArray(
    anuncio.comodidades ??
      anuncio.Comodidades ??
      anuncio.habilidades ??
      anuncio.Habilidades ??
      anuncio.skills ??
      anuncio.Skills ??
      anuncio.caracteristicas ??
      anuncio.Caracteristicas ??
      []
  );

  const horarios = normaliseArray(
    anuncio.horarios ??
      anuncio.Horarios ??
      anuncio.disponibilidades ??
      anuncio.Disponibilidades ??
      anuncio.slotsAgenda ??
      anuncio.SlotsAgenda ??
      disponibilidade
  );

  return {
    id:
      id ??
      `${normaliseText(anuncio.titulo ?? anuncio.Titulo ?? anuncio.nome ?? anuncio.Nome, "anuncio")}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    titulo: normaliseText(
      anuncio.titulo ?? anuncio.Titulo ?? anuncio.nome ?? anuncio.Nome ?? "Anúncio sem título",
      "Anúncio sem título"
    ),
    proprietario: normaliseText(
      anuncio.proprietario?.nome ??
        anuncio.proprietario?.Nome ??
        anuncio.proprietario ??
        anuncio.Proprietario ??
        anuncio.nomeResponsavel ??
        anuncio.NomeResponsavel ??
        "",
      "Proprietário"
    ),
    rating: rating > 5 ? 5 : rating,
    reviews,
    localizacao: normaliseText(
      anuncio.localizacao ??
        anuncio.Localizacao ??
        anuncio.cidade ??
        anuncio.Cidade ??
        anuncio.endereco ??
        anuncio.Endereco ??
        anuncio.location ??
        anuncio.Location,
      "Localização não informada"
    ),
    distancia: normaliseText(anuncio.distancia ?? anuncio.Distancia ?? anuncio.distance ?? "-"),
    preco,
    disponibilidade,
    tipo: resolvePosicao(
      anuncio.tipo ?? anuncio.Tipo ?? anuncio.posicao ?? anuncio.Posicao ?? anuncio.categoria ?? anuncio.Categoria,
      "Goleiro"
    ),
    superficie: normaliseText(
      anuncio.superficie ??
        anuncio.Superficie ??
        anuncio.nivel ??
        anuncio.Nivel ??
        anuncio.nivelExperiencia ??
        anuncio.NivelExperiencia ??
        "Experiência"
    ),
    capacidade: normaliseText(formatExperience(experiencia), "0 anos"),
    descricao: normaliseText(anuncio.descricao ?? anuncio.Descricao ?? ""),
    localPartida: normaliseText(anuncio.localPartida ?? anuncio.LocalPartida ?? ""),
    dataHoraPartida: anuncio.dataHoraPartida ?? anuncio.DataHoraPartida ?? null,
    usuarioId: anuncio.usuarioId ?? anuncio.UsuarioId ?? null,
    disponivel: ensureBoolean(anuncio.disponivel ?? anuncio.Disponivel ?? true),
    image:
      anuncio.image ||
      anuncio.Image ||
      anuncio.imagem ||
      anuncio.Imagem ||
      anuncio.foto ||
      anuncio.Foto ||
      "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=400",
    responseTime: normaliseText(
      anuncio.responseTime ?? anuncio.ResponseTime ?? anuncio.tempoResposta ?? anuncio.TempoResposta ?? "< 1h"
    ),
    reservasCompletadas,
    horarios,
    comodidades: comodidades.length > 0 ? comodidades : ["Pontualidade", "Comprometimento"],
  };
};

const normaliseDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return normaliseText(dateValue);
  }
  return date.toISOString().split("T")[0];
};

const combineDateTime = (dateValue, timeValue) => {
  if (!dateValue || !timeValue) return null;
  const combined = new Date(`${dateValue}T${timeValue}`);
  if (Number.isNaN(combined.getTime())) {
    return null;
  }
  return combined.toISOString();
};

const normaliseDisponibilidade = (disponibilidade) => {
  if (!Array.isArray(disponibilidade)) return [];
  return disponibilidade.filter(Boolean).map((slot) => slot.trim()).filter(Boolean);
};

export const mapAnuncioToBackend = (form = {}, usuarioId) => {
  const titulo = normaliseText(form.anuncioJogador ?? form.titulo ?? "");
  const tipoPartida = normaliseText(form.anuncioPartida ?? form.tipoPartida ?? "");
  const localPartida = normaliseText(form.localPartida ?? form.local ?? "");
  const descricao = normaliseText(form.descricao ?? "");
  const preco = parseNumber(form.preco ?? form.valor, 0);
  const posicao = parseNumber(form.posicao, 0);
  const experiencia = normaliseText(form.experiencia ?? "");
  const disponibilidade = normaliseDisponibilidade(form.disponibilidade);
  const dataPartida = normaliseDate(form.dataPartida ?? form.data ?? "");
  const horaPartida = normaliseText(form.horaPartida ?? form.horario ?? "");
  const horarioISO = combineDateTime(dataPartida, horaPartida);

  const payload = {
    titulo,
    tipoPartida,
    localPartida,
    descricao,
    preco,
    posicao,
    experiencia,
    disponibilidade,
    dataPartida,
    horaPartida,
    ...(horarioISO ? { dataHoraPartida: horarioISO } : {}),
  };

  if (usuarioId) {
    payload.usuarioId = usuarioId;
  }

  return payload;
};

export default mapAnuncioFromBackend;
