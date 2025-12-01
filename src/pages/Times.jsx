import { useEffect, useMemo, useState } from "react";
import {
  Users,
  CalendarDays,
  MapPin,
  Flag,
  Trophy,
  RefreshCcw,
  PlusCircle,
  ClipboardList,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Times.css";
import Logo from "../components/Logo";
import UserMenu from "../components/UserMenu";
import { timesService } from "../services/times";
import { jogosService } from "../services/jogos";

const initialTeamForm = {
  nome: "",
  quantidadeJogadores: 7,
  usuarioIdsText: "",
};

const initialMatchForm = {
  timeMandanteId: "",
  timeVisitanteId: "",
  data: "",
  hora: "",
  local: "",
  observacoes: "",
};

const formatDateTime = (date) => {
  if (!date) return "";
  try {
    const formatter = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return formatter.format(date);
  } catch (error) {
    return "";
  }
};

export default function Times() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teamForm, setTeamForm] = useState(initialTeamForm);
  const [matchForm, setMatchForm] = useState(initialMatchForm);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  const teamsById = useMemo(() => {
    return teams.reduce((acc, team) => {
      if (team?.id) acc[team.id] = team;
      return acc;
    }, {});
  }, [teams]);

  const loadTeams = async () => {
    setLoadingTeams(true);
    setError(null);
    try {
      const response = await timesService.getAll(1, 50);
      setTeams(response ?? []);
    } catch (err) {
      console.error("Erro ao carregar times", err);
      setError("Não foi possível carregar os times. Tente novamente mais tarde.");
    } finally {
      setLoadingTeams(false);
    }
  };

  const loadMatches = async () => {
    setLoadingMatches(true);
    setError(null);
    try {
      const response = await jogosService.getAll(1, 50);
      setMatches(response ?? []);
    } catch (err) {
      console.error("Erro ao carregar jogos", err);
      setError("Não foi possível carregar os jogos. Tente novamente mais tarde.");
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    loadTeams();
    loadMatches();
  }, []);

  const handleTeamInputChange = (event) => {
    const { name, value } = event.target;
    setTeamForm((prev) => ({ ...prev, [name]: name === "quantidadeJogadores" ? Number(value) : value }));
  };

  const handleMatchInputChange = (event) => {
    const { name, value } = event.target;
    setMatchForm((prev) => ({ ...prev, [name]: value }));
  };

  const parseUsuarioIds = (text) => {
    if (!text) return [];
    return text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item)
      .map((item) => Number(item))
      .filter((num) => Number.isFinite(num) && num > 0);
  };

  const handleCreateTeam = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);
    try {
      await timesService.create({
        nome: teamForm.nome,
        quantidadeJogadores: Number(teamForm.quantidadeJogadores) || 0,
        usuarioIds: parseUsuarioIds(teamForm.usuarioIdsText),
      });
      setFeedback("Time cadastrado com sucesso!");
      setTeamForm(initialTeamForm);
      await loadTeams();
    } catch (err) {
      console.error("Erro ao cadastrar time", err);
      setError("Não foi possível cadastrar o time. Verifique os dados e tente novamente.");
    }
  };

  const handleScheduleMatch = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    if (!matchForm.timeMandanteId || !matchForm.timeVisitanteId) {
      setError("Selecione os dois times para agendar o jogo.");
      return;
    }

    if (matchForm.timeMandanteId === matchForm.timeVisitanteId) {
      setError("O time adversário deve ser diferente do time mandante.");
      return;
    }

    if (!matchForm.data || !matchForm.hora) {
      setError("Informe a data e o horário do jogo.");
      return;
    }

    const dateTime = new Date(`${matchForm.data}T${matchForm.hora}`);
    if (Number.isNaN(dateTime.getTime())) {
      setError("Data ou horário inválidos.");
      return;
    }

    try {
      await jogosService.create({
        timeMandanteId: Number(matchForm.timeMandanteId),
        timeVisitanteId: Number(matchForm.timeVisitanteId),
        dataHora: dateTime,
        local: matchForm.local,
        observacoes: matchForm.observacoes,
      });

      setFeedback("Jogo agendado com sucesso!");
      setMatchForm(initialMatchForm);
      await loadMatches();
    } catch (err) {
      console.error("Erro ao agendar jogo", err);
      setError("Não foi possível agendar o jogo. Verifique os dados e tente novamente.");
    }
  };

  const matchesWithTeams = useMemo(() => {
    return matches.map((match) => {
      const mandante = teamsById[match.timeMandanteId];
      const visitante = teamsById[match.timeVisitanteId];
      return {
        ...match,
        timeMandanteNome: match.timeMandanteNome ?? mandante?.nome ?? "Time mandante",
        timeVisitanteNome: match.timeVisitanteNome ?? visitante?.nome ?? "Time visitante",
      };
    });
  }, [matches, teamsById]);

  return (
    <div className="times-container">
      <header className="times-header">
        <button type="button" className="times-header-left" onClick={() => navigate("/")}>
          <Logo size={40} className="times-logo" />
          <div>
            <h1 className="times-title">Gestão de Times</h1>
            <p className="times-subtitle">Cadastre seu time e organize partidas</p>
          </div>
        </button>
        <div className="times-header-actions">
          <button type="button" className="times-refresh" onClick={() => { loadTeams(); loadMatches(); }}>
            <RefreshCcw size={16} />
            <span>Atualizar</span>
          </button>
          <UserMenu />
        </div>
      </header>

      {(error || feedback) && (
        <div className={`times-alert ${error ? "error" : "success"}`}>
          {error ?? feedback}
        </div>
      )}

      <main className="times-content">
        <section className="times-section">
          <div className="times-section-header">
            <div className="times-section-icon">
              <Users size={20} />
            </div>
            <div>
              <h2>Cadastro de Time</h2>
              <p>Informe os dados do seu time para começar a agendar jogos</p>
            </div>
          </div>

          <form className="times-form" onSubmit={handleCreateTeam}>
            <div className="times-form-row">
              <label className="times-label" htmlFor="nome">Nome do time</label>
              <input
                id="nome"
                name="nome"
                type="text"
                value={teamForm.nome}
                onChange={handleTeamInputChange}
                placeholder="Ex: Dragões FC"
                required
              />
            </div>

            <div className="times-form-row">
              <label className="times-label" htmlFor="quantidadeJogadores">Quantidade de jogadores</label>
              <input
                id="quantidadeJogadores"
                name="quantidadeJogadores"
                type="number"
                min={1}
                value={teamForm.quantidadeJogadores}
                onChange={handleTeamInputChange}
                required
              />
            </div>

            <div className="times-form-row">
              <label className="times-label" htmlFor="usuarioIdsText">IDs de jogadores (opcional)</label>
              <input
                id="usuarioIdsText"
                name="usuarioIdsText"
                type="text"
                value={teamForm.usuarioIdsText}
                onChange={handleTeamInputChange}
                placeholder="Ex: 1, 2, 3"
              />
              <span className="times-hint">Separe os IDs por vírgula</span>
            </div>

            <button className="times-submit" type="submit" disabled={loadingTeams}>
              <PlusCircle size={18} />
              <span>Cadastrar time</span>
            </button>
          </form>
        </section>

        <section className="times-section">
          <div className="times-section-header">
            <div className="times-section-icon">
              <Trophy size={20} />
            </div>
            <div>
              <h2>Times cadastrados</h2>
              <p>Veja todos os times disponíveis para os confrontos</p>
            </div>
          </div>

          <div className="times-list">
            {loadingTeams && <p className="times-empty">Carregando times...</p>}
            {!loadingTeams && teams.length === 0 && (
              <p className="times-empty">Nenhum time cadastrado ainda.</p>
            )}
            {!loadingTeams && teams.length > 0 && (
              <ul className="times-team-grid">
                {teams.map((team) => (
                  <li key={team.id} className="times-team-card">
                    <header>
                      <h3>{team.nome}</h3>
                      <span className="times-team-id">ID: {team.id}</span>
                    </header>
                    <div className="times-team-body">
                      <div className="times-team-info">
                        <Users size={16} />
                        <span>{team.quantidadeJogadores} jogadores</span>
                      </div>
                      {team.usuarioIds?.length > 0 && (
                        <div className="times-team-info">
                          <Flag size={16} />
                          <span>Jogadores: {team.usuarioIds.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="times-section">
          <div className="times-section-header">
            <div className="times-section-icon">
              <Flag size={20} />
            </div>
            <div>
              <h2>Agendar Jogo</h2>
              <p>Escolha dois times e defina data, horário e local da partida</p>
            </div>
          </div>

          <form className="times-form" onSubmit={handleScheduleMatch}>
            <div className="times-form-grid">
              <div className="times-form-row">
                <label className="times-label" htmlFor="timeMandanteId">Time mandante</label>
                <select
                  id="timeMandanteId"
                  name="timeMandanteId"
                  value={matchForm.timeMandanteId}
                  onChange={handleMatchInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="times-form-row">
                <label className="times-label" htmlFor="timeVisitanteId">Time visitante</label>
                <select
                  id="timeVisitanteId"
                  name="timeVisitanteId"
                  value={matchForm.timeVisitanteId}
                  onChange={handleMatchInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="times-form-row">
                <label className="times-label" htmlFor="data">Data</label>
                <input
                  id="data"
                  name="data"
                  type="date"
                  value={matchForm.data}
                  onChange={handleMatchInputChange}
                  required
                />
              </div>

              <div className="times-form-row">
                <label className="times-label" htmlFor="hora">Horário</label>
                <input
                  id="hora"
                  name="hora"
                  type="time"
                  value={matchForm.hora}
                  onChange={handleMatchInputChange}
                  required
                />
              </div>
            </div>

            <div className="times-form-row">
              <label className="times-label" htmlFor="local">Local da partida</label>
              <input
                id="local"
                name="local"
                type="text"
                value={matchForm.local}
                onChange={handleMatchInputChange}
                placeholder="Ex: Arena Central"
                required
              />
            </div>

            <div className="times-form-row">
              <label className="times-label" htmlFor="observacoes">Observações</label>
              <textarea
                id="observacoes"
                name="observacoes"
                value={matchForm.observacoes}
                onChange={handleMatchInputChange}
                placeholder="Informações adicionais sobre o jogo"
                rows={3}
              />
            </div>

            <button className="times-submit" type="submit" disabled={loadingMatches || teams.length < 2}>
              <CalendarDays size={18} />
              <span>Agendar jogo</span>
            </button>
          </form>
        </section>

        <section className="times-section">
          <div className="times-section-header">
            <div className="times-section-icon">
              <ClipboardList size={20} />
            </div>
            <div>
              <h2>Jogos agendados</h2>
              <p>Acompanhe todas as partidas já marcadas entre os times cadastrados</p>
            </div>
          </div>

          <div className="times-list">
            {loadingMatches && <p className="times-empty">Carregando jogos...</p>}
            {!loadingMatches && matchesWithTeams.length === 0 && (
              <p className="times-empty">Nenhum jogo agendado até o momento.</p>)
            }
            {!loadingMatches && matchesWithTeams.length > 0 && (
              <ul>
                {matchesWithTeams.map((match) => (
                  <li key={match.id} className="times-match-card">
                    <div className="times-match-header">
                      <div className="times-match-teams">
                        <span className="times-match-team">{match.timeMandanteNome}</span>
                        <span className="times-match-vs">vs</span>
                        <span className="times-match-team">{match.timeVisitanteNome}</span>
                      </div>
                      <span className={`times-status ${match.status?.toLowerCase()}`}>{match.status}</span>
                    </div>
                    <div className="times-match-body">
                      <div className="times-match-info">
                        <CalendarDays size={16} />
                        <span>{formatDateTime(match.dataHora)}</span>
                      </div>
                      <div className="times-match-info">
                        <MapPin size={16} />
                        <span>{match.local}</span>
                      </div>
                      {match.observacoes && (
                        <div className="times-match-info">
                          <Trophy size={16} />
                          <span>{match.observacoes}</span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
