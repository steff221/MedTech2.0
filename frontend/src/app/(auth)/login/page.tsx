"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

// Tailwind override classes for the existing Input — keep the component generic
// and just paint it for the dark surface here.
const DARK_INPUT =
  "bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-400 focus:ring-emerald-400/30";

export default function LoginPage() {
  const { login } = useAuth();
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
      await login(data);
    } catch {
      /* toast already shown in useAuth */
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300">
          Sign in
        </p>
      </div>

      <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
        Welcome back
      </h1>
      <p className="mt-1.5 text-sm text-white/50">
        Access your health dashboard.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Email
          </label>
          <Input
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
            error={errors.email?.message}
            className={DARK_INPUT}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/60">
            Password
          </label>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            {...register("password")}
            error={errors.password?.message}
            className={DARK_INPUT}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing in…
            </>
          ) : (
            <>Sign in →</>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/50">
        New to MedTech?{" "}
        <Link
          href="/register"
          className="font-semibold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
