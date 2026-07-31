// React компонента: потсетник за дополнување на профилот (пациент).
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Card } from "@/components/common/Card";
import { useT } from "@/hooks/useT";
import { patientService } from "@/services/patient.service";
import { extractErrorMessage } from "@/services/api";
import type { Gender } from "@/types/api";

const schema = z.object({
  dateOfBirth: z.string().min(1, "Задолжително поле"),
  gender: z.enum(["M", "F", "O"]).optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
});

type FormData = z.infer<typeof schema>;

const GENDERS: { value: Gender; labelKey: "genderM" | "genderF" | "genderO" }[] = [
  { value: "M", labelKey: "genderM" },
  { value: "F", labelKey: "genderF" },
  { value: "O", labelKey: "genderO" },
];

export function CompleteProfilePrompt() {
  const t = useT();
  const pp = t.profilePrompt;
  const qc = useQueryClient();
  const [gender, setGender] = useState<Gender | undefined>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onBlur" });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      patientService.createSelfProfile({
        dateOfBirth: data.dateOfBirth,
        gender,
        address: data.address || undefined,
        city: data.city || undefined,
      }),
    onSuccess: () => {
      toast.success(t.common.profileCreated);
      qc.invalidateQueries({ queryKey: ["patient", "me"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <h2 className="text-lg font-semibold text-slate-900">{pp.patientTitle}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {pp.patientSubtitle}
        </p>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Input
            label={pp.dateOfBirth}
            type="date"
            {...register("dateOfBirth")}
            error={errors.dateOfBirth?.message}
          />
          <div>
            <p className="mb-1.5 block text-sm font-medium text-slate-700">{pp.gender}</p>
            <div className="flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    gender === g.value
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pp[g.labelKey]}
                </button>
              ))}
            </div>
          </div>
          <Input label={pp.city} {...register("city")} error={errors.city?.message} />
          <Input
            label={pp.address}
            {...register("address")}
            error={errors.address?.message}
          />
          <div className="md:col-span-2">
            <Button type="submit" loading={mutation.isPending}>
              {pp.saveContinue}
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
