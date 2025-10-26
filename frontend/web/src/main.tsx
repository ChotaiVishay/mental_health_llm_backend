import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthContext';
import { AdminAuthProvider } from '@/admin/AdminAuthContext';
import { DyslexicModeProvider } from '@/accessibility/DyslexicModeContext';
import { EasyModeProvider } from '@/accessibility/EasyModeContext';
import { HighContrastModeProvider } from '@/accessibility/HighContrastModeContext';
import { ScreenReaderModeProvider } from '@/accessibility/ScreenReaderModeContext';
import { LargeTextModeProvider } from '@/accessibility/LargeTextModeContext';
import { ReducedMotionModeProvider } from '@/accessibility/ReducedMotionModeContext';
import App from './App';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import '@/styles/index.css';
import '@/styles/tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ReducedMotionModeProvider>
        <ScreenReaderModeProvider>
          <HighContrastModeProvider>
            <LargeTextModeProvider>
              <EasyModeProvider>
                <DyslexicModeProvider>
                  <AuthProvider>
                    <AdminAuthProvider>
                    <LanguageProvider>
                      <App />
                    </LanguageProvider>
                     </AdminAuthProvider>
                  </AuthProvider>
                </DyslexicModeProvider>
              </EasyModeProvider>
            </LargeTextModeProvider>
          </HighContrastModeProvider>
        </ScreenReaderModeProvider>
      </ReducedMotionModeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
