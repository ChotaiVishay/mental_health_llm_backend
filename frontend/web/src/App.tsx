import { Route, Routes, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Login from '@/pages/Login';
import AdminSignIn from '@/pages/admin/AdminSignIn';
import AdminIndex from '@/pages/admin/AdminIndex';
import Profile from '@/pages/Profile';
import AuthCallback from '@/pages/AuthCallback';
import ResetPassword from '@/pages/ResetPassword';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import RequireAuth from '@/auth/RequireAuth';
import RequireAdmin from '@/auth/RequireAdmin';
import Styleguide from '@/pages/Styleguide';
import '@/styles/index.css';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <div className="app">
      <Header />
      <Container as="main">
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Chat is anonymous by default; saving happens when the user signs in later */}
          <Route path="/chat" element={<Chat />} />

          {/* Link old /help route to the Help & Crisis section on the one-pager */}
          <Route path="/help" element={<Navigate to="/#help-crisis" replace />} />

          {/* Regular user auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/profile"
            element={(
              <RequireAuth>
                <Profile />
              </RequireAuth>
            )}
          />
          {/* Admin */}
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route
            path="/admin"
            element={(
              <RequireAdmin>
                <AdminIndex />
              </RequireAdmin>
            )}
          />
          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}
