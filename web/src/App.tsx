import { Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Services from '@/pages/Services';
import HelpCrisis from '@/pages/HelpCrisis';
import AdminLogin from '@/pages/AdminLogin';
import NotFound from '@/pages/NotFound';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';

export default function App() {
  return (
    <div className="app">
      <Header />
      <Container as="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/services" element={<Services />} />
          <Route path="/help" element={<HelpCrisis />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}