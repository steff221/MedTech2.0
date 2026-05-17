"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/common/Button";
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
      <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Join MedTech to book appointments and manage your care.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            autoComplete="given-name"
            {...register("firstName")}
            error={errors.firstName?.message}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            {...register("lastName")}
            error={errors.lastName?.message}
          />
        </div>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />
        <Input
          label="Phone (optional)"
          type="tel"
          autoComplete="tel"
          {...register("phoneNumber")}
          error={errors.phoneNumber?.message}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
          error={errors.password?.message}
          hint="12+ chars, upper + lower + digit + symbol."
        />
        <Button type="submit" loading={isSubmitting} fullWidth size="lg">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </div>
  );
}
