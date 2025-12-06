import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Search, 
  Calendar, 
  CreditCard, 
  Star, 
  Users,
  CheckCircle,
  Clock,
  MapPin,
  Award,
  ChevronLeft,
  Play,
  Target,
  MessageCircle,
  Phone,
  Zap
} from 'lucide-react';
import './ComoFunciona.css';
import Logo from '../components/Logo';

export default function ComoFunciona() {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Search,
      title: "1. Busque e Filtre",
      description: "Use nossa busca avançada para encontrar jogadores na sua região. Filtre por posição, preço, avaliação e disponibilidade.",
      details: [
        "Busca por localização em tempo real",
        "Filtros personalizáveis por posição",
        "Visualização de perfis detalhados",
        "Comparação de jogadores"
      ]
    },
    {
      icon: Users,
      title: "2. Escolha o Jogador",
      description: "Analise os perfis, veja avaliações de outros usuários e escolha o jogador ideal para sua partida.",
      details: [
        "Perfis verificados e completos",
        "Avaliações reais de outros usuários",
        "Histórico de jogos realizados",
        "Especialidades e experiência destacadas"
      ]
    },
    {
      icon: Calendar,
      title: "3. Agende a Partida",
      description: "Selecione data, horário e local. O jogador receberá sua solicitação instantaneamente.",
      details: [
        "Calendário integrado e intuitivo",
        "Confirmação automática via SMS/email",
        "Lembretes automáticos",
        "Reagendamento flexível"
      ]
    },
    {
      icon: CreditCard,
      title: "4. Pagamento Seguro",
      description: "Pague de forma segura através da plataforma. O valor só é liberado após a confirmação da partida.",
      details: [
        "Pagamento 100% protegido",
        "Múltiplas formas de pagamento",
        "Reembolso garantido",
        "Sem taxas ocultas"
      ]
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Segurança Garantida",
      description: "Todos os jogadores são verificados e avaliados pela comunidade"
    },
    {
      icon: Clock,
      title: "Disponibilidade 24/7",
      description: "Encontre jogadores disponíveis a qualquer hora do dia"
    },
    {
      icon: Star,
      title: "Qualidade Comprovada",
      description: "Sistema de avaliações garante a qualidade dos serviços"
    },
    {
      icon: MapPin,
      title: "Cobertura Nacional",
      description: "Jogadores disponíveis em todas as principais cidades"
    },
    {
      icon: Award,
      title: "Jogadores Profissionais",
      description: "Desde iniciantes até ex-profissionais experientes"
    },
    {
      icon: Zap,
      title: "Resposta Rápida",
      description: "Confirmação em minutos, não em horas"
    }
  ];

  const faqs = [
    {
      question: "Como funciona o pagamento?",
      answer: "O pagamento é feito de forma segura através da plataforma. O valor só é liberado para o jogador após a confirmação de que a partida aconteceu."
    },
    {
      question: "E se o jogador não aparecer?",
      answer: "Temos uma política de reembolso total caso o jogador não compareça. Além disso, oferecemos jogadores substitutos de emergência."
    },
    {
      question: "Posso cancelar a reserva?",
      answer: "Sim, você pode cancelar até 2 horas antes da partida sem custos. Cancelamentos com menos de 2 horas têm taxa de 30%."
    },
    {
      question: "Os jogadores são verificados?",
      answer: "Todos os jogadores passam por um processo de verificação que inclui documentos, referências e avaliação de habilidades."
    },
    {
      question: "Qual o preço médio?",
      answer: "Os preços variam de R$ 50 a R$ 200 por partida, dependendo da posição, experiência do jogador e região. A média nacional é R$ 85."
    },
    {
      question: "Posso contratar para torneios?",
      answer: "Sim! Nossa plataforma é perfeita para torneios, campeonatos e eventos. Oferecemos pacotes especiais para múltiplos jogadores."
    }
  ];

  const handleBack = () => {
    navigate('/');
  };

  const handleFindPlayer = () => {
    navigate('/anuncios');
  };

  const handleRegisterPlayer = () => {
    navigate('/register');
  };

  return (
    <div className="como-funciona-container">
      {/* Header */}
      <header className="como-funciona-header">
        <div className="header-content">
          <button 
            onClick={handleBack}
            className="back-button"
          >
            <ChevronLeft className="back-icon" />
            <span>Voltar</span>
          </button>
          <div className="header-brand">
            <Logo size={36} className="header-icon" />
            <div>
              <h1 className="header-title">RentKeeper</h1>
              <p className="header-subtitle">Como Funciona</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <h2 className="hero-title">
            Como Funciona o
            <span className="hero-title-gradient">RentKeeper</span>
          </h2>
          <p className="hero-description">
            Conectar jogadores e times nunca foi tão fácil. Veja como nossa plataforma 
            revoluciona a forma de encontrar jogadores para suas partidas.
          </p>
          <div className="hero-indicator">
            <Play className="indicator-icon" />
            <span>Processo simples em 4 passos</span>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="steps-section">
        <div className="steps-container">
          <div className="section-header">
            <h3 className="section-title">Processo Simples</h3>
            <p className="section-subtitle">Do primeiro clique à partida realizada</p>
          </div>

          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-content">
                  <div className="step-icon-container">
                    <step.icon className="step-icon" />
                  </div>
                  <div className="step-text">
                    <h4 className="step-title">{step.title}</h4>
                    <p className="step-description">{step.description}</p>
                    <ul className="step-details">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="step-detail">
                          <CheckCircle className="detail-icon" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="section-header">
            <h3 className="section-title">Por que Escolher o RentKeeper?</h3>
            <p className="section-subtitle">Vantagens que fazem a diferença</p>
          </div>

          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon-container">
                  <benefit.icon className="benefit-icon" />
                </div>
                <h4 className="benefit-title">{benefit.title}</h4>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Players Section */}
      <section className="for-players-section">
        <div className="for-players-container">
          <div className="for-players-grid">
            <div className="for-players-content">
              <h3 className="section-title">Para Jogadores</h3>
              <p className="section-description">
                Transforme sua paixão pelo futebol em renda extra. Cadastre-se como jogador 
                e seja contratado para partidas na sua região.
              </p>
              <div className="benefits-list">
                <div className="benefit-item">
                  <div className="benefit-check">
                    <CheckCircle className="check-icon" />
                  </div>
                  <span>Defina seus próprios preços e horários</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-check">
                    <CheckCircle className="check-icon" />
                  </div>
                  <span>Receba pagamentos seguros e pontuais</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-check">
                    <CheckCircle className="check-icon" />
                  </div>
                  <span>Construa sua reputação com avaliações</span>
                </div>
                <div className="benefit-item">
                  <div className="benefit-check">
                    <CheckCircle className="check-icon" />
                  </div>
                  <span>Suporte completo da plataforma</span>
                </div>
              </div>
              <button 
                onClick={handleRegisterPlayer}
                className="cta-button primary"
              >
                Cadastrar como Jogador
              </button>
            </div>
            <div className="stats-card">
              <div className="stats-content">
                <Target className="stats-icon" />
                <h4 className="stats-title">Renda Média Mensal</h4>
                <div className="stats-value">R$ 1.200</div>
                <p className="stats-label">Para jogadores ativos</p>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">15</div>
                    <div className="stat-label">Partidas/mês</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">4.8</div>
                    <div className="stat-label">Avaliação média</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="section-header">
            <h3 className="section-title">Perguntas Frequentes</h3>
            <p className="section-subtitle">Tire suas dúvidas sobre a plataforma</p>
          </div>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <h4 className="faq-question">{faq.question}</h4>
                <p className="faq-answer">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h3 className="cta-title">
              Pronto para Começar?
            </h3>
            <p className="cta-description">
              Junte-se a milhares de usuários que já descobriram a forma mais fácil 
              de encontrar jogadores profissionais
            </p>
            <div className="cta-buttons">
              <button 
                onClick={handleFindPlayer}
                className="cta-button primary"
              >
                Encontrar Jogador
              </button>
              <button 
                onClick={handleRegisterPlayer}
                className="cta-button secondary"
              >
                Cadastrar como Jogador
              </button>
            </div>
            <div className="cta-features">
              <div className="cta-feature">
                <MessageCircle className="feature-icon" />
                <span>Suporte 24/7</span>
              </div>
              <div className="cta-feature">
                <Shield className="feature-icon" />
                <span>100% Seguro</span>
              </div>
              <div className="cta-feature">
                <Star className="feature-icon" />
                <span>Satisfação Garantida</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
