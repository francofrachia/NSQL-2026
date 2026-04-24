import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import HeroGrid from "./pages/HeroGrid";
import HeroDetail from "./pages/HeroDetail";
import HeroForm from "./pages/HeroForm";

function App() {
  return (
    <>
      <Navigation />
      <Routes>
        {/* Ruta principal: Muestra todos */}
        <Route path="/" element={<HeroGrid />} />

        {/* Ruta Marvel: Filtra por Marvel */}
        <Route path="/marvel" element={<HeroGrid casa="Marvel" />} />

        {/* Ruta DC: Filtra por DC */}
        <Route path="/dc" element={<HeroGrid casa="DC" />} />

        {/* Ruta Detalle */}
        <Route path="/heroe/:id" element={<HeroDetail />} />

        <Route path="/nuevo" element={<HeroForm />} />

        <Route path="/editar/:id" element={<HeroForm />} />

      </Routes>
    </>
  );
}

export default App;