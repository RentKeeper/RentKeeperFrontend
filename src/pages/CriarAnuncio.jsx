import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign,
  User,
  MessageSquare,
  Save
} from "lucide-react";
import { anunciosService } from "../services/anuncios";
import { mapAnuncioToBackend } from "../utils/anuncioMapper";
import "./CriarAnuncio.css";

export default function CriarAnuncio() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    anuncioJogador: "",
    anuncioPartida: "",
    localPartida: "",
    dataPartida: "",
    horaPartida: "",
    preco: "",
    descricao: "",
    posicao: "0", // 0 = Goleiro por padrão
    experiencia: "",
    disponibilidade: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      disponibilidade: checked 
        ? [...prev.disponibilidade, value]
        : prev.disponibilidade.filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Pegar o usuário logado do localStorage
      const usuarioLogado = JSON.parse(localStorage.getItem("usuario"));
      if (!usuarioLogado) {
        throw new Error("Usuário não está logado");
      }

      const anuncioData = {
        ...formData,
        usuarioId: usuarioLogado.id,
        dataPartida: new Date(formData.dataPartida),
        horaPartida: new Date(`2000-01-01T${formData.horaPartida}`)
      };

      const anuncioBackend = mapAnuncioToBackend(anuncioData);
      await anunciosService.create(anuncioBackend);
      
      navigate('/anuncios');
    } catch (err) {
      console.error('Erro ao criar anúncio:', err);
      setError(err.message || 'Erro ao criar anúncio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const posicoes = [
    { value: "0", label: "Goleiro" },
    { value: "1", label: "Defensor" },
    { value: "2", label: "Meia" },
    { value: "3", label: "Atacante" },
    { value: "4", label: "Juiz" }
  ];

  const experiencias = [
    { value: "1-3 anos", label: "1-3 anos (Iniciante)" },
    { value: "4-7 anos", label: "4-7 anos (Intermediário)" },
    { value: "8-12 anos", label: "8-12 anos (Experiente)" },
    { value: "12+ anos", label: "12+ anos (Muito Experiente)" }
  ];

  const horarios = [
    { value: "08:00-10:00", label: "08:00 - 10:00" },
    { value: "10:00-12:00", label: "10:00 - 12:00" },
    { value: "14:00-16:00", label: "14:00 - 16:00" },
    { value: "16:00-18:00", label: "16:00 - 18:00" },
    { value: "18:00-20:00", label: "18:00 - 20:00" },
    { value: "20:00-22:00", label: "20:00 - 22:00" }
  ];

  return (
    <div className="criar-anuncio-container">
      {/* Header */}
      <header className="criar-anuncio-header">
        <div className="header-content">
          <button 
            onClick={() => navigate('/anuncios')} 
            className="back-button"
          >
            <ArrowLeft className="back-icon" />
            Voltar aos Anúncios
          </button>
          
          <div className="header-brand">
            <div className="header-icon-container">
              <Shield className="header-icon" />
              <div className="header-icon-glow"></div>
            </div>
            <h1 className="header-title">RentKeeper</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="criar-anuncio-main">
        <div className="criar-anuncio-content">
          <div className="form-header">
            <h2 className="form-title">Criar Novo Anúncio</h2>
            <p className="form-subtitle">
              Anuncie sua disponibilidade como jogador e encontre partidas
            </p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="criar-anuncio-form">
            {/* Informações Básicas */}
            <div className="form-section">
              <h3 className="section-title">
                <User className="section-icon" />
                Informações Básicas
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="anuncioJogador">Título do Anúncio</label>
                  <input
                    type="text"
                    id="anuncioJogador"
                    name="anuncioJogador"
                    value={formData.anuncioJogador}
                    onChange={handleInputChange}
                    placeholder="Ex: Goleiro experiente disponível para partidas"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="posicao">Posição</label>
                  <select
                    id="posicao"
                    name="posicao"
                    value={formData.posicao}
                    onChange={handleInputChange}
                    required
                  >
                    {posicoes.map(posicao => (
                      <option key={posicao.value} value={posicao.value}>
                        {posicao.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="experiencia">Experiência</label>
                  <select
                    id="experiencia"
                    name="experiencia"
                    value={formData.experiencia}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Selecione sua experiência</option>
                    {experiencias.map(exp => (
                      <option key={exp.value} value={exp.value}>
                        {exp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="preco">Preço por Jogo (R$)</label>
                  <input
                    type="number"
                    id="preco"
                    name="preco"
                    value={formData.preco}
                    onChange={handleInputChange}
                    placeholder="50"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Detalhes da Partida */}
            <div className="form-section">
              <h3 className="section-title">
                <MessageSquare className="section-icon" />
                Detalhes da Partida
              </h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="anuncioPartida">Tipo de Partida</label>
                  <input
                    type="text"
                    id="anuncioPartida"
                    name="anuncioPartida"
                    value={formData.anuncioPartida}
                    onChange={handleInputChange}
                    placeholder="Ex: Pelada, Campeonato, Treino"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="localPartida">Local da Partida</label>
                  <input
                    type="text"
                    id="localPartida"
                    name="localPartida"
                    value={formData.localPartida}
                    onChange={handleInputChange}
                    placeholder="Ex: Quadra do Parque, Clube Esportivo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dataPartida">Data da Partida</label>
                  <input
                    type="date"
                    id="dataPartida"
                    name="dataPartida"
                    value={formData.dataPartida}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="horaPartida">Horário da Partida</label>
                  <input
                    type="time"
                    id="horaPartida"
                    name="horaPartida"
                    value={formData.horaPartida}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Disponibilidade */}
            <div className="form-section">
              <h3 className="section-title">
                <Clock className="section-icon" />
                Horários de Disponibilidade
              </h3>
              
              <div className="disponibilidade-grid">
                {horarios.map(horario => (
                  <label key={horario.value} className="checkbox-label">
                    <input
                      type="checkbox"
                      value={horario.value}
                      checked={formData.disponibilidade.includes(horario.value)}
                      onChange={handleCheckboxChange}
                    />
                    <span className="checkbox-text">{horario.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Descrição */}
            <div className="form-section">
              <h3 className="section-title">
                <MessageSquare className="section-icon" />
                Descrição Adicional
              </h3>
              
              <div className="form-group">
                <label htmlFor="descricao">Descrição (Opcional)</label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Conte um pouco sobre você, suas habilidades, preferências de jogo..."
                  rows="4"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/anuncios')}
                className="cancel-btn"
                disabled={loading}
              >
                Cancelar
              </button>
              
              <button
                type="submit"
                className={`submit-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Save className="submit-icon" />
                    Criar Anúncio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 