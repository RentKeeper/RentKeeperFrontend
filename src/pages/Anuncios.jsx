import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Shield, 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  Clock, 
  Calendar,
  Users,
  Award,
  Phone,
  MessageCircle,
  ChevronLeft,
  SlidersHorizontal,
  Zap,
  CheckCircle,
  Heart,
  Share2,
  DollarSign,
  CalendarDays,
  Clock3,
  CirclePlus
} from "lucide-react";
import "./Anuncios.css";
import { anunciosService } from "../services/anuncios";
import { mapAnuncioFromBackend } from "../utils/anuncioMapper";
import UserMenu from "../components/UserMenu";
import Logo from "../components/Logo";

const mockAnuncios = [
  {
    id: 1,
    titulo: "Carlos Silva",
    proprietario: "Carlos Silva",
    rating: 4.9,
    reviews: 127,
    localizacao: "São Paulo, SP",
    distancia: "2.3 km",
    preco: 120,
    disponibilidade: "Disponível hoje",
    tipo: "Goleiro",
    superficie: "Experiência Profissional",
    capacidade: "8 anos",
    image: "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: true,
    responseTime: "< 1h",
    reservasCompletadas: 234,
    horarios: ["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00"],
    comodidades: ["Penaltis", "Saídas de gol", "Jogo aéreo", "Liderança"]
  },
  {
    id: 2,
    titulo: "Rafael Santos",
    proprietario: "Rafael Santos",
    rating: 4.8,
    reviews: 89,
    localizacao: "São Paulo, SP",
    distancia: "4.1 km",
    preco: 95,
    disponibilidade: "Disponível amanhã",
    tipo: "Goleiro",
    superficie: "Experiência Amadora",
    capacidade: "12 anos",
    image: "https://images.pexels.com/photos/2834914/pexels-photo-2834914.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: true,
    responseTime: "< 30min",
    reservasCompletadas: 312,
    horarios: ["09:00-11:00", "15:00-17:00", "19:00-21:00"],
    comodidades: ["Reflexos", "Liderança", "Distribuição", "Comunicação"]
  },
  {
    id: 3,
    titulo: "Bruno Costa",
    proprietario: "Bruno Costa",
    rating: 4.7,
    reviews: 156,
    localizacao: "São Paulo, SP",
    distancia: "1.8 km",
    preco: 80,
    disponibilidade: "Disponível hoje",
    tipo: "Goleiro",
    superficie: "Experiência Intermediária",
    capacidade: "5 anos",
    image: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: true,
    responseTime: "< 2h",
    reservasCompletadas: 178,
    horarios: ["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"],
    comodidades: ["Agilidade", "Chutes de longe", "Comunicação", "Flexibilidade"]
  },
  {
    id: 4,
    titulo: "Diego Oliveira",
    proprietario: "Diego Oliveira",
    rating: 4.9,
    reviews: 203,
    localizacao: "São Paulo, SP",
    distancia: "3.7 km",
    preco: 150,
    disponibilidade: "Disponível hoje",
    tipo: "Goleiro",
    superficie: "Experiência Profissional",
    capacidade: "10 anos",
    image: "https://images.pexels.com/photos/2834914/pexels-photo-2834914.jpeg?auto=compress&cs=tinysrgb&w=400",
    verified: true,
    responseTime: "< 15min",
    reservasCompletadas: 445,
    horarios: ["07:00-09:00", "09:00-11:00", "13:00-15:00", "15:00-17:00", "17:00-19:00", "19:00-21:00"],
    comodidades: ["Experiência profissional", "Penaltis", "Liderança", "Técnica avançada"]
  }
];

export default function Anuncios() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAnuncio, setSelectedAnuncio] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [filters, setFilters] = useState({
    priceRange: [50, 200],
    rating: 4.0,
    availability: 'all',
    distance: 10,
    tipo: 'all'
  });

  const resolveAnuncioId = (value) => {
    if (!value) return null;
    const candidate = typeof value === "object"
      ? value.id ?? value.IdAnuncio ?? value.anuncioId ?? value.Id ?? value.anuncioID
      : value;
    if (candidate === null || candidate === undefined || candidate === "") {
      return null;
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    const numeric = Number(candidate);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
    return typeof candidate === "string" ? candidate : null;
  };

  const isSelected = (anuncio) => {
    const id = resolveAnuncioId(anuncio);
    if (!id) return false;
    return selectedIds.includes(id);
  };

  const toggleSelection = (event, anuncio) => {
    const id = resolveAnuncioId(anuncio);
    if (!id) return;
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedIds([]);

  const goToAluguel = () => {
    if (selectedIds.length === 0) return;
    navigate(`/aluguel?anuncioIds=${selectedIds.join(",")}`);
  };

  // Carregar anúncios do backend
  useEffect(() => {
    const loadAnuncios = async () => {
      try {
        setLoading(true);
        setError(null);
        const anunciosBackend = await anunciosService.get(1, 20); // Buscar 20 anúncios
        const anunciosMapeados = anunciosBackend.map(mapAnuncioFromBackend);
        setAnuncios(anunciosMapeados);
      } catch (err) {
        console.error('Erro ao carregar anúncios:', err);
        setError('Erro ao carregar anúncios. Tente novamente.');
        // Usar dados mockados como fallback
        setAnuncios(mockAnuncios);
      } finally {
        setLoading(false);
      }
    };

    loadAnuncios();
  }, []);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const filteredAnuncios = useMemo(() => {
    const termo = searchTerm.toLowerCase();
    return anuncios.filter((anuncio) => (
      anuncio.titulo?.toLowerCase().includes(termo) ||
      anuncio.localizacao?.toLowerCase().includes(termo) ||
      anuncio.proprietario?.toLowerCase().includes(termo)
    ));
  }, [anuncios, searchTerm]);

  if (selectedAnuncio) {
    const anuncioId = resolveAnuncioId(selectedAnuncio);
    const selecionado = anuncioId ? selectedIds.includes(anuncioId) : false;
    return (
      <div className="anuncios-container">
        {/* Header */}
        <header className="anuncios-header">
          <div className="header-content">
            <button 
              onClick={() => setSelectedAnuncio(null)}
              className="back-button"
            >
              <ChevronLeft className="back-icon" />
              <span>Voltar</span>
            </button>
            <div className="header-actions">
              <button className="action-btn">
                <Heart className="action-icon" />
              </button>
              <button className="action-btn">
                <Share2 className="action-icon" />
              </button>
            </div>
          </div>
        </header>

        {/* Anuncio Profile */}
        <div className="details-container">
          <div className="details-grid">
            {/* Main Info */}
            <div className="details-main">
              {/* Profile Card */}
              <div className="profile-card">
                <div className="profile-content">
                  <div className="profile-image-container">
                    <img 
                      src={selectedAnuncio.image} 
                      alt={selectedAnuncio.titulo}
                      className="profile-image"
                    />
                    {selectedAnuncio.verified && (
                      <div className="verified-badge">
                        <CheckCircle className="verified-icon" />
                      </div>
                    )}
                  </div>
                  <div className="profile-info">
                    <div className="profile-header">
                      <div>
                        <h1 className="profile-title">{selectedAnuncio.titulo}</h1>
                        <div className="profile-subtitle">
                          <span>{selectedAnuncio.proprietario}</span>
                          <span>•</span>
                          <span>{selectedAnuncio.tipo}</span>
                        </div>
                      </div>
                      <div className="profile-price">
                        <div className="profile-price-value">R$ {selectedAnuncio.preco}</div>
                        <div className="profile-price-label">por jogo</div>
                        <button
                          type="button"
                          className={`profile-select-btn ${selecionado ? 'selected' : ''}`}
                          onClick={(event) => toggleSelection(event, selectedAnuncio)}
                        >
                          {selecionado ? 'Selecionado' : 'Selecionar'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="anuncio-meta">
                      <div className="rating-container">
                        <Star className="star-icon" />
                        <span className="rating-value">{selectedAnuncio.rating}</span>
                        <span className="rating-count">({selectedAnuncio.reviews} avaliações)</span>
                      </div>
                      <div className="location-container">
                        <MapPin className="location-icon" />
                        <span>{selectedAnuncio.localizacao}</span>
                      </div>
                    </div>

                    <div className="comodidades-tags">
                      {selectedAnuncio.comodidades.map((comodidade, index) => (
                        <span 
                          key={index}
                          className="comodidade-tag"
                        >
                          {comodidade}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                                  <div className="stat-card">
                    <div className="stat-header">
                      <Award className="stat-icon" />
                      <span className="stat-title">Jogos Completos</span>
                    </div>
                    <div className="stat-value">{selectedAnuncio.reservasCompletadas}</div>
                  </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <Clock className="stat-icon" />
                    <span className="stat-title">Tempo de Resposta</span>
                  </div>
                  <div className="stat-value">{selectedAnuncio.responseTime}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-header">
                    <Zap className="stat-icon" />
                    <span className="stat-title">Status</span>
                  </div>
                  <div className="stat-value">{selectedAnuncio.disponibilidade}</div>
                </div>
              </div>

              {/* Details */}
              <div className="details-section">
                <h3 className="section-title">Detalhes do Goleiro</h3>
                <div className="details-grid-inner">
                  <div className="detail-group">
                    <h4>Características</h4>
                    <div className="detail-item">
                      <span className="detail-label">Posição:</span>
                      <span className="detail-value">{selectedAnuncio.tipo}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Nível:</span>
                      <span className="detail-value">{selectedAnuncio.superficie}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Experiência:</span>
                      <span className="detail-value">{selectedAnuncio.capacidade}</span>
                    </div>
                  </div>
                  <div className="detail-group">
                    <h4>Horários Disponíveis</h4>
                    <div className="horarios-grid">
                      {selectedAnuncio.horarios.map((horario, index) => (
                        <span 
                          key={index}
                          className="horario-tag"
                        >
                          {horario}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="details-section">
                <h3 className="section-title">Avaliações Recentes</h3>
                <div className="reviews-list">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="review-item">
                      <div className="review-content">
                        <div className="review-avatar">
                          <span className="review-avatar-text">M</span>
                        </div>
                        <div className="review-info">
                          <div className="review-header">
                            <span className="review-author">Marcos Silva</span>
                            <div className="review-stars">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className="star-icon" />
                              ))}
                            </div>
                          </div>
                          <p className="review-text">
                            Excelente quadra! Gramado em perfeito estado, vestiários limpos e atendimento muito bom.
                          </p>
                          <span className="review-date">Há 2 dias</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="booking-sidebar">
              <div className="booking-card">
                                  <div className="booking-price">
                    <div className="booking-price-value">R$ {selectedAnuncio.preco}</div>
                    <div className="booking-price-label">por jogo</div>
                  </div>

                <div className="booking-form">
                  <div className="form-group">
                    <label>Data do Jogo</label>
                    <input 
                      type="date" 
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Horário</label>
                    <select className="form-input">
                      <option value="">Selecione o horário</option>
                      {selectedAnuncio.horarios.map((horario, index) => (
                        <option key={index} value={horario}>{horario}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Local do Jogo</label>
                    <input 
                      type="text" 
                      placeholder="Digite o endereço"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="booking-actions">
                  <button
                    className="primary-btn"
                    onClick={() => {
                      if (anuncioId) {
                        navigate(`/aluguel?anuncioId=${anuncioId}`);
                      }
                    }}
                  >
                    Contratar Agora
                  </button>
                  <button
                    className="secondary-btn"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      if (!anuncioId) return;
                      const alreadySelected = selectedIds.includes(anuncioId);
                      const nextIds = alreadySelected
                        ? selectedIds
                        : [...selectedIds, anuncioId];
                      if (!alreadySelected) {
                        setSelectedIds(nextIds);
                      }
                      navigate(`/aluguel?anuncioIds=${nextIds.join(",")}`);
                    }}
                  >
                    <CirclePlus className="btn-icon" />
                    <span>{selecionado ? 'Contratar selecionados' : 'Selecionar e contratar'}</span>
                  </button>
                  <button className="secondary-btn">
                    <MessageCircle className="btn-icon" />
                    <span>Enviar Mensagem</span>
                  </button>
                  <button className="secondary-btn">
                    <Phone className="btn-icon" />
                    <span>Ligar</span>
                  </button>
                </div>

                                  <div className="booking-footer">
                    <p>Pagamento seguro • Cancelamento gratuito até 2h antes do jogo</p>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="anuncios-container">
      {/* Header */}
      <header className="anuncios-header">
        <div className="header-content">
          <div className="header-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <div className="header-icon-container">
              <Logo size={36} className="header-icon" />
              <div className="header-icon-glow"></div>
            </div>
            <div>
              <h1 className="header-title">RentKeeper</h1>
              <p className="header-subtitle">Encontrar Goleiro</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="header-profile-btn">
              Meu Perfil
            </button>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <section className="anuncios-section">
        <div className="anuncios-content">
          <div className="anuncios-header">
            <h2 className="anuncios-title">Encontre o Goleiro Ideal</h2>
            <p className="anuncios-subtitle">Goleiros profissionais disponíveis na sua região</p>
          </div>

          <div className="search-container">
            {/* Search Bar */}
            <div className="search-bar">
              <Search className="search-icon" />
              <input
                type="text"
                placeholder="Buscar por nome ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-btn"
            >
              <SlidersHorizontal className="filter-icon" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Faixa de Preço</label>
                  <div>
                    <input 
                      type="range" 
                      min="50" 
                      max="200" 
                      className="filter-input"
                    />
                    <div className="range-container">
                      <span>R$ 50</span>
                      <span>R$ 200</span>
                    </div>
                  </div>
                </div>
                <div className="filter-group">
                  <label>Avaliação Mínima</label>
                  <select className="filter-input">
                    <option value="4.0">4.0+ estrelas</option>
                    <option value="4.5">4.5+ estrelas</option>
                    <option value="4.8">4.8+ estrelas</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Experiência</label>
                  <select className="filter-input">
                    <option value="all">Qualquer nível</option>
                    <option value="beginner">Iniciante (1-3 anos)</option>
                    <option value="intermediate">Intermediário (4-7 anos)</option>
                    <option value="expert">Experiente (8+ anos)</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Disponibilidade</label>
                  <select className="filter-input">
                    <option value="all">Qualquer horário</option>
                    <option value="today">Disponível hoje</option>
                    <option value="tomorrow">Disponível amanhã</option>
                    <option value="weekend">Final de semana</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Results Header */}
          <div className="results-header">
            <div className="results-count">
              <span>{filteredAnuncios.length} goleiros encontrados</span>
            </div>
            <div className="results-actions">
              <select className="sort-select">
                <option value="rating">Melhor avaliação</option>
                <option value="price-low">Menor preço</option>
                <option value="price-high">Maior preço</option>
                <option value="distance">Mais próximo</option>
              </select>
              <button 
                onClick={() => navigate('/criar-anuncio')}
                className="create-anuncio-btn"
              >
                <Shield className="create-icon" />
                Criar Anúncio
              </button>
            </div>
          </div>

          {/* Loading e Error States */}
          {loading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Carregando goleiros...</p>
            </div>
          )}

          {error && !loading && (
            <div className="error-container">
              <p className="error-message">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="retry-button"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Anuncios Grid */}
          {!loading && !error && (
            <>
              {selectedIds.length > 0 && (
                <div className="selection-bar">
                  <div className="selection-info">
                    {selectedIds.length} jogador{selectedIds.length > 1 ? 'es' : ''} selecionado{selectedIds.length > 1 ? 's' : ''}
                  </div>
                  <div className="selection-actions">
                    <button
                      type="button"
                      className="selection-confirm-btn"
                      onClick={goToAluguel}
                    >
                      Contratar selecionados
                    </button>
                    <button
                      type="button"
                      className="selection-clear-btn"
                      onClick={clearSelection}
                    >
                      Limpar seleção
                    </button>
                  </div>
                </div>
              )}
              <div className="anuncios-grid">
                {filteredAnuncios.map((anuncio) => {
                  const anuncioId = resolveAnuncioId(anuncio);
                  const cardSelected = isSelected(anuncio);
                  const favoriteId = anuncioId ?? anuncio.id;
                  const fallbackId = favoriteId ?? anuncio.id ?? anuncio.titulo;
                  const comodidades = Array.isArray(anuncio.comodidades) ? anuncio.comodidades : [];
                  return (
                    <div 
                      key={fallbackId}
                      className={`anuncio-card ${cardSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedAnuncio(anuncio)}
                    >
                      <div className="anuncio-image-container">
                        <img 
                          src={anuncio.image} 
                          alt={anuncio.titulo}
                          className="anuncio-image"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(fallbackId);
                          }}
                          className="favorite-btn"
                        >
                          <Heart 
                            className={`favorite-icon ${favorites.includes(fallbackId) ? 'active' : ''}`}
                          />
                        </button>
                        {anuncio.verified && (
                          <div className="verified-badge">
                            <CheckCircle className="verified-icon" />
                          </div>
                        )}
                        <div className="availability-badge">
                          <span className="availability-text">{anuncio.disponibilidade}</span>
                        </div>
                        <button
                          type="button"
                          className={`select-toggle ${cardSelected ? 'selected' : ''}`}
                          onClick={(event) => toggleSelection(event, anuncio)}
                        >
                          {cardSelected ? (
                            <CheckCircle className="select-toggle-icon" />
                          ) : (
                            <CirclePlus className="select-toggle-icon" />
                          )}
                          <span>{cardSelected ? 'Selecionado' : 'Selecionar'}</span>
                        </button>
                      </div>

                      <div className="anuncio-content">
                        <div className="anuncio-header">
                          <div className="anuncio-info">
                            <h3>{anuncio.titulo}</h3>
                            <p>{anuncio.capacidade} de experiência • {anuncio.tipo}</p>
                          </div>
                          <div className="anuncio-price">
                            <div className="price-value">R$ {anuncio.preco}</div>
                            <div className="price-label">por jogo</div>
                          </div>
                        </div>

                        <div className="anuncio-meta">
                          <div className="rating-container">
                            <Star className="star-icon" />
                            <span className="rating-value">{anuncio.rating}</span>
                            <span className="rating-count">({anuncio.reviews})</span>
                          </div>
                          <div className="location-container">
                            <MapPin className="location-icon" />
                            <span>{anuncio.distancia}</span>
                          </div>
                        </div>

                        <div className="comodidades-tags">
                          {comodidades.slice(0, 2).map((comodidade, index) => (
                            <span 
                              key={index}
                              className="comodidade-tag"
                            >
                              {comodidade}
                            </span>
                          ))}
                          {comodidades.length > 2 && (
                            <span className="comodidade-tag more">
                              +{comodidades.length - 2}
                            </span>
                          )}
                        </div>

                        <div className="anuncio-footer">
                          <div className="footer-info">
                            <Clock className="footer-icon" />
                            <span>Responde em {anuncio.responseTime}</span>
                          </div>
                          <div className="footer-info">
                            <Users className="footer-icon" />
                            <span>{anuncio.reservasCompletadas} jogos</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
