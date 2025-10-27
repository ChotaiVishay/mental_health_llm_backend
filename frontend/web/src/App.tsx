import { useEffect } from 'react';
import {
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Services from '@/pages/Services';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import AuthCallback from '@/pages/AuthCallback';
import ResetPassword from '@/pages/ResetPassword';
import Accessibility from '@/pages/Accessibility';
import Contact from '@/pages/Contact';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import TopHeader from '@/components/TopHeader';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import BottomTabBar from '@/components/BottomTabBar';
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
import QuickExitBar from '@/components/QuickExitBar';

export default function App() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('chat-route-active', isChatRoute);
    document.body.classList.toggle('body--chat', isChatRoute);
    return () => {
      document.body.classList.remove('chat-route-active');
      document.body.classList.remove('body--chat');
    };
  }, [isChatRoute]);

  const appRoutes = (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Chat is anonymous by default; saving happens when the user signs in later */}
      <Route path="/chat" element={<Chat />} />

      {/* Link old /help route to the Help & Crisis section on the one-pager */}
      <Route path="/help" element={<Navigate to="/#help-crisis" replace />} />

      <Route path="/services" element={<Services />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

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
  );

  return (
    <div className={isChatRoute ? 'app app--chat' : 'app'}>
      <QuickExitBar />
      {!isChatRoute && <TopHeader />}
      {!isChatRoute && <Header />}
      {isChatRoute ? (
        <main id="main" tabIndex={-1} className="chat-route-main">
          {appRoutes}
        </main>
      ) : (
        <Container as="main" id="main" tabIndex={-1}>
          {appRoutes}
        </Container>
      )}
      {!isChatRoute && <Footer />}
      {!isChatRoute && <BottomTabBar />}
    </div>
  );
}
