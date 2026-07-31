// React компонента: форма за медицински картон.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Mkb10Autocomplete } from "./Mkb10Autocomplete";
import { useT } from "@/hooks/useT";
import { extractErrorMessage } from "@/services/api";
import { medicalRecordService } from "@/services/medicalRecord.service";

const schema = z.object({
  clinicalNotes: z.string().min(1, "Клиничките белешки се задолжителни"),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  bloodPressure: z.string().max(20).optional().or(z.literal("")),
  heartRate: z.coerce.number().int().min(20).max(250).optional(),
  temperature: z.coerce.number().min(30).max(45).optional(),
  weight: z.coerce.number().min(0.5).max(400).optional(),
  height: z.coerce.number().min(20).max(260).optional(),
});

type FormData = z.infer<typeof schema>;

interface MedicalRecordFormProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  appointmentId?: number;
}

export function MedicalRecordForm({
  open,
  onClose,
  patientId,
  patientName,
  appointmentId,
}: MedicalRecordFormProps) {
  const t = useT();
  const f = t.medicalRecordForm;
  const qc = useQueryClient();
  const [mkb10, setMkb10] = useState<{ code: string; label: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), mode: "onBlur" });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      medicalRecordService.create({
        patientId,
        appointmentId,
        clinicalNotes: data.clinicalNotes,
        assessment: data.assessment || undefined,
        plan: data.plan || undefined,
        bloodPressure: data.bloodPressure || undefined,
        heartRate: data.heartRate,
        temperature: data.temperature,
        weight: data.weight,
        height: data.height,
        diagnosis: mkb10?.label,
        mkb10Code: mkb10?.code,
      }),
    onSuccess: () => {
      toast.success(t.doctorDrawer.recordSaved);
      qc.invalidateQueries({ queryKey: ["patient", patientId, "medical-records"] });
      handleClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleClose = () => {
    reset();
    setMkb10(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={f.title}
      description={`${f.patientPrefix}: ${patientName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {f.cancel}
          </Button>
          <Button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            loading={mutation.isPending}
          >
            {f.save}
          </Button>
        </>
      }
    >
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
        <section>
          <SectionTitle index="S" title={f.subjectiveTitle} subtitle={f.subjectiveSubtitle} />
          <textarea
            {...register("clinicalNotes")}
            rows={4}
            placeholder={f.subjectivePlaceholder}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          {errors.clinicalNotes && (
            <p className="mt-1 text-xs text-rose-600">{errors.clinicalNotes.message}</p>
          )}
        </section>

        <section>
          <SectionTitle index="O" title={f.objectiveTitle} subtitle={f.objectiveSubtitle} />
          <div className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-5">
            <Input
              label={f.bp}
              placeholder="120/80"
              {...register("bloodPressure")}
              error={errors.bloodPressure?.message}
            />
            <Input
              label={f.hr}
              type="number"
              {...register("heartRate")}
              error={errors.heartRate?.message}
            />
            <Input
              label={f.temp}
              type="number"
              step="0.1"
              {...register("temperature")}
              error={errors.temperature?.message}
            />
            <Input
              label={f.weight}
              type="number"
              step="0.1"
              {...register("weight")}
              error={errors.weight?.message}
            />
            <Input
              label={f.height}
              type="number"
              step="0.1"
              {...register("height")}
              error={errors.height?.message}
            />
          </div>
        </section>

        <section>
          <SectionTitle index="A" title={f.assessmentTitle} subtitle={f.assessmentSubtitle} />
          <div className="mt-2 grid grid-cols-1 gap-3">
            <Mkb10Autocomplete value={mkb10} onChange={setMkb10} />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                {f.impressionLabel}
              </label>
              <textarea
                {...register("assessment")}
                rows={2}
                placeholder={f.impressionPlaceholder}
                className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>
        </section>

        <section>
          <SectionTitle index="P" title={f.planTitle} subtitle={f.planSubtitle} />
          <textarea
            {...register("plan")}
            rows={3}
            placeholder={f.planPlaceholder}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </section>
      </form>
    </Modal>
  );
}

function SectionTitle({
  index,
  title,
  subtitle,
}: {
  index: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-xs font-bold text-white">
        {index}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
