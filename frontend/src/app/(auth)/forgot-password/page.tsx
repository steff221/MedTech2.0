"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/common/Input";
import { authService } from "@/services/auth.service";
import { extractErrorMessage } from "@/services/api";
import { useT } from "@/hooks/useT";

const schema = z.object({
  email: z.string().email(),
});
type FormData = z.infer<typeof schema>;

const DARK_INPUT =
  "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/30";

export default function ForgotPasswordPage() {
  const t = useT();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.forgotPassword(data.email);
    } catch (err) {
      // Silently swallow — we show the success screen regardless to prevent enumeration.
      // Log for debugging only.
      console.debug("forgotPassword error (may be expected):", extractErrorMessage(err));
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          {t.auth.forgotSuccessTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {t.auth.forgotSuccessDesc}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          ← {t.auth.forgotBackToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white">
        {t.auth.forgotTitle}
      </h1>
      <p className="mt-1.5 text-sm text-white/60">{t.auth.forgotDesc}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            {t.auth.forgotEmailLabel}
          </label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="ime@primer.mk"
            {...register("email")}
            error={errors.email?.message}
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
            t.auth.forgotSubmit
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
