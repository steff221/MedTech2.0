// Страница (Next.js): најава — дел за автентикација.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

const schema = z.object({
  email: z.string().email("Внеси валидна е-пошта"),
  password: z.string().min(1, "Лозинката е задолжителна"),
});

type FormData = z.infer<typeof schema>;

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

      <form onSubmit={handleSubmit(onSubmit)} className="form mt-7 !max-w-none">
        <label className="input-span">
          <span className="label">Е-пошта</span>
          <input
            type="email"
            autoComplete="email"
            placeholder="ime@primer.mk"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <span className="text-xs text-rose-300">{errors.email.message}</span>
          )}
        </label>

        <label className="input-span">
          <span className="label">Лозинка</span>
          {/* The reveal control sits inside the field, so the wrapper carries
              the relative positioning rather than the input itself — the input
              geometry is owned by `.form` and must not be overridden here. */}
          <span className="relative block">
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="!pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? t.auth.hidePassword : t.auth.showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#efefef]/60 transition-colors hover:text-[#58bc82]"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </span>
          {errors.password && (
            <span className="text-xs text-rose-300">{errors.password.message}</span>
          )}
        </label>

        <span className="span self-start !text-white/50">
          <Link href="/forgot-password" className="!text-[#58bc82]">
            {t.auth.forgotPassword}
          </Link>
        </span>

        <button type="submit" className="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Најавување…
            </>
          ) : (
            "Најави се →"
          )}
        </button>
      </form>

      <p className="span mt-6 text-center text-sm !text-white/60">
        Немаш профил? <Link href="/register">Регистрирај се</Link>
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
