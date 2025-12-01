import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Anuncios from "./pages/Anuncios";
import CriarAnuncio from "./pages/CriarAnuncio";
import ComoFunciona from "./pages/ComoFunciona";
import Aluguel from "./pages/Aluguel";
import Pagamento from "./pages/Pagamento";
import ReservasJogador from "./pages/ReservasJogador";
import ReservasContratante from "./pages/ReservasContratante";
import PerfilUsuario from "./pages/PerfilUsuario";
import Avaliacoes from "./pages/Avaliacoes";
import AvaliarAluguel from "./pages/AvaliarAluguel";
import Times from "./pages/Times";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/anuncios" element={<Anuncios />} />
        <Route path="/criar-anuncio" element={<CriarAnuncio />} />
        <Route path="/como-funciona" element={<ComoFunciona />} />
        <Route path="/aluguel" element={<Aluguel />} />
        <Route path="/pagamento" element={<Pagamento />} />
        <Route path="/reservas-jogador" element={<ReservasJogador />} />
        <Route path="/minhas-contratacoes" element={<ReservasContratante />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="/avaliacoes" element={<Avaliacoes />} />
        <Route path="/avaliacoes/:aluguelId" element={<AvaliarAluguel />} />
        <Route path="/times" element={<Times />} />
      </Routes>
    </Router>
  );
}

export default App;
