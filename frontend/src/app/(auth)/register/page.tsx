// Страница (Next.js): регистрација — дел за автентикација.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { useT } from "@/hooks/useT";

const passwordRule = z
  .string()
  .min(12, "Минимум 12 карактери")
  .max(128, "Премногу долга")
  .regex(/[A-Z]/, "Потребна голема буква")
  .regex(/[a-z]/, "Потребна мала буква")
  .regex(/\d/, "Потребна цифра")
  .regex(/[^A-Za-z0-9]/, "Потребен симбол");

const schema = z.object({
  firstName: z.string().min(1, "Задолжително").max(100),
  lastName: z.string().min(1, "Задолжително").max(100),
  email: z.string().email("Внеси валидна е-пошта"),
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
  password: passwordRule,
});

type FormData = z.infer<typeof schema>;

const DARK_INPUT =
  "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/30";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const t = useT();
  const [showPwd, setShowPwd] = useState(false);
  const [registered, setRegistered] = useState(false);
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
      await registerUser({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || undefined,
        role: "PATIENT",
      });
      setRegistered(true);
    } catch {
      /* toast already shown */
    }
  };

  if (registered) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-7 w-7 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Проверете ја вашата е-пошта
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          Испративме верификациски линк на вашата адреса. Кликнете на него за да ја активирате сметката.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          Оди на најава →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Создај профил
      </h1>
      <p className="mt-1.5 text-sm text-white/60">
        Закажи прегледи и управувај со твојата здравствена историја.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Име" error={errors.firstName?.message}>
            <Input
              autoComplete="given-name"
              {...register("firstName")}
              error={errors.firstName?.message}
              className={DARK_INPUT}
            />
          </Field>
          <Field label="Презиме" error={errors.lastName?.message}>
            <Input
              autoComplete="family-name"
              {...register("lastName")}
              error={errors.lastName?.message}
              className={DARK_INPUT}
            />
          </Field>
        </div>
        <Field label="Е-пошта" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="ime@primer.mk"
            {...register("email")}
            error={errors.email?.message}
            className={DARK_INPUT}
          />
        </Field>
        <Field label="Телефон (незадолжително)" error={errors.phoneNumber?.message}>
          <Input
            type="tel"
            autoComplete="tel"
            {...register("phoneNumber")}
            error={errors.phoneNumber?.message}
            className={DARK_INPUT}
          />
        </Field>
        <Field
          label="Лозинка"
          error={errors.password?.message}
          hint="12+ карактери · голема · мала · цифра · симбол"
        >
          <div className="relative">
            <Input
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
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
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Се креира профил…
            </>
          ) : (
            "Регистрирај се →"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Веќе имаш профил?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          Најави се
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/70">
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-white/50">{hint}</p>
      ) : null}
    </div>
  );
}
