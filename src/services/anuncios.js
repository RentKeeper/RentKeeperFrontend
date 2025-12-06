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

const unwrapResponse = (response) => {
  if (!response) return [];

  const { data } = response;

  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.items)) {
    return data.items;
  }

  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

export const anunciosService = {
  async get(page = 1, pageSize = 20, filters = {}) {
    const api = ApiService();
    const query = buildQueryString(page, pageSize, filters);
    const response = await api.get(`anuncio${query}`);
    return unwrapResponse(response);
  },

  async getById(id) {
    if (!id) throw new Error("O identificador do anúncio é obrigatório");
    const api = ApiService();
    const response = await api.get(`anuncio/${id}`);
    const data = response?.data;
    if (!data) return null;
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }
    if (data?.data) {
      return data.data;
    }
    return data;
  },

  async create(payload) {
    const api = ApiService();
    const response = await api.post("anuncio", payload);
    return response?.data;
  },

  async post(payload) {
    return this.create(payload);
  },

  async update(id, payload) {
    if (!id) throw new Error("O identificador do anúncio é obrigatório");
    const api = ApiService();
    const response = await api.put(`anuncio/${id}`, payload);
    return response?.data;
  },

  async remove(id) {
    if (!id) throw new Error("O identificador do anúncio é obrigatório");
    const api = ApiService();
    const response = await api.del(`anuncio/${id}`);
    return response?.data;
  },
};

export default anunciosService;
