import type { SessionViewer } from "./auth";
import type { SupportAssistant, SupportCategory, SupportPriority } from "./schema";
import type { WorkerEnv } from "./store";

export type SupportConversation = {
  id: string;
  userId: string | null;
  browserId: string;
  name: string;
  email: string;
  sourcePath: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  category: SupportCategory | null;
  priority: SupportPriority | null;
  needsHuman: boolean;
  humanReason: string;
  summaryForTeam: string;
  body: string;
  createdAt: string;
};

export type SupportNotificationPayload = {
  conversationId: string;
  sourcePath: string;
  user: {
    authenticated: boolean;
    id: string | null;
    name: string;
    email: string;
  };
  userMessage: {
    id: string;
    body: string;
    createdAt: string;
  };
  assistantMessage: {
    id: string;
    body: string;
    createdAt: string;
  };
  assistantMeta: {
    category: SupportCategory;
    priority: SupportPriority;
    needsHuman: boolean;
    humanReason: string;
    summaryForTeam: string;
  };
};

export type PendingSupportNotification = {
  id: string;
  payload: SupportNotificationPayload;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  lastError: string | null;
};

type SupportConversationRow = {
  id: string;
  user_id: string | null;
  browser_id: string;
  name: string;
  email: string;
  source_path: string;
  status: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

type SupportMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  category: SupportCategory | null;
  priority: SupportPriority | null;
  needs_human: number;
  human_reason: string | null;
  summary_for_team: string | null;
  body: string;
  created_at: string;
};

type SupportNotificationRow = {
  id: string;
  payload_json: string;
  created_at: string;
  updated_at: string;
  attempt_count: number;
  last_error: string | null;
};

function requireDb(env: WorkerEnv) {
  if (!env.DB) {
    throw new Error("D1 binding is required for support conversations.");
  }

  return env.DB;
}

function mapConversation(row: SupportConversationRow): SupportConversation {
  return {
    id: row.id,
    userId: row.user_id,
    browserId: row.browser_id,
    name: row.name,
    email: row.email,
    sourcePath: row.source_path,
    status: row.status,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: SupportMessageRow): SupportMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    category: row.category,
    priority: row.priority,
    needsHuman: Boolean(row.needs_human),
    humanReason: row.human_reason ?? "",
    summaryForTeam: row.summary_for_team ?? "",
    body: row.body,
    createdAt: row.created_at,
  };
}

function canAccessConversation(row: SupportConversationRow, viewer: SessionViewer | null, browserId: string) {
  if (viewer?.id && row.user_id === viewer.id) {
    return true;
  }

  return row.browser_id === browserId;
}

export async function ensureSupportConversation(
  env: WorkerEnv,
  input: {
    conversationId?: string;
    user: SessionViewer | null;
    browserId: string;
    name: string;
    email: string;
    sourcePath: string;
    now: string;
  },
) {
  const db = requireDb(env);
  if (input.conversationId) {
    const existing = await db.prepare(
      `SELECT * FROM support_conversations WHERE id = ? LIMIT 1;`,
    )
      .bind(input.conversationId)
      .first<SupportConversationRow>();

    if (existing && canAccessConversation(existing, input.user, input.browserId)) {
      await db.prepare(
        `UPDATE support_conversations
         SET user_id = COALESCE(user_id, ?),
             browser_id = ?,
             name = ?,
             email = ?,
             source_path = ?,
             updated_at = ?
         WHERE id = ?;`,
      )
        .bind(input.user?.id ?? null, input.browserId, input.name, input.email, input.sourcePath, input.now, existing.id)
        .run();

      return {
        ...mapConversation(existing),
        userId: existing.user_id ?? input.user?.id ?? null,
        browserId: input.browserId,
        name: input.name,
        email: input.email,
        sourcePath: input.sourcePath,
        updatedAt: input.now,
      } satisfies SupportConversation;
    }
  }

  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO support_conversations (
      id, user_id, browser_id, name, email, source_path, status, last_message_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?);`,
  )
    .bind(id, input.user?.id ?? null, input.browserId, input.name, input.email, input.sourcePath, input.now, input.now, input.now)
    .run();

  return {
    id,
    userId: input.user?.id ?? null,
    browserId: input.browserId,
    name: input.name,
    email: input.email,
    sourcePath: input.sourcePath,
    status: "open",
    lastMessageAt: input.now,
    createdAt: input.now,
    updatedAt: input.now,
  } satisfies SupportConversation;
}

export async function listSupportMessages(env: WorkerEnv, conversationId: string, limit = 12) {
  const db = requireDb(env);
  const rows = await db.prepare(
    `SELECT * FROM (
       SELECT * FROM support_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?
     ) ordered_messages
     ORDER BY created_at ASC;`,
  )
    .bind(conversationId, limit)
    .all<SupportMessageRow>();

  return (rows.results ?? []).map(mapMessage);
}

export async function appendSupportMessage(
  env: WorkerEnv,
  input: {
    conversationId: string;
    role: "user" | "assistant";
    body: string;
    category?: SupportCategory | null;
    priority?: SupportPriority | null;
    needsHuman?: boolean;
    humanReason?: string;
    summaryForTeam?: string;
    createdAt: string;
  },
) {
  const db = requireDb(env);
  const id = crypto.randomUUID();
  await db.batch([
    db.prepare(
      `INSERT INTO support_messages (
        id, conversation_id, role, category, priority, needs_human, human_reason, summary_for_team, body, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    ).bind(
      id,
      input.conversationId,
      input.role,
      input.category ?? null,
      input.priority ?? null,
      input.needsHuman ? 1 : 0,
      input.humanReason ?? "",
      input.summaryForTeam ?? "",
      input.body,
      input.createdAt,
    ),
    db.prepare(
      `UPDATE support_conversations
       SET last_message_at = ?, updated_at = ?
       WHERE id = ?;`,
    ).bind(input.createdAt, input.createdAt, input.conversationId),
  ]);

  return {
    id,
    conversationId: input.conversationId,
    role: input.role,
    category: input.category ?? null,
    priority: input.priority ?? null,
    needsHuman: Boolean(input.needsHuman),
    humanReason: input.humanReason ?? "",
    summaryForTeam: input.summaryForTeam ?? "",
    body: input.body,
    createdAt: input.createdAt,
  } satisfies SupportMessage;
}

export async function queueSupportNotification(
  env: WorkerEnv,
  input: {
    conversationId: string;
    userMessageId: string;
    assistantMessageId: string;
    payload: SupportNotificationPayload;
    createdAt: string;
  },
) {
  const db = requireDb(env);
  const id = crypto.randomUUID();
  await db.prepare(
    `INSERT INTO support_notifications (
      id, conversation_id, user_message_id, assistant_message_id, channel, status, payload_json, last_error, attempt_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'feishu', 'pending', ?, NULL, 0, ?, ?);`,
  )
    .bind(
      id,
      input.conversationId,
      input.userMessageId,
      input.assistantMessageId,
      JSON.stringify(input.payload),
      input.createdAt,
      input.createdAt,
    )
    .run();

  return id;
}

export async function listPendingSupportNotifications(env: WorkerEnv, limit: number) {
  const db = requireDb(env);
  const rows = await db.prepare(
    `SELECT id, payload_json, created_at, updated_at, attempt_count, last_error
     FROM support_notifications
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT ?;`,
  )
    .bind(limit)
    .all<SupportNotificationRow>();

  return (rows.results ?? []).flatMap((row) => {
    try {
      return [
        {
          id: row.id,
          payload: JSON.parse(row.payload_json) as SupportNotificationPayload,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          attemptCount: row.attempt_count,
          lastError: row.last_error,
        } satisfies PendingSupportNotification,
      ];
    } catch {
      return [];
    }
  });
}

export async function markSupportNotificationSent(env: WorkerEnv, id: string, now: string) {
  const db = requireDb(env);
  await db.prepare(
    `UPDATE support_notifications
     SET status = 'sent', last_error = NULL, attempt_count = attempt_count + 1, updated_at = ?, sent_at = ?
     WHERE id = ?;`,
  )
    .bind(now, now, id)
    .run();
}

export async function markSupportNotificationAttempt(env: WorkerEnv, id: string, error: string, now: string) {
  const db = requireDb(env);
  await db.prepare(
    `UPDATE support_notifications
     SET status = 'pending', last_error = ?, attempt_count = attempt_count + 1, updated_at = ?
     WHERE id = ?;`,
  )
    .bind(error.slice(0, 500), now, id)
    .run();
}

export async function getSupportConversationForViewer(
  env: WorkerEnv,
  input: { conversationId: string; user: SessionViewer | null; browserId: string },
) {
  const db = requireDb(env);
  const row = await db.prepare(`SELECT * FROM support_conversations WHERE id = ? LIMIT 1;`)
    .bind(input.conversationId)
    .first<SupportConversationRow>();

  if (!row || !canAccessConversation(row, input.user, input.browserId)) {
    return null;
  }

  return mapConversation(row);
}

export function toSupportNotificationPayload(input: {
  conversation: SupportConversation;
  user: SessionViewer | null;
  userMessage: SupportMessage;
  assistantMessage: SupportMessage;
  assistant: SupportAssistant;
}) {
  return {
    conversationId: input.conversation.id,
    sourcePath: input.conversation.sourcePath,
    user: {
      authenticated: Boolean(input.user),
      id: input.user?.id ?? null,
      name: input.conversation.name,
      email: input.conversation.email,
    },
    userMessage: {
      id: input.userMessage.id,
      body: input.userMessage.body,
      createdAt: input.userMessage.createdAt,
    },
    assistantMessage: {
      id: input.assistantMessage.id,
      body: input.assistantMessage.body,
      createdAt: input.assistantMessage.createdAt,
    },
    assistantMeta: {
      category: input.assistant.category,
      priority: input.assistant.priority,
      needsHuman: input.assistant.needs_human,
      humanReason: input.assistant.human_reason,
      summaryForTeam: input.assistant.summary_for_team,
    },
  } satisfies SupportNotificationPayload;
}
