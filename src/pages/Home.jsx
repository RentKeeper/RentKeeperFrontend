import React from 'react';
import './Home.css';
import { 
  Shield, 
  Users, 
  Clock, 
  MapPin, 
  CreditCard,
  Award,
  Target,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-bg">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <div className="header-brand">
            <div className="header-icon-bg">
              <Shield className="header-icon" />
            </div>
            <div>
              <h1 className="header-title">RentKeeper</h1>
              <p className="header-subtitle">Conecte & Jogue</p>
            </div>
          </div>
          <nav className="header-nav">
            <button type="button" className="header-link" onClick={() => navigate('/como-funciona')}>Como Funciona</button>
            <a href="#" className="header-link">Preços</a>
            <a href="#" className="header-link">Suporte</a>
            <button type="button" className="header-btn" onClick={() => navigate('/login')}>Entrar</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-title-bg">
            <h2 className="hero-title">
              Encontre o Jogador
              <span className="hero-title-gradient">Perfeito</span>
            </h2>
          </div>
          <p className="hero-desc">
            Conecte-se com jogadores profissionais ou ofereça seus serviços. 
            A plataforma mais confiável para aluguéis de jogadores no Brasil.
          </p>

          {/* Stats */}
          

          {/* Main Action Cards */}
          <div className="action-cards">
            {/* Rent a Player Card */}
            <div className="action-card">
              <div className="action-card-icon-bg">
                <Users className="action-card-icon" />
              </div>
              <h3 className="action-card-title">Preciso de um Jogador</h3>
              <p className="action-card-desc">
                Encontre jogadores profissionais disponíveis para seu jogo. 
                Filtre por localização, preço e avaliações.
              </p>
              <div className="action-card-features">
                <div className="action-card-feature"><CheckCircle className="feature-icon" />Jogadores verificados</div>
                <div className="action-card-feature"><CheckCircle className="feature-icon" />Pagamento seguro</div>
                <div className="action-card-feature"><CheckCircle className="feature-icon" />Suporte 24/7</div>
              </div>
              <button className="action-card-btn" type="button" onClick={() => navigate('/anuncios')}>Encontrar Jogador</button>
            </div>

            {/* Offer Services Card */}
            <div className="action-card">
              <div className="action-card-icon-bg alt">
                <Target className="action-card-icon" />
              </div>
              <h3 className="action-card-title">Sou Jogador</h3>
              <p className="action-card-desc">
                Cadastre-se como jogador e seja contratado para jogos. 
                Defina seus horários, preços e região de atendimento.
              </p>
              <div className="action-card-features">
                <div className="action-card-feature"><CheckCircle className="feature-icon" />Renda extra garantida</div>
                <div className="action-card-feature"><CheckCircle className="feature-icon" />Flexibilidade total</div>
                <div className="action-card-feature"><CheckCircle className="feature-icon" />Perfil profissional</div>
              </div>
              <button className="action-card-btn alt" type="button" onClick={() => navigate('/register')}>Cadastrar-se</button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="features-header">
            <h3 className="features-title">Por que escolher o RentKeeper?</h3>
            <p className="features-desc">
              A plataforma mais completa e segura para conectar jogadores e times
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card-icon-bg"><Clock className="feature-card-icon" /></div>
              <h4 className="feature-card-title">Disponibilidade 24/7</h4>
              <p className="feature-card-desc">Encontre jogadores disponíveis a qualquer hora do dia</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon-bg"><MapPin className="feature-card-icon" /></div>
              <h4 className="feature-card-title">Cobertura Nacional</h4>
              <p className="feature-card-desc">Jogadores em todas as principais cidades do Brasil</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon-bg"><CreditCard className="feature-card-icon" /></div>
              <h4 className="feature-card-title">Pagamento Seguro</h4>
              <p className="feature-card-desc">Transações protegidas com as melhores tecnologias</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon-bg"><Award className="feature-card-icon" /></div>
              <h4 className="feature-card-title">Qualidade Garantida</h4>
              <p className="feature-card-desc">Todos os jogadores são verificados e avaliados</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <TrendingUp className="cta-icon" />
            <h3 className="cta-title">Comece Hoje Mesmo</h3>
            <p className="cta-desc">
              Junte-se a milhares de usuários que já encontraram a solução perfeita 
              para seus jogos de futebol
            </p>
            <div className="cta-btns">
              <button className="cta-btn" type="button" onClick={() => navigate('/register')}>Cadastrar Gratuitamente</button>
              <button className="cta-btn alt" type="button" onClick={() => navigate('/como-funciona')}>Saber Mais</button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">
                <Shield className="footer-icon" />
                <span className="footer-title">RentKeeper</span>
              </div>
              <p className="footer-desc">
                A plataforma líder em aluguel de jogadores no Brasil
              </p>
            </div>
            <div>
              <h4 className="footer-section-title">Plataforma</h4>
              <div className="footer-links">
                <button type="button" className="footer-link" onClick={() => navigate('/como-funciona')}>Como Funciona</button>
                <a href="#" className="footer-link">Preços</a>
                <a href="#" className="footer-link">Avaliações</a>
              </div>
            </div>
            <div>
              <h4 className="footer-section-title">Suporte</h4>
              <div className="footer-links">
                <a href="#" className="footer-link">Central de Ajuda</a>
                <a href="#" className="footer-link">Contato</a>
                <a href="#" className="footer-link">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="footer-section-title">Legal</h4>
              <div className="footer-links">
                <a href="#" className="footer-link">Termos de Uso</a>
                <a href="#" className="footer-link">Privacidade</a>
                <a href="#" className="footer-link">Cookies</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} RentKeeper. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 