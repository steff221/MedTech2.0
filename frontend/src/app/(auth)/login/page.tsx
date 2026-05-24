"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

const schema = z.object({
  email: z.string().email("Внеси валидна е-пошта"),
  password: z.string().min(1, "Лозинката е задолжителна"),
});

type FormData = z.infer<typeof schema>;

const DARK_INPUT =
  "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/30";

function LoginForm() {
  const { login } = useAuth();
  const t = useT();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") ?? undefined;
  const [showPwd, setShowPwd] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data, nextUrl);
    } catch {
      /* toast already shown in useAuth */
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Добредојде назад
      </h1>
      <p className="mt-1.5 text-sm text-white/60">
        Пристапи до твојот здравствен профил.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/70">
            Е-пошта
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
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-white/70">
              Лозинка
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-white/50 transition-colors hover:text-white/80"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Најавување…
            </>
          ) : (
            "Најави се →"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Немаш профил?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          Регистрирај се
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
