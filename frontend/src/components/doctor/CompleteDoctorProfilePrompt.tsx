// React компонента: потсетник за дополнување на профилот на докторот.
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { useT } from "@/hooks/useT";
import { api, extractErrorMessage } from "@/services/api";
import { hospitalService } from "@/services/hospital.service";
import type { HospitalResponse } from "@/types/api";

const schema = z.object({
  licenseNumber: z.string().min(1, "Required").max(100),
  specialization: z.string().min(1, "Required").max(100),
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  qualification: z.string().max(255).optional(),
  hospitalId: z.coerce.number().int().positive("Pick a hospital"),
});

type FormData = z.infer<typeof schema>;

export function CompleteDoctorProfilePrompt() {
  const t = useT();
  const qc = useQueryClient();
  const [hospitalId, setHospitalId] = useState<number | null>(null);

  const hospitals = useQuery({
    queryKey: ["hospitals", "active"],
    queryFn: () => hospitalService.listActive(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onBlur" });

  useEffect(() => {
    if (hospitalId != null) setValue("hospitalId", hospitalId, { shouldValidate: true });
  }, [hospitalId, setValue]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post("/doctors/me", {
        licenseNumber: data.licenseNumber,
        specialization: data.specialization,
        experienceYears: data.experienceYears,
        qualification: data.qualification || undefined,
        hospitalId: data.hospitalId,
      }),
    onSuccess: () => {
      toast.success(t.common.profileCreated);
      qc.invalidateQueries({ queryKey: ["doctor", "me"] });
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
        <h2 className="text-lg font-semibold text-slate-900">Set up your clinician profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          A few details before we can show your schedule.
        </p>

        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Input
            label="Licence number"
            placeholder="DR-0042"
            {...register("licenseNumber")}
            error={errors.licenseNumber?.message}
          />
          <Input
            label="Specialization"
            placeholder="Cardiology"
            {...register("specialization")}
            error={errors.specialization?.message}
          />
          <Input
            label="Qualification (optional)"
            placeholder="MD, MSc"
            {...register("qualification")}
            error={errors.qualification?.message}
          />
          <Input
            label="Experience (years)"
            type="number"
            min={0}
            {...register("experienceYears")}
            error={errors.experienceYears?.message}
          />

          <div className="md:col-span-2">
            <p className="mb-1.5 block text-sm font-medium text-slate-700">Hospital</p>
            {hospitals.isLoading ? (
              <p className="text-sm text-slate-500">Loading hospitals…</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {hospitals.data?.map((h: HospitalResponse) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setHospitalId(h.id)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      hospitalId === h.id
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="font-semibold">{h.name}</div>
                    <div className="text-xs text-slate-500">{h.city}</div>
                  </button>
                ))}
              </div>
            )}
            {errors.hospitalId && (
              <p className="mt-1.5 text-xs text-rose-600">{errors.hospitalId.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Button type="submit" loading={mutation.isPending}>
              Save and continue
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  );
}
