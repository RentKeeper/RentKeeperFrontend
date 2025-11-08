import ApiService from "./apiService";

const buildQueryString = (page, pageSize, filters) => {
  const searchParams = new URLSearchParams();

  if (page) {
    searchParams.append("page", String(page));
  }

  if (pageSize) {
    searchParams.append("pageSize", String(pageSize));
  }

  if (filters && typeof filters === "object") {
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, String(item)));
        } else {
          searchParams.append(key, String(value));
        }
      });
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const normalisePayload = (payload = {}) => {
  const valor =
    payload.ValorAluguel ??
    payload.valorAluguel ??
    payload.valor ??
    payload.valor_aluguel;

  const avaliacao =
    payload.AvaliacaoJogador ??
    payload.avaliacaoJogador ??
    payload.avaliacao ??
    payload.avaliacao_jogador;

  const anuncioId =
    payload.AnuncioId ??
    payload.anuncioId ??
    payload.anuncio_id ??
    payload.idAnuncio ??
    payload.IdAnuncio;

  const contratanteId =
    payload.ContratanteId ??
    payload.contratanteId ??
    payload.contratante_id ??
    payload.idContratante ??
    payload.IdContratante;

  return {
    ValorAluguel: valor !== undefined && valor !== null ? Number(valor) : 0,
    AvaliacaoJogador:
      avaliacao !== undefined && avaliacao !== null && avaliacao !== ""
        ? Number(avaliacao)
        : null,
    AnuncioId: anuncioId !== undefined && anuncioId !== null ? Number(anuncioId) : null,
    ContratanteId:
      contratanteId !== undefined && contratanteId !== null ? Number(contratanteId) : null,
  };
};

const normaliseResponse = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map(normaliseResponse);
  }

  return {
    id: data.IdAluguel ?? data.idAluguel ?? data.id ?? null,
    valor: Number(data.ValorAluguel ?? data.valorAluguel ?? data.valor ?? 0),
    avaliacao:
      data.AvaliacaoJogador ?? data.avaliacaoJogador ?? data.avaliacao ?? null,
    anuncioId: Number(data.AnuncioId ?? data.anuncioId ?? data.IdAnuncio ?? 0),
    contratanteId: Number(
      data.ContratanteId ?? data.contratanteId ?? data.IdContratante ?? 0
    ),
    raw: data,
  };
};

export const aluguelService = {
  async get(page = 1, pageSize = 20, filters = {}) {
    const api = ApiService();
    const query = buildQueryString(page, pageSize, filters);
    const response = await api.get(`aluguel${query}`);
    const data = response?.data;

    if (Array.isArray(data)) {
      return data.map(normaliseResponse);
    }

    if (data && Array.isArray(data.items)) {
      return data.items.map(normaliseResponse);
    }

    if (data && Array.isArray(data.data)) {
      return data.data.map(normaliseResponse);
    }

    if (data) {
      return [normaliseResponse(data)];
    }

    return [];
  },

  async getById(id) {
    if (!id) throw new Error("O identificador do aluguel é obrigatório");
    const api = ApiService();
    const response = await api.get(`aluguel/${id}`);
    return normaliseResponse(response?.data ?? null);
  },

  async create(payload) {
    const api = ApiService();
    const normalised = normalisePayload(payload);

    if (!normalised.AnuncioId) {
      throw new Error("Selecione um anúncio válido para contratar");
    }

    if (!normalised.ContratanteId) {
      throw new Error("Identificador do contratante é obrigatório");
    }

    const response = await api.post("aluguel", normalised);
    return normaliseResponse(response?.data ?? null);
  },

  async update(id, payload) {
    if (!id) throw new Error("O identificador do aluguel é obrigatório");
    const api = ApiService();
    const normalised = normalisePayload(payload);
    const response = await api.put(`aluguel/${id}`, normalised);
    return normaliseResponse(response?.data ?? null);
  },

  async remove(id) {
    if (!id) throw new Error("O identificador do aluguel é obrigatório");
    const api = ApiService();
    await api.del(`aluguel/${id}`);
  },
};

export default aluguelService;
