// Страница (Next.js): ресет на лозинка — дел за автентикација.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import toast from "react-hot-toast";
import { Input } from "@/components/common/Input";
import { authService } from "@/services/auth.service";
import { extractErrorMessage } from "@/services/api";
import { useT } from "@/hooks/useT";

const schema = z
  .object({
    password: z
      .string()
      .min(12, "Лозинката мора да биде минимум 12 карактери")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).+$/,
        "Лозинката мора да содржи голема, мала буква, цифра и специјален знак",
      ),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "Лозинките не се совпаѓаат",
  });

type FormData = z.infer<typeof schema>;

const DARK_INPUT =
  "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/30";

function ResetPasswordForm() {
  const t = useT();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (!token) {
      toast.error(t.auth.resetInvalidToken);
      return;
    }
    try {
      await authService.resetPassword(token, data.password);
      setDone(true);
    } catch (err) {
      toast.error(extractErrorMessage(err) ?? t.auth.resetInvalidToken);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {t.auth.resetSuccessTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {t.auth.resetSuccessDesc}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          {t.auth.forgotBackToLogin}
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-rose-400">{t.auth.resetInvalidToken}</p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-sm font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          ← {t.auth.forgotSubmit}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white">
        {t.auth.resetTitle}
      </h1>
      <p className="mt-1.5 text-sm text-white/60">{t.auth.resetDesc}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t.auth.resetPasswordLabel}
          </label>
          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••••••"
              {...register("password")}
              error={errors.password?.message}
              className={`${DARK_INPUT} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? t.auth.hidePassword : t.auth.showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition-colors hover:text-white/80"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t.auth.resetConfirmLabel}
          </label>
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            {...register("confirm")}
            error={errors.confirm?.message}
            className={DARK_INPUT}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {t.common.loading}
            </>
          ) : (
            t.auth.resetSubmit
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        <Link
          href="/login"
          className="font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          ← {t.auth.forgotBackToLogin}
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
