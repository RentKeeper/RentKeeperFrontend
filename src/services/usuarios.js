import ApiService from "./apiService";

const normaliseUsuario = (data) => {
  if (!data) return null;

  return {
    id: data.Id ?? data.id ?? null,
    nome: data.Nome ?? data.nome ?? "",
    email: data.Email ?? data.email ?? "",
    telefone: data.Telefone ?? data.telefone ?? "",
    posicao: data.Posicao ?? data.posicao ?? null,
    chavePix: data.ChavePix ?? data.chavePix ?? "",
    raw: data,
  };
};

export const usuariosService = {
  async getById(id) {
    if (!id) throw new Error("O identificador do usuário é obrigatório");
    const api = ApiService();
    const response = await api.get(`usuario/${id}`);
    return normaliseUsuario(response?.data ?? null);
  },

  async update(id, payload) {
    if (!id) throw new Error("O identificador do usuário é obrigatório");
    if (!payload) throw new Error("Os dados atualizados são obrigatórios");
    const api = ApiService();
    const response = await api.put(`usuario/${id}`, payload);
    return normaliseUsuario(response?.data ?? null);
  },
};

export default usuariosService;
