import { Route, Routes } from 'react-router-dom';
import RequireAuth from '@/auth/RequireAuth';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Services from '@/pages/Services';
import HelpCrisis from '@/pages/HelpCrisis';
import AdminLogin from '@/pages/admin/AdminSignIn';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import AdminIndex from '@/pages/admin/AdminIndex';
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
          <Route
            path="/chat"
            element={
              <RequireAuth>
                <Chat />
              </RequireAuth>
            }
          />
          <Route path="/services" element={<Services />} />
          <Route path="/help" element={<HelpCrisis />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminIndex />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}