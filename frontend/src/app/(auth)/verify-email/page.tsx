"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";

type Status = "loading" | "success" | "error";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    authService.verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        <p className="text-sm text-white/60">Верификација во тек…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Е-поштата е потврдена
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Вашата сметка е активирана. Можете да се најавите.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          Најави се →
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
        <XCircle className="h-7 w-7 text-rose-400" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white">
        Линкот е невалиден
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Овој верификациски линк е невалиден или истечен.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-block text-sm font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
      >
        ← Назад кон најава
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
