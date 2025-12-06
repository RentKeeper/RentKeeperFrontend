import ApiService from "./apiService";

const normalizeTeam = (data) => {
  if (!data) return null;

  const usuarios = data.UsuarioIds ?? data.usuarioIds ?? data.Usuarios ?? data.usuarios ?? [];

  return {
    id: data.IdTime ?? data.idTime ?? data.id ?? null,
    nome: data.NomeTime ?? data.nomeTime ?? data.nome ?? "",
    quantidadeJogadores: data.QuantidadeJogadores ?? data.quantidadeJogadores ?? data.qtdJogadores ?? 0,
    usuarioIds: Array.isArray(usuarios) ? usuarios.map((u) => (typeof u === "object" ? u.Id ?? u.id ?? u : u)) : [],
    raw: data,
  };
};

const serializeTeam = (payload) => ({
  NomeTime: payload.nome ?? payload.NomeTime ?? "",
  QuantidadeJogadores: payload.quantidadeJogadores ?? payload.QuantidadeJogadores ?? 0,
  UsuarioIds: payload.usuarioIds ?? payload.UsuarioIds ?? [],
});

export const timesService = {
  async getAll(page = 1, pageSize = 20) {
    const api = ApiService();
    const response = await api.get(`time?page=${page}&pageSize=${pageSize}`);
    const payload = response?.data;

    if (Array.isArray(payload)) {
      return payload.map(normalizeTeam);
    }

    if (payload?.items && Array.isArray(payload.items)) {
      return payload.items.map(normalizeTeam);
    }

    if (payload?.data && Array.isArray(payload.data)) {
      return payload.data.map(normalizeTeam);
    }

    return [];
  },

  async getById(id) {
    if (!id) throw new Error("O identificador do time é obrigatório");
    const api = ApiService();
    const response = await api.get(`time/${id}`);
    return normalizeTeam(response?.data ?? null);
  },

  async create(payload) {
    if (!payload) throw new Error("Os dados do time são obrigatórios");
    const api = ApiService();
    const response = await api.post("time", serializeTeam(payload));
    return normalizeTeam(response?.data ?? null);
  },

  async update(id, payload) {
    if (!id) throw new Error("O identificador do time é obrigatório");
    if (!payload) throw new Error("Os dados do time são obrigatórios");
    const api = ApiService();
    const response = await api.put(`time/${id}`, serializeTeam(payload));
    return normalizeTeam(response?.data ?? null);
  },

  async remove(id) {
    if (!id) throw new Error("O identificador do time é obrigatório");
    const api = ApiService();
    await api.del(`time/${id}`);
    return true;
  },
};

export default timesService;
