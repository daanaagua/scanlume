"use client";

import { useEffect, useState } from "react";

import { verifyEmail } from "@/lib/auth";

export function EmailVerificationStatus({ token }: { token: string }) {
  const [status, setStatus] = useState("Confirmando seu email...");

  useEffect(() => {
    let cancelled = false;

    void verifyEmail({ token })
      .then(() => {
        if (!cancelled) {
          setStatus("Email confirmado com sucesso. Voce ja pode seguir usando sua conta normalmente.");
          window.setTimeout(() => {
            window.location.href = "/conta";
          }, 1200);
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setStatus(reason instanceof Error ? reason.message : "Nao foi possivel confirmar o email.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return <p className="auth-modal-note">{status}</p>;
}
