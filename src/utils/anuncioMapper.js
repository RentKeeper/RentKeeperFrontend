// Função para mapear dados do backend para o formato do frontend
export const mapAnuncioFromBackend = (anuncioBackend) => {
  // Gerar dados mockados para campos que não existem no backend
  const mockData = {
    rating: 4.5 + Math.random() * 0.5, // Rating entre 4.5 e 5.0
    reviews: Math.floor(Math.random() * 200) + 50, // Reviews entre 50 e 250
    distancia: `${(Math.random() * 5 + 1).toFixed(1)} km`, // Distância entre 1.0 e 6.0 km
    responseTime: "< 1h",
    reservasCompletadas: Math.floor(Math.random() * 300) + 100, // Jogos entre 100 e 400
    horarios: ["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-18:00"],
    comodidades: ["Penaltis", "Saídas de gol", "Jogo aéreo", "Liderança"],
    verified: true,
    image: "https://images.pexels.com/photos/1618200/pexels-photo-1618200.jpeg?auto=compress&cs=tinysrgb&w=400"
  };

  // Mapear posição para tipo
  const getTipoFromPosicao = (posicao) => {
    switch (posicao) {
      case 0: return "Goleiro";
      case 1: return "Defensor";
      case 2: return "Meia";
      case 3: return "Atacante";
      case 4: return "Juiz";
      default: return "Jogador";
    }
  };

  // Gerar experiência baseada na posição
  const getExperiencia = (posicao) => {
    const experiencias = ["1-3 anos", "4-7 anos", "8-12 anos", "12+ anos"];
    return experiencias[Math.floor(Math.random() * experiencias.length)];
  };

  // Gerar nível baseado na experiência
  const getNivel = (experiencia) => {
    if (experiencia.includes("1-3")) return "Iniciante";
    if (experiencia.includes("4-7")) return "Intermediário";
    return "Experiente";
  };

  const experiencia = getExperiencia(anuncioBackend.Usuario?.Posicao || 0);
  const nivel = getNivel(experiencia);

  return {
    id: anuncioBackend.IdAnuncio,
    titulo: anuncioBackend.Usuario?.Nome || "Jogador",
    proprietario: anuncioBackend.Usuario?.Nome || "Jogador",
    rating: mockData.rating,
    reviews: mockData.reviews,
    localizacao: anuncioBackend.LocalPartida || "São Paulo, SP",
    distancia: mockData.distancia,
    preco: Math.floor(Math.random() * 100) + 50, // Preço entre 50 e 150
    disponibilidade: anuncioBackend.Disponivel ? "Disponível hoje" : "Indisponível",
    tipo: getTipoFromPosicao(anuncioBackend.Usuario?.Posicao || 0),
    superficie: nivel,
    capacidade: experiencia,
    image: mockData.image,
    verified: mockData.verified,
    responseTime: mockData.responseTime,
    reservasCompletadas: mockData.reservasCompletadas,
    horarios: mockData.horarios,
    comodidades: mockData.comodidades,
    // Dados originais do backend
    anuncioJogador: anuncioBackend.AnuncioJogador,
    anuncioPartida: anuncioBackend.AnuncioPartida,
    localPartida: anuncioBackend.LocalPartida,
    dataPartida: anuncioBackend.DataPartida,
    horaPartida: anuncioBackend.HoraPartida,
    usuarioId: anuncioBackend.UsuarioId,
    usuario: anuncioBackend.Usuario
  };
};

// Função para mapear dados do frontend para o formato do backend
export const mapAnuncioToBackend = (anuncioFrontend) => {
  return {
    AnuncioJogador: anuncioFrontend.anuncioJogador || "",
    AnuncioPartida: anuncioFrontend.anuncioPartida || "",
    LocalPartida: anuncioFrontend.localPartida || "",
    DataPartida: anuncioFrontend.dataPartida || new Date(),
    HoraPartida: anuncioFrontend.horaPartida || new Date(),
    UsuarioId: anuncioFrontend.usuarioId || 1
  };
}; 