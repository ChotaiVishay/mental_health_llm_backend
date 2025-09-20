import { Route, Routes } from 'react-router-dom';
import RequireAuth from '@/auth/RequireAuth';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Services from '@/pages/Services';
import HelpCrisis from '@/pages/HelpCrisis';
import AdminSignIn from '@/pages/admin/AdminSignIn';
import AdminIndex from '@/pages/admin/AdminIndex';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
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

          {/* User auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Admin auth (keep /admin/signin to match earlier tests/logs) */}
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/admin" element={<AdminIndex />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}