import api from './api';

export const anunciosService = {
  // Buscar todos os anúncios
  async getAll(page = 1, pageSize = 10) {
    try {
      const response = await api.get(`/anuncio?page=${page}&pageSize=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
      throw error;
    }
  },

  // Buscar anúncio por ID
  async getById(id) {
    try {
      const response = await api.get(`/anuncio/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar anúncio:', error);
      throw error;
    }
  },

  // Criar novo anúncio
  async create(anuncioData) {
    try {
      const response = await api.post('/anuncio', anuncioData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar anúncio:', error);
      throw error;
    }
  },

  // Atualizar anúncio
  async update(id, anuncioData) {
    try {
      const response = await api.put(`/anuncio/${id}`, anuncioData);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar anúncio:', error);
      throw error;
    }
  },

  // Deletar anúncio
  async delete(id) {
    try {
      await api.delete(`/anuncio/${id}`);
    } catch (error) {
      console.error('Erro ao deletar anúncio:', error);
      throw error;
    }
  }
};

export default anunciosService; 