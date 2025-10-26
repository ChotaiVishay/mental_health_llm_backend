import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HelpCircle,
  Home,
  LifeBuoy,
  MessageSquare,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageProvider';
import { useScreenReaderMode } from '@/accessibility/ScreenReaderModeContext';

type TabItem = {
  id: 'home' | 'chat' | 'help' | 'faq';
  icon: typeof Home;
  to: string;
};

function isHomeActive(pathname: string, hash: string) {
  if (pathname !== '/') return false;
  if (!hash) return true;
  return hash !== '#help-crisis' && hash !== '#faq';
}

function isHelpActive(pathname: string, hash: string) {
  if (pathname === '/help') return true;
  return pathname === '/' && hash === '#help-crisis';
}

function isFaqActive(pathname: string, hash: string) {
  if (pathname === '/faq') return true;
  return pathname === '/' && hash === '#faq';
}

export default function BottomTabBar() {
  const location = useLocation();
  const { t } = useLanguage();
  const { screenReaderAssist } = useScreenReaderMode();

  const items = useMemo<TabItem[]>(() => ([
    { id: 'home', icon: Home, to: '/' },
    { id: 'chat', icon: MessageSquare, to: '/chat' },
    { id: 'help', icon: LifeBuoy, to: '/#help-crisis' },
    { id: 'faq', icon: HelpCircle, to: '/#faq' },
  ]), []);

  const { pathname, hash } = location;
  const normalizedHash = (hash ?? '').toLowerCase();

  const isActive = (id: TabItem['id']) => {
    switch (id) {
      case 'home':
        return isHomeActive(pathname, normalizedHash);
      case 'chat':
        return pathname.startsWith('/chat');
      case 'help':
        return isHelpActive(pathname, normalizedHash);
      case 'faq':
        return isFaqActive(pathname, normalizedHash);
      default:
        return false;
    }
  };

  const labels = useMemo<Record<TabItem['id'], string>>(() => ({
    home: t('header.nav.home'),
    chat: t('header.nav.chat'),
    help: t('header.nav.helpCrisis'),
    faq: t('header.nav.faq'),
  }), [t]);

  return (
    <nav
      role="navigation"
      className="bottom-tab-bar"
      aria-label={screenReaderAssist ? t('header.nav.ariaPrimaryLong') : t('header.nav.ariaPrimaryShort')}
    >
      <div className="bottom-tab-bar-shell">
        <div className="bottom-tab-bar-inner">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <Link
                key={item.id}
                to={item.to}
                className={active ? 'bottom-tab-item active' : 'bottom-tab-item'}
                aria-current={active ? 'page' : undefined}
              >
                <span className={active ? 'bottom-tab-pill active' : 'bottom-tab-pill'}>
                  <Icon className="bottom-tab-icon" aria-hidden />
                  <span className="bottom-tab-label">{labels[item.id]}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
