// Chat page
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '@/components/misc/Title';
import MessageList, { Message } from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import { useAuth } from '@/auth/AuthContext';
import { useEasyMode } from '@/accessibility/EasyModeContext';
import {
  loadPreloginChat,
  savePreloginChat,
  loadUserChat,
  saveUserChat,
  type ChatSession,
  type ChatMessage as ChatMsgStore,
} from '@/features/chat/sessionStore';
import ChatList from '@/components/chat/ChatList';
import { sendMessageToAPI } from '@/api/chat';
import { submitServiceDraft } from '@/api/serviceDraft';
import AgreementsModal from '@/components/chat/AgreementsModal';
import ServiceFormModal, { type ServiceFormAction } from '@/components/chat/ServiceFormModal';
import {
  acceptAgreements,
  fetchAgreementStatus,
  type AgreementStatus,
  AGREEMENT_TERMS_VERSION,
  AGREEMENT_PRIVACY_VERSION,
} from '@/api/agreements';
import '@/styles/pages/chat.css';
import { useLanguage } from '@/i18n/LanguageProvider';
import { CONSENT_STORAGE_KEY } from '@/constants/consent';
import { ArrowLeft } from 'lucide-react';

type ChatMessageStore = { id: string; role: 'user' | 'assistant'; text: string; at: number };
type CrisisResource = { label: string; href: string };
type CrisisAlert = { message: string; resources: CrisisResource[] };

function mkId() { return Math.random().toString(36).slice(2); }
function toUI(items?: ChatMessageStore[]): Message[] {
  if (!items?.length) return [];
  return items.map(({ id, role, text, at }) => ({ id, role, text, at }));
}
function toStore(items: Message[], prev?: ChatMessageStore[]): ChatMessageStore[] {
  const now = Date.now();
  const prevMap = new Map(prev?.map((m) => [m.id, m.at]));
  return items.map((m) => ({ id: m.id, role: m.role, text: m.text, at: m.at ?? prevMap.get(m.id) ?? now }));
}
function formatRelativeTime(ms: number, locale: string) {
  const diffSeconds = Math.round((Date.now() - ms) / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    const value = diffSeconds === 0 ? -1 : -diffSeconds;
    return rtf.format(value, 'second');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(-diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(-diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(-diffDays, 'day');
}

function useAtBottom(ref: React.RefObject<HTMLDivElement>, threshold = 64) {
  const [atBottom, setAtBottom] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
      setAtBottom(dist <= threshold);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [ref, threshold]);
  const scrollToBottom = () => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  return { atBottom, scrollToBottom };
}

export default function Chat() {
  const { user } = useAuth();
  const { easyMode } = useEasyMode();
  const navigate = useNavigate();
  const { language, locale, t } = useLanguage();

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/');
  }, [navigate]);

  const getIsNarrow = () => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 900px)').matches : false);
  const getIsMobileLayout = () => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false);

  const [isNarrow, setIsNarrow] = useState<boolean>(getIsNarrow);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(getIsMobileLayout);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => (getIsNarrow() ? false : !easyMode));
  const userId = user?.id ? String(user.id) : undefined;
  const isAuthenticated = Boolean(user);

  // Refs
  const scrollerRef = useRef<HTMLDivElement>(null!) as React.RefObject<HTMLDivElement>; // transcript scroller

  const { atBottom, scrollToBottom } = useAtBottom(scrollerRef, 200);

  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [netErr, setNetErr] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [serviceAction, setServiceAction] = useState<ServiceFormAction | null>(null);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [serviceFormSubmitting, setServiceFormSubmitting] = useState(false);
  const [serviceFormError, setServiceFormError] = useState<string | null>(null);
  const [agreementStatus, setAgreementStatus] = useState<AgreementStatus | null>(null);
  const [agreementsLoading, setAgreementsLoading] = useState(true);
  const [agreementsError, setAgreementsError] = useState<string | null>(null);
  const [showAgreementsModal, setShowAgreementsModal] = useState(true);
  const [savingAgreement, setSavingAgreement] = useState(false);
  const [crisisAlert, setCrisisAlert] = useState<CrisisAlert | null>(null);
  const [showAnonNotice, setShowAnonNotice] = useState(true);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      setAgreementsLoading(true);
      setAgreementsError(null);

      const storedConsent = (() => {
        try {
          return typeof window !== 'undefined'
            && window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
        } catch {
          return false;
        }
      })();

      if (!userId && storedConsent) {
        if (!active) return;
        const acceptedStatus: AgreementStatus = {
          termsVersion: AGREEMENT_TERMS_VERSION,
          privacyVersion: AGREEMENT_PRIVACY_VERSION,
          termsAccepted: true,
          privacyAccepted: true,
          requiresAcceptance: false,
        };
        setAgreementStatus(acceptedStatus);
        setShowAgreementsModal(false);
        setAgreementsLoading(false);
        return;
      }

      try {
        const status = await fetchAgreementStatus(userId);
        if (!active) return;
        setAgreementStatus(status);
        setShowAgreementsModal(status.requiresAcceptance || !isAuthenticated);
      } catch {
        if (!active) return;
        setAgreementsError('We could not load the latest terms. Please try again.');
        setShowAgreementsModal(true);
      } finally {
        if (active) setAgreementsLoading(false);
      }
    };

    loadStatus();
    return () => {
      active = false;
    };
  }, [userId, isAuthenticated]);

  const handleAcceptAgreements = async () => {
    if (!userId) {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(CONSENT_STORAGE_KEY, 'true');
        }
      } catch {
        // Ignore storage failures; rely on state fallback.
      }
      setAgreementStatus((prev) => prev
        ? { ...prev, termsAccepted: true, privacyAccepted: true, requiresAcceptance: false }
        : {
            termsVersion: AGREEMENT_TERMS_VERSION,
            privacyVersion: AGREEMENT_PRIVACY_VERSION,
            termsAccepted: true,
            privacyAccepted: true,
            requiresAcceptance: false,
          });
      setAgreementsError(null);
      setShowAgreementsModal(false);
      return;
    }

    setSavingAgreement(true);
    setAgreementsError(null);
    try {
      const updated = await acceptAgreements(userId);
      setAgreementStatus(updated);
      setShowAgreementsModal(updated.requiresAcceptance);
    } catch {
      setAgreementsError('We could not save your acceptance. Please try again.');
    } finally {
      setSavingAgreement(false);
    }
  };

  const handleDeclineAgreements = () => {
    navigate('/');
  };

  // initial load
  useEffect(() => {
    const session: ChatSession | null = userId
      ? loadUserChat(userId) ?? loadPreloginChat()
      : loadPreloginChat();

    setSessionId(null);
    setServiceAction(null);
    setServiceFormOpen(false);

    if (session?.messages?.length) {
      setMessages(toUI(session.messages as unknown as ChatMessageStore[]));
      const maxAt = Math.max(...session.messages.map((m: ChatMsgStore) => Number(m.at) || 0));
      setLastActivity(Number.isFinite(maxAt) ? maxAt : Date.now());
    } else {
      const now = Date.now();
      setMessages([{ id: mkId(), role: 'assistant', text: t('chat.initialMessage'), at: now }]);
      setLastActivity(Date.now());
    }
  }, [t, userId]);

  useEffect(() => {
    if (isNarrow) {
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(easyMode ? false : true);
  }, [easyMode, isNarrow]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 900px)');
    setIsNarrow(mq.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsNarrow(event.matches);
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handleChange);
      return () => mq.removeEventListener('change', handleChange);
    }

    const legacyHandler = (event: MediaQueryListEvent) => {
      setIsNarrow(event.matches);
    };
    mq.addListener(legacyHandler);
    return () => mq.removeListener(legacyHandler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobileLayout(mq.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches);
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handleChange);
      return () => mq.removeEventListener('change', handleChange);
    }

    const legacyHandler = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches);
    };
    mq.addListener(legacyHandler);
    return () => mq.removeListener(legacyHandler);
  }, []);

  useEffect(() => {
    if (user) {
      setShowAnonNotice(false);
    }
  }, [user]);

  // persist
  useEffect(() => {
    const prev = userId ? loadUserChat(userId) ?? undefined : loadPreloginChat() ?? undefined;
    const payload = { messages: toStore(messages, (prev?.messages as unknown as ChatMessageStore[] | undefined)) };
    const maxAt = payload.messages.length ? Math.max(...payload.messages.map((m) => m.at)) : Date.now();
    setLastActivity(maxAt);
    if (userId) saveUserChat(userId, payload as { messages: ChatMessageStore[] });
    else savePreloginChat(payload as { messages: ChatMessageStore[] });
  }, [messages, userId]);

  // auto-scroll only when already near the bottom
  useEffect(() => { if (atBottom) scrollToBottom(); }, [messages.length, atBottom, scrollToBottom]);

  const handleCrisisDismiss = () => {
    setCrisisAlert(null);
  };

  const filterCrisisResources = (raw: unknown): CrisisResource[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => item as Record<string, unknown>)
      .filter((item) => typeof item.label === 'string' && typeof item.href === 'string')
      .map((item) => ({ label: item.label as string, href: item.href as string }));
  };

  const onSend = async (text: string) => {
    if (crisisAlert) {
      return;
    }
    if (agreementsLoading || showAgreementsModal) return;
    setNetErr(null);
    const sentAt = Date.now();
    const userMsg: Message = { id: mkId(), role: 'user', text, at: sentAt };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);
    try {
      const reply = await sendMessageToAPI(text, sessionId, language);
      if (reply.session_id) setSessionId(reply.session_id);
      const assistantText =
        (typeof reply.response === 'string' && reply.response.trim().length
          ? reply.response
          : typeof reply.message === 'string'
            ? reply.message
            : t('chat.errors.generic'));
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', text: assistantText, at: Date.now() }]);

      if (reply.action === 'crisis_halt') {
        setServiceAction(null);
        setServiceFormOpen(false);
        setCrisisAlert({
          message: assistantText,
          resources: filterCrisisResources(reply.resources),
        });
        return;
      }

      setCrisisAlert(null);

      const action = reply.action as ServiceFormAction | undefined;
      if (action && action.type === 'collect_service_details') {
        setServiceAction(action);
        setServiceFormError(null);
        setServiceFormOpen(true);
      } else {
        setServiceAction(null);
      }
    } catch {
      setNetErr(t('chat.errors.network'));
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', text: t('chat.errors.generic'), at: Date.now() }]);
    } finally {
      setBusy(false);
    }
  };

  const handleServiceFormClose = () => {
    setServiceFormOpen(false);
    setServiceFormError(null);
  };

  const handleServiceFormSubmit = async (formValues: Record<string, unknown>) => {
    if (!serviceAction) return;
    setServiceFormSubmitting(true);
    setServiceFormError(null);

    try {
      const response = await submitServiceDraft(formValues, sessionId);
      const responseData = (response.data ?? {}) as Record<string, unknown>;
      const serviceNameValue = responseData.service_name;
      const serviceName =
        typeof serviceNameValue === 'string' && serviceNameValue.trim().length
          ? serviceNameValue
          : null;

      const userSummary = serviceName
        ? `Submitted details for ${serviceName}.`
        : 'Submitted new service details.';

      setMessages((prev) => [
        ...prev,
        { id: mkId(), role: 'user', text: userSummary, at: Date.now() },
        { id: mkId(), role: 'assistant', text: response.message, at: Date.now() },
      ]);

      setServiceFormOpen(false);
      setServiceAction(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t('chat.errors.generic');
      setServiceFormError(message);
    } finally {
      setServiceFormSubmitting(false);
    }
  };

  const lastActivityLabel = useMemo(() => formatRelativeTime(lastActivity, locale), [lastActivity, locale]);

  return (
    <>
      <Title value={t('chat.metaTitle')} />

      {/* Page grid: [sidebar | main] above, [sidebar | composer] below */}
      <div className={`chat-page ${sidebarOpen ? '' : '-collapsed'}`}>
        {/* Sidebar */}
        {sidebarOpen ? (
          <aside className="chat-sidebar">
            <header className="sidebar-head">
              <h2 className="h3" style={{ margin: 0 }}>{t('chat.sidebar.title')}</h2>
              <button className="icon-btn" aria-label={t('chat.sidebar.hide')} onClick={() => setSidebarOpen(false)}>×</button>
            </header>
            <div className="sidebar-body">
              <ChatList />
            </div>
          </aside>
        ) : (
          !isNarrow && (
            <button className="hambtn" aria-label={t('chat.sidebar.open')} onClick={() => setSidebarOpen(true)}>☰</button>
          )
        )}

        {/* Main chat panel (no composer here) */}
        <section className="chat-main">
          <header className="chat-head">
            <div className="chat-head-left">
              <button
                type="button"
                className="chat-back"
                onClick={handleBack}
              >
                <ArrowLeft aria-hidden />
                <span>{t('chat.back')}</span>
              </button>
              <h2 className="h2" style={{ margin: 0 }}>{t('chat.heading')}</h2>
            </div>
            <span className="muted small">{t('chat.lastActivity')} {lastActivityLabel}</span>
          </header>

          {netErr && (
            <div role="alert" className="chat-alert" aria-live="polite">
              <span>{netErr}</span>
              <button
                type="button"
                className="alert-dismiss"
                aria-label={t('chat.alert.dismiss')}
                onClick={() => setNetErr(null)}
              >
                ×
              </button>
            </div>
          )}

          {crisisAlert && (
            <div className="chat-alert crisis" role="alert" aria-live="assertive">
              <p>{crisisAlert.message}</p>
              {crisisAlert.resources.length > 0 && (
                <ul className="crisis-resources">
                  {crisisAlert.resources.map((item) => (
                    <li key={`${item.label}-${item.href}`}>
                      <a href={item.href}>{item.label}</a>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="btn" onClick={handleCrisisDismiss}>
                I understand
              </button>
            </div>
          )}

          {/* Only this div scrolls */}
          <div ref={scrollerRef} className="chat-scroller">
            <div className="chat-body">
              <MessageList items={messages} />
              {busy && (
                <div className="typing-row" aria-live="polite" aria-label={t('chat.typing')}>
                  <div className="typing-bubble">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {!atBottom && (
              <button className="jump-latest" onClick={scrollToBottom}>{t('chat.jumpToLatest')}</button>
            )}
          </div>
        </section>

        {/* Composer dock — separate row pinned at grid bottom */}
        <div className="composer-dock">
          {!user && showAnonNotice && (
            <div className="anon-pill" role="note" aria-live="polite" aria-label={t('chat.banner.aria')} data-easy-mode="hide">
              <span>{t('chat.anonBanner')}</span>
              <a className="anon-pill-link" href="/login">{t('chat.banner.button')}</a>
              <button
                type="button"
                className="anon-pill-close"
                aria-label={t('chat.alert.dismiss')}
                onClick={() => setShowAnonNotice(false)}
              >
                ×
              </button>
            </div>
          )}
          <MessageInput
            onSend={onSend}
            disabled={busy || agreementsLoading || showAgreementsModal || Boolean(crisisAlert)}
            maxVisibleLines={isMobileLayout ? 3 : undefined}
            isSending={busy}
          />
        </div>
      </div>

      <AgreementsModal
        open={showAgreementsModal}
        loading={agreementsLoading || savingAgreement}
        error={agreementsError}
        repeatRequired={!user}
        versions={{ termsVersion: agreementStatus?.termsVersion, privacyVersion: agreementStatus?.privacyVersion }}
        onAccept={handleAcceptAgreements}
        onCancel={handleDeclineAgreements}
      />
      <ServiceFormModal
        open={serviceFormOpen}
        action={serviceAction}
        submitting={serviceFormSubmitting}
        error={serviceFormError}
        onClose={handleServiceFormClose}
        onSubmit={handleServiceFormSubmit}
      />
    </>
  );
}
