import ApiService from "./apiService";

const normalizeMatch = (data) => {
  if (!data) return null;

  const mandante = data.TimeMandante ?? data.timeMandante ?? {};
  const visitante = data.TimeVisitante ?? data.timeVisitante ?? {};

  const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  return {
    id: data.IdJogo ?? data.idJogo ?? data.id ?? null,
    timeMandanteId: data.TimeMandanteId ?? data.timeMandanteId ?? mandante.IdTime ?? mandante.id ?? null,
    timeVisitanteId: data.TimeVisitanteId ?? data.timeVisitanteId ?? visitante.IdTime ?? visitante.id ?? null,
    timeMandanteNome: data.TimeMandanteNome ?? data.timeMandanteNome ?? mandante.NomeTime ?? mandante.nomeTime ?? mandante.nome ?? null,
    timeVisitanteNome: data.TimeVisitanteNome ?? data.timeVisitanteNome ?? visitante.NomeTime ?? visitante.nomeTime ?? visitante.nome ?? null,
    dataHora: parseDate(data.DataHora ?? data.dataHora ?? null),
    local: data.Local ?? data.local ?? "",
    observacoes: data.Observacoes ?? data.observacoes ?? null,
    status: data.Status ?? data.status ?? "Agendado",
    raw: data,
  };
};

const serializeMatch = (payload) => {
  const asIsoString = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  return {
    TimeMandanteId: payload.timeMandanteId ?? payload.TimeMandanteId,
    TimeVisitanteId: payload.timeVisitanteId ?? payload.TimeVisitanteId,
    DataHora: asIsoString(payload.dataHora ?? payload.DataHora),
    Local: payload.local ?? payload.Local ?? "",
    Observacoes: payload.observacoes ?? payload.Observacoes ?? null,
    Status: payload.status ?? payload.Status ?? "Agendado",
  };
};

export const jogosService = {
  async getAll(page = 1, pageSize = 20) {
    const api = ApiService();
    const response = await api.get(`jogo?page=${page}&pageSize=${pageSize}`);
    const payload = response?.data;
    if (Array.isArray(payload)) return payload.map(normalizeMatch);
    if (payload?.items && Array.isArray(payload.items)) return payload.items.map(normalizeMatch);
    if (payload?.data && Array.isArray(payload.data)) return payload.data.map(normalizeMatch);
    return [];
  },

  async getById(id) {
    if (!id) throw new Error("O identificador do jogo é obrigatório");
    const api = ApiService();
    const response = await api.get(`jogo/${id}`);
    return normalizeMatch(response?.data ?? null);
  },

  async create(payload) {
    const api = ApiService();
    const response = await api.post("jogo", serializeMatch(payload));
    return normalizeMatch(response?.data ?? null);
  },

  async update(id, payload) {
    if (!id) throw new Error("O identificador do jogo é obrigatório");
    const api = ApiService();
    const response = await api.put(`jogo/${id}`, serializeMatch(payload));
    return normalizeMatch(response?.data ?? null);
  },

  async remove(id) {
    if (!id) throw new Error("O identificador do jogo é obrigatório");
    const api = ApiService();
    await api.del(`jogo/${id}`);
    return true;
  },
};

export default jogosService;
