import { useEffect, useState } from 'react';
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
import ConsentSheet from '@/components/ConsentSheet';
import { CONSENT_STORAGE_KEY } from '@/constants/consent';

export default function App() {
  const location = useLocation();
  const isChatRoute = location.pathname.startsWith('/chat');

  const [consentAccepted, setConsentAccepted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
    } catch {
      return true;
    }
  });
  const [consentOpen, setConsentOpen] = useState<boolean>(() => !consentAccepted);

  useEffect(() => {
    setConsentOpen(!consentAccepted);
  }, [consentAccepted]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('chat-route-active', isChatRoute);
    return () => {
      document.body.classList.remove('chat-route-active');
    };
  }, [isChatRoute]);

  const handleConsentAccept = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
      } catch {
        // Ignore storage failures and rely on state for this session.
      }
    }
    setConsentAccepted(true);
  };

  const handleConsentDismiss = () => {
    setConsentOpen(false);
  };

  const appRoutes = (
    <Routes>
      <Route path="/" element={<Home />} />

      {/* Chat is anonymous by default; saving happens when the user signs in later */}
      <Route path="/chat" element={<Chat />} />

      {/* Link old /help route to the Help & Crisis section on the one-pager */}
      <Route path="/help" element={<Navigate to="/#help-crisis" replace />} />

      <Route path="/services" element={<Services />} />

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
      <ConsentSheet
        open={consentOpen}
        onAccept={handleConsentAccept}
        onDismiss={handleConsentDismiss}
      />
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
