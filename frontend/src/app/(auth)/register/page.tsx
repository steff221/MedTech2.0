"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

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
    } catch {
      /* toast already shown */
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Создај профил
      </h1>
      <p className="mt-1.5 text-sm text-white/50">
        Закажи прегледи и управувај со твојата здравствена историја.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ime" error={errors.firstName?.message}>
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
          <Input
            type="password"
            autoComplete="new-password"
            {...register("password")}
            error={errors.password?.message}
            className={DARK_INPUT}
          />
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

      <p className="mt-6 text-center text-sm text-white/50">
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
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/60">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-white/30">{hint}</p>}
    </div>
  );
}
