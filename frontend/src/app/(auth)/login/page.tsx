"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Внеси валидна е-пошта"),
  password: z.string().min(1, "Лозинката е задолжителна"),
});

type FormData = z.infer<typeof schema>;

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
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Добредојде назад
      </h1>
      <p className="mt-1.5 text-sm text-white/50">
        Пристапи до твојот здравствен профил.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-white/60">
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
            <label className="block text-sm font-medium text-white/60">
              Лозинка
            </label>
            <span className="text-xs text-white/30">
              Заборавена лозинка? Контактирај администратор
            </span>
          </div>
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

      <p className="mt-6 text-center text-sm text-white/50">
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
