"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

// Mirror of the backend RegisterRequest validation:
// - email format
// - 12-128 chars
// - upper + lower + digit + symbol
const passwordRule = z
  .string()
  .min(12, "At least 12 characters")
  .max(128, "Too long")
  .regex(/[A-Z]/, "Needs an uppercase letter")
  .regex(/[a-z]/, "Needs a lowercase letter")
  .regex(/\d/, "Needs a digit")
  .regex(/[^A-Za-z0-9]/, "Needs a symbol");

const schema = z.object({
  firstName: z.string().min(1, "Required").max(100),
  lastName: z.string().min(1, "Required").max(100),
  email: z.string().email("Enter a valid email"),
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
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-300">
          Create account
        </p>
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
        Join MedTech
      </h1>
      <p className="mt-1.5 text-sm text-white/50">
        Book appointments and manage your care.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={errors.firstName?.message}>
            <Input
              autoComplete="given-name"
              {...register("firstName")}
              error={errors.firstName?.message}
              className={DARK_INPUT}
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <Input
              autoComplete="family-name"
              {...register("lastName")}
              error={errors.lastName?.message}
              className={DARK_INPUT}
            />
          </Field>
        </div>
        <Field label="Email" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            error={errors.email?.message}
            className={DARK_INPUT}
          />
        </Field>
        <Field label="Phone (optional)" error={errors.phoneNumber?.message}>
          <Input
            type="tel"
            autoComplete="tel"
            {...register("phoneNumber")}
            error={errors.phoneNumber?.message}
            className={DARK_INPUT}
          />
        </Field>
        <Field
          label="Password"
          error={errors.password?.message}
          hint="12+ chars · upper · lower · digit · symbol"
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
          className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Creating account…
            </>
          ) : (
            <>Create account →</>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          Sign in
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
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}
