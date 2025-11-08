import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Anuncios from "./pages/Anuncios";
import CriarAnuncio from "./pages/CriarAnuncio";
import ComoFunciona from "./pages/ComoFunciona";
import Aluguel from "./pages/Aluguel";
import Pagamento from "./pages/Pagamento";

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
      </Routes>
    </Router>
  );
}

export default App;
