"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { getOrCreateBrowserId } from "@/lib/browser-id";
import type { ClientLocale } from "@/lib/client-locale";
import { API_BASE_URL } from "@/lib/site";

type AuthResponse = {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    hasPassword: boolean;
    authProviders: string[];
  } | null;
};

type SupportMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
};

type SupportConversationResponse = {
  conversation: {
    id: string;
    name: string;
    email: string;
  };
  messages: SupportMessage[];
};

type SupportChatResponse = {
  conversationId: string;
  contactProfile: {
    name: string;
    email: string;
  };
  assistant: {
    replyUser: string;
    needsHuman: boolean;
    source: "n8n" | "fallback";
  };
  messages: SupportMessage[];
};

type SupportErrorResponse = {
  error?: string;
  details?: {
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

type SupportDeskProps = {
  embedded?: boolean;
  title?: string;
  description?: string;
  locale?: ClientLocale;
};

const STORAGE_KEY = "scanlume-support-conversation";
const TEXTAREA_MIN_HEIGHT = 92;
const TEXTAREA_MAX_HEIGHT = 240;

const SUPPORT_DESK_COPY = {
  "pt-BR": {
    title: "Entre em contato",
    description: "Tire duvidas, envie sugestoes, relate bugs ou fale sobre parcerias. Respondemos em ate 1 dia.",
    eyebrow: "Contato",
    clearConversation: "Limpar conversa",
    missingFields: "Preencha nome, email e mensagem para continuar.",
    invalidEmail: "Informe um email valido para receber nossa resposta.",
    sendError: "Nao foi possivel enviar sua mensagem.",
    humanStatus: "Sua mensagem foi registrada e nosso time responde em ate 1 dia.",
    fallbackStatus: "Mensagem enviada. Se necessario, o time responde em ate 1 dia.",
    unexpectedError: "Erro inesperado ao enviar a mensagem.",
    conversationCleared: "Conversa limpa. Voce pode iniciar uma nova mensagem agora.",
    name: "Nome",
    namePlaceholder: "Seu nome",
    email: "Email",
    emailPlaceholder: "seu@email.com",
    loadingHistory: "Carregando conversa recente...",
    emptyHint: "Pergunte como usar o OCR, relate um problema ou deixe uma sugestao. Respondemos em pt-BR.",
    you: "Voce",
    message: "Mensagem",
    messagePlaceholder: "Explique sua duvida, problema ou sugestao...",
    consent: "Ao enviar, voce concorda em receber retorno por email em ate 1 dia.",
    sending: "Enviando...",
    send: "Enviar mensagem",
  },
  en: {
    title: "Contact us",
    description: "Tell us your question, bug, or suggestion. We usually reply within 1 day.",
    eyebrow: "Contact",
    clearConversation: "Clear conversation",
    missingFields: "Enter your name, email, and message to continue.",
    invalidEmail: "Enter a valid email so we can reply.",
    sendError: "Could not send your message.",
    humanStatus: "Your message was recorded and our team usually replies within 1 day.",
    fallbackStatus: "Message sent. Our team will reply within 1 day if needed.",
    unexpectedError: "Unexpected error while sending the message.",
    conversationCleared: "Conversation cleared. You can start a new message now.",
    name: "Name",
    namePlaceholder: "Your name",
    email: "Email",
    emailPlaceholder: "you@example.com",
    loadingHistory: "Loading recent conversation...",
    emptyHint: "Ask about OCR, report a problem, or leave feedback. We reply in English.",
    you: "You",
    message: "Message",
    messagePlaceholder: "Describe your question, problem, or suggestion...",
    consent: "By sending, you agree to receive a reply by email within 1 day.",
    sending: "Sending...",
    send: "Send message",
  },
} as const;

export function SupportDesk({
  embedded = false,
  title,
  description,
  locale = "pt-BR",
}: SupportDeskProps) {
  const copy = SUPPORT_DESK_COPY[locale];
  const resolvedTitle = title ?? copy.title;
  const resolvedDescription = description ?? copy.description;
  const [auth, setAuth] = useState<AuthResponse | null>(null);
  const [browserId, setBrowserId] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const latestAssistantMessageRef = useRef<HTMLElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function fetchAuthState() {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/me`, {
        credentials: "include",
      });
      const data = (await response.json()) as AuthResponse;
      setAuth(data);
      return data;
    } catch {
      const fallback = { authenticated: false, user: null } satisfies AuthResponse;
      setAuth(fallback);
      return fallback;
    }
  }

  useEffect(() => {
    const resolvedBrowserId = getOrCreateBrowserId();
    setBrowserId(resolvedBrowserId);
    try {
      const storedConversationId = window.localStorage.getItem(STORAGE_KEY);
      if (storedConversationId) {
        setConversationId(storedConversationId);
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    void fetchAuthState();
  }, []);

  useEffect(() => {
    if (!auth?.authenticated || !auth.user) {
      return;
    }

    setName(auth.user.name);
    setEmail(auth.user.email);
  }, [auth]);

  useEffect(() => {
    if (!browserId || !conversationId) {
      return;
    }

    setIsLoadingHistory(true);
    void fetch(
      `${API_BASE_URL}/v1/support/conversations/${encodeURIComponent(conversationId)}?browserId=${encodeURIComponent(browserId)}`,
      {
        credentials: "include",
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("conversation_not_found");
        }

        return response.json() as Promise<SupportConversationResponse>;
      })
      .then((data) => {
        setMessages(data.messages);
        setName((current) => current || data.conversation.name);
        setEmail((current) => current || data.conversation.email);
      })
      .catch(() => {
        setConversationId(null);
        setMessages([]);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          return;
        }
      })
      .finally(() => setIsLoadingHistory(false));
  }, [browserId, conversationId]);

  useEffect(() => {
    resizeTextarea();
  }, [message]);

  useEffect(() => {
    if (messages.length === 0 || messages[messages.length - 1]?.role !== "assistant") {
      return;
    }

    requestAnimationFrame(() => {
      latestAssistantMessageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      messagesRef.current?.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages]);

  const canSubmit = useMemo(() => {
    if (isSubmitting || !browserId || !message.trim()) {
      return false;
    }

    if (auth?.authenticated) {
      return true;
    }

    return Boolean(name.trim() && email.trim());
  }, [auth?.authenticated, browserId, email, isSubmitting, message, name]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const authState = auth ?? (await fetchAuthState());
    const isAuthenticated = Boolean(authState.authenticated && authState.user);
    const resolvedName = isAuthenticated ? authState.user?.name ?? "" : name.trim();
    const resolvedEmail = isAuthenticated ? authState.user?.email ?? "" : email.trim();

    if (!browserId || !message.trim() || (!isAuthenticated && (!resolvedName || !resolvedEmail))) {
      setStatusMessage(copy.missingFields);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/v1/support/chat`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          browserId,
          conversationId: conversationId ?? undefined,
          name: isAuthenticated ? undefined : resolvedName,
          email: isAuthenticated ? undefined : resolvedEmail,
          message: message.trim(),
          sourcePath: window.location.pathname,
        }),
      });

      const data = (await response.json()) as SupportChatResponse & SupportErrorResponse;
      if (!response.ok) {
        const emailError = data.details?.fieldErrors?.email?.[0];
        if (emailError) {
          throw new Error(copy.invalidEmail);
        }

        throw new Error(data.error || copy.sendError);
      }

      setConversationId(data.conversationId);
      setMessages((current) => mergeMessages(current, data.messages));
      setName(data.contactProfile.name);
      setEmail(data.contactProfile.email);
      setMessage("");
      setStatusMessage(
        data.assistant.needsHuman
          ? copy.humanStatus
          : data.assistant.source === "fallback"
            ? copy.fallbackStatus
            : null,
      );

      try {
        window.localStorage.setItem(STORAGE_KEY, data.conversationId);
      } catch {
        return;
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : copy.unexpectedError);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClearConversation() {
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setStatusMessage(copy.conversationCleared);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      return;
    }
  }

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = `${TEXTAREA_MIN_HEIGHT}px`;
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, TEXTAREA_MIN_HEIGHT), TEXTAREA_MAX_HEIGHT);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > TEXTAREA_MAX_HEIGHT ? "auto" : "hidden";
  }

  function revealFocusedField(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const target = event.currentTarget;
    window.setTimeout(() => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  }

  return (
    <section className={embedded ? "support-desk support-desk-embedded" : "support-desk"}>
      <div className="support-desk-head">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h3>{resolvedTitle}</h3>
        </div>
        <p>{resolvedDescription}</p>
        {(messages.length > 0 || conversationId) && (
          <div className="support-head-actions">
            <button type="button" className="ghost-button support-clear-button" onClick={handleClearConversation}>
              {copy.clearConversation}
            </button>
          </div>
        )}
      </div>

      {auth?.authenticated && auth.user ? (
        <div className="support-profile-chip">
          <strong>{auth.user.name}</strong>
          <span>{auth.user.email}</span>
        </div>
      ) : (
        <div className="support-fields-grid">
          <label>
            <span>{copy.name}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onFocus={revealFocusedField}
              placeholder={copy.namePlaceholder}
            />
          </label>
          <label>
            <span>{copy.email}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onFocus={revealFocusedField}
              placeholder={copy.emailPlaceholder}
            />
          </label>
        </div>
      )}

      <div ref={messagesRef} className="support-messages" aria-live="polite">
        {isLoadingHistory && <p className="support-hint">{copy.loadingHistory}</p>}
        {!isLoadingHistory && messages.length === 0 && (
          <p className="support-hint">{copy.emptyHint}</p>
        )}

        {messages.map((entry, index) => (
          <article
            key={entry.id}
            ref={index === messages.length - 1 && entry.role === "assistant" ? latestAssistantMessageRef : undefined}
            className={`support-message support-message-${entry.role}`}
          >
            <strong>{entry.role === "assistant" ? "Scanlume" : copy.you}</strong>
            <p>{entry.body}</p>
          </article>
        ))}
      </div>

      <form className="support-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          <span>{copy.message}</span>
          <textarea
            ref={textareaRef}
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onFocus={revealFocusedField}
            placeholder={copy.messagePlaceholder}
          />
        </label>

        <div className="support-form-footer">
          <small>{copy.consent}</small>
          <button className="solid-button" type="submit" disabled={!canSubmit}>
            {isSubmitting ? copy.sending : copy.send}
          </button>
        </div>
      </form>

      {statusMessage && <p className="support-status-message">{statusMessage}</p>}
    </section>
  );
}

function mergeMessages(current: SupportMessage[], incoming: SupportMessage[]) {
  const merged = [...current];
  const knownIds = new Set(current.map((item) => item.id));

  for (const item of incoming) {
    if (!knownIds.has(item.id)) {
      merged.push(item);
      knownIds.add(item.id);
    }
  }

  return merged.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}
