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
import { translateFromEnglish, translateToEnglish } from '@/features/translation/translator';
import { loadPreloginChat, savePreloginChat } from '@/features/chat/sessionStore';
import ChatList, { type ChatListSession } from '@/components/chat/ChatList';
import {
  sendMessageToAPI,
  fetchChatSessions,
  fetchChatConversation,
  type ChatSessionSummary as ApiChatSessionSummary,
  type ChatMessageRecord,
} from '@/api/chat';
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
import { ArrowLeft } from 'lucide-react';

type PendingPrompt = { text: string; createdAt: number };
type ChatMessageStore = { id: string; role: 'user' | 'assistant'; text: string; at: number };
type StoredChatSession = { messages: ChatMessageStore[]; pendingPrompt?: PendingPrompt };
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
function mkAssistantMessage(text: string, at: number): Message {
  return { id: mkId(), role: 'assistant', text, at };
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

function parseDate(value: string | null | undefined): number {
  const ms = value ? Date.parse(value) : NaN;
  return Number.isFinite(ms) ? ms : Date.now();
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
  // Refs
  const scrollerRef = useRef<HTMLDivElement>(null!) as React.RefObject<HTMLDivElement>; // transcript scroller
  const autoSendKeyRef = useRef<string | null>(null);
  const onSendRef = useRef<((text: string) => void | Promise<void>) | null>(null);

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
  const [pendingPromptState, setPendingPromptState] = useState<PendingPrompt | null>(null);
  const [autoSendReady, setAutoSendReady] = useState(false);
  const [sessions, setSessions] = useState<ChatListSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      setAgreementsLoading(true);
      setAgreementsError(null);

      try {
        const status = await fetchAgreementStatus(userId);
        if (!active) return;
        setAgreementStatus(status);
        setShowAgreementsModal(status.requiresAcceptance || !userId);
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
  }, [userId]);

  const handleAcceptAgreements = async () => {
    if (!userId) {
      setAgreementStatus({
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

  const refreshSessions = useCallback(async (): Promise<ChatListSession[]> => {
    const uid = userId;
    if (!uid) {
      setSessions([]);
      return [];
    }

    try {
      const raw = await fetchChatSessions(uid);
      const mapped = raw.map((item: ApiChatSessionSummary): ChatListSession => ({
        id: item.id,
        title: item.title ?? null,
        lastMessage: item.last_message ?? null,
        lastMessageRole: (item.last_message_role ?? null) as 'user' | 'assistant' | null,
        createdAt: parseDate(item.created_at),
        updatedAt: parseDate(item.updated_at ?? item.created_at),
      }));
      setSessions(mapped);
      return mapped;
    } catch (error) {
      console.error('Failed to load chat sessions', error);
      setSessions([]);
      return [];
    }
  }, [userId]);

  const loadConversation = useCallback(
    async (session: string | ChatListSession) => {
      const uid = userId;
      if (!uid) return;
      const sessionId = typeof session === 'string' ? session : session.id;
      try {
        const records = await fetchChatConversation(sessionId, uid);
        const mapped = records
          .map<Message>((record) => ({
            id: record.id,
            role: record.role === 'assistant' ? 'assistant' : 'user',
            text: record.content,
            at: parseDate(record.created_at),
          }))
          .sort((a, b) => (a.at ?? 0) - (b.at ?? 0));

        if (mapped.length) {
          setMessages(mapped);
          const timestamps = mapped
            .map((m) => m.at ?? Date.now())
            .filter((value) => Number.isFinite(value));
          const maxAt = timestamps.length ? Math.max(...timestamps) : Date.now();
          setLastActivity(Number.isFinite(maxAt) ? maxAt : Date.now());
        } else {
          const now = Date.now();
          const welcome = mkAssistantMessage(t('chat.initialMessage'), now);
          setMessages([welcome]);
          setLastActivity(now);
        }

        setSessionId(sessionId);
        setActiveSessionId(sessionId);
        setPendingPromptState(null);
        setServiceAction(null);
        setServiceFormOpen(false);
        setCrisisAlert(null);
        setNetErr(null);
      } catch (error) {
        console.error('Failed to load conversation', error);
        setNetErr(t('chat.errors.network'));
      }
    },
    [userId, t],
  );

  // initial load
  useEffect(() => {
    setServiceAction(null);
    setServiceFormOpen(false);
    setCrisisAlert(null);
    setNetErr(null);

    if (!userId) {
      const stored = loadPreloginChat();
      const storedMessages = Array.isArray(stored?.messages)
        ? (stored.messages as ChatMessageStore[])
        : undefined;
      const restored = storedMessages ? toUI(storedMessages) : null;
      if (restored && restored.length) {
        setMessages(restored);
        const timestamps = restored
          .map((m) => m.at ?? Date.now())
          .filter((value) => Number.isFinite(value));
        const maxAt = timestamps.length ? Math.max(...timestamps) : Date.now();
        setLastActivity(Number.isFinite(maxAt) ? maxAt : Date.now());
      } else {
        const now = Date.now();
        const welcome = mkAssistantMessage(t('chat.initialMessage'), now);
        setMessages([welcome]);
        setLastActivity(now);
      }
      setPendingPromptState(stored?.pendingPrompt ?? null);
      setSessionId(null);
      setActiveSessionId(null);
      setSessions([]);
      return;
    }

    setPendingPromptState(null);
    let cancelled = false;

    (async () => {
      const currentSessions = await refreshSessions();
      if (cancelled) return;
      if (currentSessions.length) {
        const first = currentSessions[0];
        if (first?.id) {
          await loadConversation(first);
          if (cancelled) return;
        }
      } else {
        const now = Date.now();
        const welcome = mkAssistantMessage(t('chat.initialMessage'), now);
        setMessages([welcome]);
        setLastActivity(now);
        setSessionId(null);
        setActiveSessionId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, t, refreshSessions, loadConversation]);

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

  // persist pre-login chat only so returning visitors can continue where they left off
  useEffect(() => {
    const storedMessages = toStore(messages);
    const payload: StoredChatSession = {
      messages: storedMessages,
      ...(pendingPromptState ? { pendingPrompt: pendingPromptState } : {}),
    };
    const maxAt = storedMessages.length
      ? Math.max(...storedMessages.map((m) => m.at ?? Date.now()))
      : Date.now();
    setLastActivity(Number.isFinite(maxAt) ? maxAt : Date.now());
    if (!userId) {
      savePreloginChat(payload);
    }
  }, [messages, pendingPromptState, userId]);

  // auto-scroll only when already near the bottom
  useEffect(() => { if (atBottom) scrollToBottom(); }, [messages.length, atBottom, scrollToBottom]);

  const handleCrisisDismiss = () => {
    setCrisisAlert(null);
  };

  const filterCrisisResources = useCallback((raw: unknown): CrisisResource[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
      .map((item) => item as Record<string, unknown>)
      .filter((item) => typeof item.label === 'string' && typeof item.href === 'string')
      .map((item) => ({ label: item.label as string, href: item.href as string }));
  }, []);

  const onSend = useCallback(async (text: string) => {
    if (crisisAlert) return;
    if (agreementsLoading || showAgreementsModal) return;
    const trimmed = text.trim();
    if (!trimmed.length) return;

    setNetErr(null);
    const sentAt = Date.now();
    const userMsg: Message = { id: mkId(), role: 'user', text: trimmed, at: sentAt };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);

    const userLanguage = language ?? 'en';
    let messageForBackend = trimmed;
    let backendLanguage = userLanguage;
    let translationUsed = false;

    if (userLanguage !== 'en') {
      const translated = await translateToEnglish(trimmed, userLanguage);
      if (translated.ok) {
        messageForBackend = translated.text;
        backendLanguage = 'en';
        translationUsed = true;
      }
    }

    const handleReply = async (
      reply: Awaited<ReturnType<typeof sendMessageToAPI>>,
      replyLanguage: string,
    ) => {
      if (reply.session_id) {
        setSessionId(reply.session_id);
        if (userId) {
          setActiveSessionId(reply.session_id);
          try {
            await refreshSessions();
          } catch (error) {
            console.error('Failed to refresh sessions after reply', error);
          }
        }
      }
      let assistantText =
        (typeof reply.response === 'string' && reply.response.trim().length
          ? reply.response
          : typeof reply.message === 'string'
            ? reply.message
            : t('chat.errors.generic'));

      if (assistantText && userLanguage !== 'en' && replyLanguage === 'en') {
        const translated = await translateFromEnglish(assistantText, userLanguage);
        if (translated.ok) {
          assistantText = translated.text;
        }
      }

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
    };

    try {
      const reply = await sendMessageToAPI(messageForBackend, sessionId, backendLanguage, userId);
      await handleReply(reply, backendLanguage);
    } catch {
      if (translationUsed) {
        // If translation failed on the backend call, try resending with the original language.
        try {
          const fallbackReply = await sendMessageToAPI(trimmed, sessionId, userLanguage, userId);
          await handleReply(fallbackReply, userLanguage);
          return;
        } catch {
          // fall through to generic error handling
        }
      }

      setNetErr(t('chat.errors.network'));
      setMessages((prev) => [...prev, { id: mkId(), role: 'assistant', text: t('chat.errors.generic'), at: Date.now() }]);
    } finally {
      setBusy(false);
    }
  }, [
    agreementsLoading,
    showAgreementsModal,
    crisisAlert,
    filterCrisisResources,
    language,
    sessionId,
    userId,
    refreshSessions,
    t,
  ]);

  const handleSelectSession = useCallback((nextSessionId: string) => {
    if (!userId) return;
    setActiveSessionId(nextSessionId);
    void loadConversation(nextSessionId);
  }, [userId, loadConversation]);

  const handleStartNewSession = useCallback(() => {
    const now = Date.now();
    const welcomeMessage = mkAssistantMessage(t('chat.initialMessage'), now);
    setMessages([welcomeMessage]);
    setSessionId(null);
    setActiveSessionId(null);
    setLastActivity(now);
    setServiceAction(null);
    setServiceFormOpen(false);
    setCrisisAlert(null);
    setNetErr(null);
    setPendingPromptState(null);
  }, [t]);

  useEffect(() => {
    onSendRef.current = onSend;
    setAutoSendReady(true);
    return () => {
      onSendRef.current = null;
      setAutoSendReady(false);
    };
  }, [onSend]);

  useEffect(() => {
    if (!pendingPromptState) {
      autoSendKeyRef.current = null;
      return;
    }

    const text = pendingPromptState.text.trim();
    if (!text.length) {
      setPendingPromptState(null);
      autoSendKeyRef.current = null;
      return;
    }

    if (!autoSendReady) return;

    const handler = onSendRef.current;
    if (!handler) return;

    const key = `${pendingPromptState.createdAt}:${text}`;
    if (autoSendKeyRef.current === key) return;
    if (busy || agreementsLoading || showAgreementsModal || crisisAlert) return;

    autoSendKeyRef.current = key;

    (async () => {
      try {
        await handler(text);
      } catch (error) {
        console.error(error);
      } finally {
        setPendingPromptState(null);
        autoSendKeyRef.current = null;
      }
    })();
  }, [pendingPromptState, busy, agreementsLoading, showAgreementsModal, crisisAlert, autoSendReady]);

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

  const composerDisabled = busy || agreementsLoading || showAgreementsModal || Boolean(crisisAlert);
  const messageInput = (
    <MessageInput
      onSend={onSend}
      disabled={composerDisabled}
      maxVisibleLines={isMobileLayout ? 4 : undefined}
      isSending={busy}
    />
  );

  const renderAnonNotice = () => {
    if (!user && showAnonNotice) {
      const containerClass = isMobileLayout ? 'chat-anon-notice' : 'anon-pill';
      const linkClass = isMobileLayout ? 'chat-anon-link' : 'anon-pill-link chat-anon-link';
      const closeClass = isMobileLayout ? 'chat-anon-close' : 'anon-pill-close chat-anon-close';
      return (
        <div
          className={`${containerClass} chat-anon-container`}
          role="note"
          aria-live="polite"
          aria-label={t('chat.banner.aria')}
          data-easy-mode="hide"
        >
          <span className="chat-anon-text">{t('chat.anonBanner')}</span>
          <a className={linkClass} href="/login">{t('chat.banner.button')}</a>
          <button
            type="button"
            className={closeClass}
            aria-label={t('chat.alert.dismiss')}
            onClick={() => setShowAnonNotice(false)}
          >
            ×
          </button>
        </div>
      );
    }
    return null;
  };

  const netErrorBanner = netErr ? (
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
  ) : null;

  const crisisBanner = crisisAlert ? (
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
  ) : null;

  const typingIndicator = busy ? (
    <div className="typing-row" aria-live="polite" aria-label={t('chat.typing')}>
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  ) : null;

  const jumpToLatest = !atBottom ? (
    <button className="jump-latest" onClick={scrollToBottom}>{t('chat.jumpToLatest')}</button>
  ) : null;

  const transcriptContent = (
    <div className="chat-body">
      <MessageList items={messages} />
      {typingIndicator}
    </div>
  );

  const chatHeader = (
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
  );

  const sidebarEmptyMessage = t('chat.sidebar.empty');
  const sidebarSignInCta = t('chat.sidebar.signInCta');
  const sidebarSignInButton = t('chat.sidebar.signInButton');
  const sidebarNewChatLabel = t('chat.sidebar.newChat');

  const renderMobileContent = () => (
    <div className="chat-shell">
      <div className="chat-topbar">
        {chatHeader}
      </div>
      {netErrorBanner}
      {crisisBanner}
      <div ref={scrollerRef} className="chat-messages">
        {transcriptContent}
        {jumpToLatest}
      </div>
      {renderAnonNotice()}
      <div className="chat-composer-bar">
        {messageInput}
      </div>
    </div>
  );

  const renderDesktopContent = () => (
    <div className={`chat-page ${sidebarOpen ? '' : '-collapsed'}`}>
      {sidebarOpen ? (
        <aside className="chat-sidebar">
          <header className="sidebar-head">
            <h2 className="h3" style={{ margin: 0 }}>{t('chat.sidebar.title')}</h2>
            <button className="icon-btn" aria-label={t('chat.sidebar.hide')} onClick={() => setSidebarOpen(false)}>×</button>
          </header>
          <div className="sidebar-body">
            <ChatList
              userId={userId}
              locale={locale}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={handleSelectSession}
              onStartNewSession={handleStartNewSession}
              emptyMessage={sidebarEmptyMessage}
              signInCtaLabel={sidebarSignInCta}
              signInButtonLabel={sidebarSignInButton}
              newChatLabel={sidebarNewChatLabel}
            />
          </div>
        </aside>
      ) : (
        !isNarrow && (
          <button className="hambtn" aria-label={t('chat.sidebar.open')} onClick={() => setSidebarOpen(true)}>☰</button>
        )
      )}

      <section className="chat-main">
        {chatHeader}
        {netErrorBanner}
        {crisisBanner}
        <div ref={scrollerRef} className="chat-scroller">
          {transcriptContent}
          {jumpToLatest}
        </div>
      </section>

      <div className="composer-dock">
        {renderAnonNotice()}
        {messageInput}
      </div>
    </div>
  );

  return (
    <>
      <Title value={t('chat.metaTitle')} />
      {isMobileLayout ? renderMobileContent() : renderDesktopContent()}
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
