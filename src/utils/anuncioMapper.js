const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
    return value.filter((item) => item !== null && item !== undefined && String(item).trim() !== "").map(String);
  }

  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const ensureBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;
  return false;
};

const formatExperience = (years, fallback = "0 anos") => {
  const numeric = parseNumber(years, NaN);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric === 1 ? "1 ano" : `${numeric} anos`;
  }
  return fallback;
};

export const mapAnuncioFromBackend = (anuncio = {}) => {
  const id = anuncio.id ?? anuncio.anuncioId ?? anuncio.uuid ?? anuncio._id ?? null;
  const preco = parseNumber(anuncio.preco ?? anuncio.valor ?? anuncio.price, 0);
  const rating = parseNumber(anuncio.rating ?? anuncio.nota ?? anuncio.avaliacao, 0);
  const reviews = parseNumber(anuncio.reviews ?? anuncio.totalAvaliacoes ?? anuncio.qtdAvaliacoes, 0);
  const reservasCompletadas = parseNumber(
    anuncio.reservasCompletadas ?? anuncio.jogosRealizados ?? anuncio.totalReservas,
    0
  );

  const experiencia = anuncio.capacidade ?? anuncio.experiencia ?? anuncio.anosExperiencia;
  const disponibilidade =
    anuncio.disponibilidade ?? anuncio.disponivelEm ?? anuncio.statusDisponibilidade ?? "Disponível hoje";

  const comodidades = normaliseArray(
    anuncio.comodidades ?? anuncio.habilidades ?? anuncio.skills ?? anuncio.caracteristicas ?? []
  );

  const horarios = normaliseArray(anuncio.horarios ?? anuncio.disponibilidades ?? anuncio.slotsAgenda ?? []);

  return {
    id: id ?? `${normaliseText(anuncio.titulo ?? anuncio.nome, "anuncio")}-${Math.random().toString(36).slice(2, 8)}`,
    titulo: normaliseText(anuncio.titulo ?? anuncio.nome ?? "Anúncio sem título", "Anúncio sem título"),
    proprietario: normaliseText(
      anuncio.proprietario?.nome ?? anuncio.proprietario ?? anuncio.nomeResponsavel ?? "",
      "Proprietário"
    ),
    rating: rating > 5 ? 5 : rating,
    reviews,
    localizacao: normaliseText(
      anuncio.localizacao ?? anuncio.cidade ?? anuncio.endereco ?? anuncio.location,
      "Localização não informada"
    ),
    distancia: normaliseText(anuncio.distancia ?? anuncio.distance ?? "-"),
    preco,
    disponibilidade,
    tipo: normaliseText(anuncio.tipo ?? anuncio.posicao ?? anuncio.categoria ?? "Goleiro"),
    superficie: normaliseText(anuncio.superficie ?? anuncio.nivel ?? anuncio.nivelExperiencia ?? "Experiência"),
    capacidade: normaliseText(formatExperience(experiencia), "0 anos"),
    image:
      anuncio.image ||
      anuncio.imagem ||
      anuncio.foto ||
      "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: ensureBoolean(anuncio.verified ?? anuncio.verificado ?? anuncio.isVerified),
    responseTime: normaliseText(anuncio.responseTime ?? anuncio.tempoResposta ?? "< 1h"),
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
