import ApiService from "./apiService";

const FORMA_MAP = {
  Pix: 0,
  CartaoVirtual: 1,
};

const toFormaValue = (forma) => {
  if (typeof forma === "number" && Number.isFinite(forma)) {
    return forma;
  }

  if (typeof forma === "string") {
    const key = forma.trim();
    if (Object.prototype.hasOwnProperty.call(FORMA_MAP, key)) {
      return FORMA_MAP[key];
    }

    const numeric = Number(key);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return 0;
};

const resolveFormaLabel = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  if (typeof value === "number") {
    const entry = Object.entries(FORMA_MAP).find(([, code]) => code === value);
    if (entry) return entry[0];
  }

  return "Pix";
};

const normaliseResponse = (payload) => {
  if (!payload) return null;
  const valor = payload.Valor ?? payload.valor ?? 0;
  const forma = payload.FormaPagamento ?? payload.formaPagamento ?? payload.forma ?? null;
  const porcentagem = payload.PorcentagemRecebida ?? payload.porcentagemRecebida ?? payload.porcentagem ?? 0;
  const aluguelId = payload.AluguelId ?? payload.aluguelId ?? 0;

  return {
    id: payload.IdPagamento ?? payload.idPagamento ?? payload.id ?? null,
    valor: Number(valor) || 0,
    formaPagamento: resolveFormaLabel(forma),
    formaCode: toFormaValue(forma),
    porcentagemRecebida: Number(porcentagem) || 0,
    aluguelId: Number(aluguelId) || null,
    raw: payload,
  };
};

export const pagamentosService = {
  async list(page = 1, pageSize = 50) {
    const api = ApiService();
    const response = await api.get(`pagamento?page=${page}&pageSize=${pageSize}`);
    const data = response?.data;

    if (Array.isArray(data)) {
      return data.map(normaliseResponse).filter(Boolean);
    }

    if (data && Array.isArray(data.items)) {
      return data.items.map(normaliseResponse).filter(Boolean);
    }

    if (data && Array.isArray(data.data)) {
      return data.data.map(normaliseResponse).filter(Boolean);
    }

    if (data) {
      const single = normaliseResponse(data);
      return single ? [single] : [];
    }

    return [];
  },

  async getById(id) {
    if (!id) throw new Error("O identificador do pagamento é obrigatório");
    const api = ApiService();
    const response = await api.get(`pagamento/${id}`);
    return normaliseResponse(response?.data ?? null);
  },

  async create(payload) {
    if (!payload) throw new Error("Os dados do pagamento são obrigatórios");

    const api = ApiService();
    const body = {
      Valor: Number(payload.Valor ?? payload.valor ?? 0),
      FormaPagamento: toFormaValue(payload.FormaPagamento ?? payload.formaPagamento ?? payload.forma),
      PorcentagemRecebida: Number(
        payload.PorcentagemRecebida ?? payload.porcentagemRecebida ?? payload.porcentagem ?? 0
      ),
      AluguelId: Number(payload.AluguelId ?? payload.aluguelId ?? payload.aluguel ?? 0),
    };

    if (!body.AluguelId) {
      throw new Error("Informe o aluguel associado ao pagamento");
    }

    const response = await api.post("pagamento", body);
    return normaliseResponse(response?.data ?? null);
  },

  async update(id, payload) {
    if (!id) throw new Error("O identificador do pagamento é obrigatório");
    const api = ApiService();
    const body = {
      Valor: Number(payload.Valor ?? payload.valor ?? 0),
      FormaPagamento: toFormaValue(payload.FormaPagamento ?? payload.formaPagamento ?? payload.forma),
      PorcentagemRecebida: Number(
        payload.PorcentagemRecebida ?? payload.porcentagemRecebida ?? payload.porcentagem ?? 0
      ),
      AluguelId: Number(payload.AluguelId ?? payload.aluguelId ?? payload.aluguel ?? 0),
    };

    const response = await api.put(`pagamento/${id}`, body);
    return normaliseResponse(response?.data ?? null);
  },

  async remove(id) {
    if (!id) throw new Error("O identificador do pagamento é obrigatório");
    const api = ApiService();
    await api.del(`pagamento/${id}`);
  },
};

export default pagamentosService;
