import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Ecommerce from './components/Ecommerce';
import Profile from './components/Profile';
import AdminPage from './components/AdminPage'; // Asegúrate de importar AdminPage

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Ecommerce />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminPage />} /> {/* Ruta para la página de administración */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
