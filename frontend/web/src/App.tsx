import { Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home';
import Chat from '@/pages/Chat';
import Services from '@/pages/Services';
import HelpCrisis from '@/pages/HelpCrisis';
import AdminSignIn from '@/pages/admin/AdminSignIn';
import AdminIndex from '@/pages/admin/AdminIndex';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Container from '@/components/layout/Container';
import RequireAdmin from '@/auth/RequireAdmin'; // NEW
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

          <Route path="/services" element={<Services />} />
          <Route path="/help" element={<HelpCrisis />} />

          {/* Regular user auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Admin */}
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminIndex />
              </RequireAdmin>
            }
          />

          

          <Route path="/styleguide" element={<Styleguide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </div>
  );
}