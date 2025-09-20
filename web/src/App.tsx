import { Route, Routes } from 'react-router-dom';
// import RequireAuth from '@/auth/RequireAuth'; // no longer used for /chat
import RequireAdmin from '@/auth/RequireAdmin';

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

          {/* /chat is now PUBLIC for anonymous chatting */}
          <Route path="/chat" element={<Chat />} />

          <Route path="/services" element={<Services />} />
          <Route path="/help" element={<HelpCrisis />} />

          {/* User auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Admin auth — support both /admin/login and legacy /admin/signin */}
          <Route path="/admin/login" element={<AdminSignIn />} />
          <Route path="/admin/signin" element={<AdminSignIn />} />

          {/* Admin console protected by RequireAdmin */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminIndex />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}