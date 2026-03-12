"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { getOrCreateBrowserId } from "@/lib/browser-id";
import { API_BASE_URL } from "@/lib/site";

type AuthResponse = {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
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

type SupportDeskProps = {
  embedded?: boolean;
  title?: string;
  description?: string;
};

const STORAGE_KEY = "scanlume-support-conversation";
const TEXTAREA_MIN_HEIGHT = 92;
const TEXTAREA_MAX_HEIGHT = 240;

export function SupportDesk({
  embedded = false,
  title = "Entre em contato",
  description = "Tire duvidas, envie sugestoes, relate bugs ou fale sobre parcerias. Respondemos em ate 1 dia.",
}: SupportDeskProps) {
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
    void fetch(`${API_BASE_URL}/v1/me`, {
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data: AuthResponse) => setAuth(data))
      .catch(() => setAuth({ authenticated: false }));
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
    if (!canSubmit) {
      setStatusMessage("Preencha nome, email e mensagem para continuar.");
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
          name: auth?.authenticated ? undefined : name.trim(),
          email: auth?.authenticated ? undefined : email.trim(),
          message: message.trim(),
          sourcePath: window.location.pathname,
        }),
      });

      const data = (await response.json()) as SupportChatResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel enviar sua mensagem.");
      }

      setConversationId(data.conversationId);
      setMessages((current) => mergeMessages(current, data.messages));
      setName(data.contactProfile.name);
      setEmail(data.contactProfile.email);
      setMessage("");
      setStatusMessage(
        data.assistant.needsHuman
          ? "Sua mensagem foi registrada e nosso time responde em ate 1 dia."
          : data.assistant.source === "fallback"
            ? "Mensagem enviada. Se necessario, o time responde em ate 1 dia."
            : null,
      );

      try {
        window.localStorage.setItem(STORAGE_KEY, data.conversationId);
      } catch {
        return;
      }
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Erro inesperado ao enviar a mensagem.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClearConversation() {
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setStatusMessage("Conversa limpa. Voce pode iniciar uma nova mensagem agora.");

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

  return (
    <section className={embedded ? "support-desk support-desk-embedded" : "support-desk"}>
      <div className="support-desk-head">
        <div>
          <p className="eyebrow">Contato</p>
          <h3>{title}</h3>
        </div>
        <p>{description}</p>
        {(messages.length > 0 || conversationId) && (
          <div className="support-head-actions">
            <button type="button" className="ghost-button support-clear-button" onClick={handleClearConversation}>
              Limpar conversa
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
            <span>Nome</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" />
          </label>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
            />
          </label>
        </div>
      )}

      <div ref={messagesRef} className="support-messages" aria-live="polite">
        {isLoadingHistory && <p className="support-hint">Carregando conversa recente...</p>}
        {!isLoadingHistory && messages.length === 0 && (
          <p className="support-hint">
            Pergunte como usar o OCR, relate um problema ou deixe uma sugestao. Respondemos em pt-BR.
          </p>
        )}

        {messages.map((entry, index) => (
          <article
            key={entry.id}
            ref={index === messages.length - 1 && entry.role === "assistant" ? latestAssistantMessageRef : undefined}
            className={`support-message support-message-${entry.role}`}
          >
            <strong>{entry.role === "assistant" ? "Scanlume" : "Voce"}</strong>
            <p>{entry.body}</p>
          </article>
        ))}
      </div>

      <form className="support-form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          <span>Mensagem</span>
          <textarea
            ref={textareaRef}
            rows={3}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Explique sua duvida, problema ou sugestao..."
          />
        </label>

        <div className="support-form-footer">
          <small>Ao enviar, voce concorda em receber retorno por email em ate 1 dia.</small>
          <button className="solid-button" type="submit" disabled={!canSubmit}>
            {isSubmitting ? "Enviando..." : "Enviar mensagem"}
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
