import type { WorkerEnv } from "./store";

const RESEND_API_URL = "https://api.resend.com/emails";

export function isAuthEmailConfigured(env: WorkerEnv) {
  return Boolean(env.RESEND_API_KEY && env.AUTH_EMAIL_FROM);
}

export async function sendVerificationEmail(
  env: WorkerEnv,
  input: { email: string; name: string; token: string },
) {
  const verificationUrl = `${getResolvedWebOrigin(env)}/verificar-email?token=${encodeURIComponent(input.token)}`;

  return sendEmail(env, {
    to: input.email,
    subject: "Confirme seu email no Scanlume",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#162a2c">
        <h1 style="font-size:24px">Confirme seu email</h1>
        <p>Oi ${escapeHtml(input.name || input.email)},</p>
        <p>Confirme seu email para ativar sua conta do Scanlume e manter o acesso por email e senha.</p>
        <p><a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#0e7c66;color:#fff;text-decoration:none;border-radius:999px">Confirmar email</a></p>
        <p>Se preferir, copie este link no navegador:</p>
        <p>${verificationUrl}</p>
        <p>O link expira em 24 horas.</p>
      </div>
    `,
    text: [
      `Oi ${input.name || input.email},`,
      "",
      "Confirme seu email para ativar sua conta do Scanlume.",
      verificationUrl,
      "",
      "O link expira em 24 horas.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmail(
  env: WorkerEnv,
  input: { email: string; name: string; token: string },
) {
  const resetUrl = `${getResolvedWebOrigin(env)}/redefinir-senha?token=${encodeURIComponent(input.token)}`;

  return sendEmail(env, {
    to: input.email,
    subject: "Redefina sua senha do Scanlume",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#162a2c">
        <h1 style="font-size:24px">Redefinir senha</h1>
        <p>Oi ${escapeHtml(input.name || input.email)},</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta do Scanlume.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#0e7c66;color:#fff;text-decoration:none;border-radius:999px">Criar nova senha</a></p>
        <p>Se preferir, copie este link no navegador:</p>
        <p>${resetUrl}</p>
        <p>O link expira em 1 hora. Se voce nao pediu essa troca, pode ignorar este email.</p>
      </div>
    `,
    text: [
      `Oi ${input.name || input.email},`,
      "",
      "Recebemos um pedido para redefinir a senha da sua conta do Scanlume.",
      resetUrl,
      "",
      "O link expira em 1 hora. Se voce nao pediu essa troca, pode ignorar este email.",
    ].join("\n"),
  });
}

async function sendEmail(
  env: WorkerEnv,
  input: { to: string; subject: string; html: string; text: string },
) {
  if (!env.RESEND_API_KEY || !env.AUTH_EMAIL_FROM) {
    throw new Error("email_delivery_not_configured");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.AUTH_EMAIL_FROM,
      to: [input.to],
      reply_to: env.AUTH_EMAIL_REPLY_TO,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`email_delivery_failed:${await response.text()}`);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getResolvedWebOrigin(env: WorkerEnv) {
  return env.WEB_ORIGIN ?? "https://www.scanlume.com";
}
