"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

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
      <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-600">Sign in to access your health dashboard.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
          error={errors.password?.message}
        />
        <Button type="submit" loading={isSubmitting} fullWidth size="lg">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        New to MedTech?{" "}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}
