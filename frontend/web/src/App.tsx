import { Route, Routes, Navigate } from 'react-router-dom';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import AuthCallback from '@/pages/AuthCallback';
import ResetPassword from '@/pages/ResetPassword';
import Accessibility from '@/pages/Accessibility';
import Contact from '@/pages/Contact';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import AdminSignIn from '@/pages/admin/AdminSignIn';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminProvidersPage from '@/pages/admin/AdminProvidersPage';
import AdminServicesPage from '@/pages/admin/AdminServicesPage';
import AdminAdminsPage from '@/pages/admin/AdminAdminsPage';
import AdminProfilePage from '@/pages/admin/AdminProfilePage';
import RequireAdmin from '@/auth/RequireAdmin';
import RequireAuth from '@/auth/RequireAuth';
import Styleguide from '@/pages/Styleguide';
import '@/styles/index.css';
import NotFound from '@/pages/NotFound';

export default function App() {
  return (
    <div className="app">
      <Header />
      <Container as="main" id="main" tabIndex={-1}>
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

          
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route
            path="/admin"
            element={(
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            )}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="providers" element={<AdminProvidersPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="admins" element={<AdminAdminsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
          

          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}
