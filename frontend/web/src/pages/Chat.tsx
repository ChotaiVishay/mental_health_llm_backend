// Chat page
import { useEffect, useMemo, useRef, useState } from 'react';
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

type ChatMessageStore = { id: string; role: 'user' | 'assistant'; text: string; at: number };

function mkId() { return Math.random().toString(36).slice(2); }
function toUI(items?: ChatMessageStore[]): Message[] {
  if (!items?.length) return [];
  return items.map(({ id, role, text }) => ({ id, role, text }));
}
function toStore(items: Message[], prev?: ChatMessageStore[]): ChatMessageStore[] {
  const now = Date.now();
  const prevMap = new Map(prev?.map((m) => [m.id, m.at]));
  return items.map((m) => ({ id: m.id, role: m.role, text: m.text, at: prevMap.get(m.id) ?? now }));
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
  const [sidebarOpen, setSidebarOpen] = useState(() => !easyMode);
  const userId = user?.id ? String(user.id) : undefined;
  const isAuthenticated = Boolean(user);

  // Refs
  const pageRef = useRef<HTMLDivElement>(null);     // whole [sidebar|main] + composer grid
  const scrollerRef = useRef<HTMLDivElement>(null!) as React.RefObject<HTMLDivElement>; // transcript scroller

  const { atBottom, scrollToBottom } = useAtBottom(scrollerRef);

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

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      setAgreementsLoading(true);
      setAgreementsError(null);
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
      setMessages([{ id: mkId(), role: 'assistant', text: t('chat.initialMessage') }]);
      setLastActivity(Date.now());
    }
  }, [t, userId]);

  useEffect(() => {
    setSidebarOpen(easyMode ? false : true);
  }, [easyMode]);

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

  const onSend = async (text: string) => {
    if (agreementsLoading || showAgreementsModal) return;
    setNetErr(null);
    const userMsg: Message = { id: mkId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);
    try {
      const reply = await sendMessageToAPI(text, sessionId, language);
      if (reply.session_id) setSessionId(reply.session_id);
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', text: reply.response }]);
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
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', text: t('chat.errors.generic') }]);
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
        { id: mkId(), role: 'user', text: userSummary },
        { id: mkId(), role: 'assistant', text: response.message },
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

  // === Fit the page grid to the viewport from its actual top (so composer is visible at 100% zoom)
  useEffect(() => {
    let raf = 0;
    const el = pageRef.current;
    if (!el) return;

    const recalc = () => {
      const top = el.getBoundingClientRect().top;
      const h = Math.max(520, Math.round(window.innerHeight - top)); // never collapse
      el.style.height = `${h}px`;
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recalc);
    };

    schedule();

    // fonts.ready isn't in JSDOM — guard it without using `any`
    type DocWithFonts = Document & { fonts?: { ready?: Promise<unknown> } };
    const fontsReady = (document as DocWithFonts).fonts?.ready;
    fontsReady?.then(() => schedule());

    // Viewport changes
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);

    // Guard ResizeObserver (missing in JSDOM)
    let ro: ResizeObserver | null = null;
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      ro = new ResizeObserver(schedule);
      ro.observe(document.body);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('orientationchange', schedule);
      ro?.disconnect();
    };
  }, []);

  // Recalculate when these toggle height above the grid
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    el.style.height = `${Math.max(520, Math.round(window.innerHeight - top))}px`;
  }, [netErr, sidebarOpen, userId]);

  return (
    <>
      <Title value={t('chat.metaTitle')} />

      {/* Signed-out banner */}
      {!user && (
        <div className="anon-banner" role="note" aria-live="polite" aria-label={t('chat.banner.aria')} data-easy-mode="hide">
          <span>{t('chat.anonBanner')}</span>
          <a className="btn btn-secondary" href="/login">{t('chat.banner.button')}</a>
        </div>
      )}

      {/* Page grid: [sidebar | main] above, [sidebar | composer] below */}
      <div ref={pageRef} className={`chat-page ${sidebarOpen ? '' : '-collapsed'}`}>
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
          <button className="hambtn" aria-label={t('chat.sidebar.open')} onClick={() => setSidebarOpen(true)}>☰</button>
        )}

        {/* Main chat panel (no composer here) */}
        <section className="chat-main">
          <header className="chat-head">
            <h2 className="h2" style={{ margin: 0 }}>{t('chat.heading')}</h2>
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
          <MessageInput onSend={onSend} disabled={busy || agreementsLoading || showAgreementsModal} />
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
