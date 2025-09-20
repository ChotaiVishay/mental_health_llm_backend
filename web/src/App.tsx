import { NavLink, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Services from '@/pages/Services';
import HelpCrisis from '@/pages/HelpCrisis';
import AdminLogin from '@/pages/AdminLogin';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <div className="app">
      <header className="container">
        <nav className="nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/help">Help &amp; Crisis</NavLink>
          <NavLink to="/admin/login">Admin</NavLink>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/services" element={<Services />} />
          <Route path="/help" element={<HelpCrisis />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="container">© Support Atlas</footer>
    </div>
  );
}