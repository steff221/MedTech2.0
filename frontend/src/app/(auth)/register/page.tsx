// Страница (Next.js): регистрација — дел за автентикација.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
        <div className="mx-auto mb-4 tile h-14 w-14 !border-emerald-500/30 !bg-emerald-500/10">
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

      <form onSubmit={handleSubmit(onSubmit)} className="form mt-7 !max-w-none">
        {/* Name is one question asked in two fields, so the pair shares a row
            while each half keeps the standard label/field/error stack. */}
        <div className="grid w-full grid-cols-2 gap-3">
          <Field label="Име" error={errors.firstName?.message}>
            <input type="text" autoComplete="given-name" aria-invalid={!!errors.firstName} {...register("firstName")} />
          </Field>
          <Field label="Презиме" error={errors.lastName?.message}>
            <input type="text" autoComplete="family-name" aria-invalid={!!errors.lastName} {...register("lastName")} />
          </Field>
        </div>

        <Field label="Е-пошта" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            placeholder="ime@primer.mk"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="Телефон (незадолжително)" error={errors.phoneNumber?.message}>
          <input type="tel" autoComplete="tel" aria-invalid={!!errors.phoneNumber} {...register("phoneNumber")} />
        </Field>

        <Field
          label="Лозинка"
          error={errors.password?.message}
          hint="12+ карактери · голема · мала · цифра · симбол"
        >
          <span className="relative block">
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="new-password"
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
        </Field>

        <button type="submit" className="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Се креира профил…
            </>
          ) : (
            "Регистрирај се →"
          )}
        </button>
      </form>

      <p className="span mt-6 text-center text-sm !text-white/60">
        Веќе имаш профил? <Link href="/login">Најави се</Link>
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
    <label className="input-span">
      <span className="label">{label}</span>
      {children}
      {error ? (
        <span className="text-xs text-rose-300">{error}</span>
      ) : hint ? (
        <span className="text-xs text-white/50">{hint}</span>
      ) : null}
    </label>
  );
}
