// Страница (Next.js): профил — дел за пациент.
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Droplet, Pencil, X } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { CompleteProfilePrompt } from "@/components/patient/CompleteProfilePrompt";
import { useAuth } from "@/hooks/useAuth";
import { usePatientProfile } from "@/hooks/usePatient";
import { patientService } from "@/services/patient.service";
import type { BloodType, Gender } from "@/types/api";
import { cn } from "@/utils/cn";

const schema = z.object({
  dateOfBirth:       z.string().optional(),
  gender:            z.enum(["M", "F", "O"]).optional(),
  bloodType:         z.enum(["A_POS","A_NEG","B_POS","B_NEG","AB_POS","AB_NEG","O_POS","O_NEG"]).optional(),
  allergies:         z.string().max(2000).optional(),
  chronicConditions: z.string().max(2000).optional(),
  insuranceProvider: z.string().max(255).optional(),
  insuranceNumber:   z.string().max(100).optional(),
  emergencyContact:  z.string().max(255).optional(),
  emergencyPhone:    z.string().max(20).optional(),
  address:           z.string().max(500).optional(),
  city:              z.string().max(100).optional(),
  postalCode:        z.string().max(20).optional(),
  country:           z.string().max(100).optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const profile = usePatientProfile();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      patientService.update(profile.data!.id, {
        ...data,
        gender: data.gender as Gender | undefined,
        bloodType: data.bloodType as BloodType | undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patient", "me"] });
      setEditing(false);
    },
  });

  if (profile.isLoading) return <Skeleton className="h-64" />;
  if (profile.data === null) return <CompleteProfilePrompt />;
  if (!profile.data || !user) return <EmptyState title="Профилот не е достапен" />;

  const p = profile.data;

  const startEditing = () => {
    reset({
      dateOfBirth:       p.dateOfBirth ?? "",
      gender:            (p.gender as FormData["gender"] | null) ?? undefined,
      bloodType:         (p.bloodType as FormData["bloodType"] | null) ?? undefined,
      allergies:         p.allergies ?? "",
      chronicConditions: p.chronicConditions ?? "",
      insuranceProvider: p.insuranceProvider ?? "",
      insuranceNumber:   p.insuranceNumber ?? "",
      emergencyContact:  p.emergencyContact ?? "",
      emergencyPhone:    p.emergencyPhone ?? "",
      address:           p.address ?? "",
      city:              p.city ?? "",
      postalCode:        p.postalCode ?? "",
      country:           p.country ?? "",
    });
    setEditing(true);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Мој профил</h1>
          <p className="text-sm text-slate-500">Лични и медицински информации.</p>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" /> Измени
          </button>
        )}
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700">Основни податоци</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Field label="Име и презиме" value={`${user.firstName} ${user.lastName}`} />
          <Field label="Е-пошта" value={user.email} />
          <Field label="Телефон" value={user.phoneNumber ?? "—"} />
        </dl>
      </Card>

      {editing ? (
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">Медицински информации</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  <X className="h-3.5 w-3.5" /> Откажи
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-400 disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" />
                  {isSubmitting ? "Се зачувува…" : "Зачувај"}
                </button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EditField label="Датум на раѓање">
                <input type="date" {...register("dateOfBirth")} className={inputCls} />
              </EditField>
              <EditField label="Пол">
                <select {...register("gender")} className={inputCls}>
                  <option value="">—</option>
                  <option value="M">Машки</option>
                  <option value="F">Женски</option>
                  <option value="O">Друго</option>
                </select>
              </EditField>
              <EditField label="Крвна група">
                <select {...register("bloodType")} className={inputCls}>
                  <option value="">—</option>
                  {(["A_POS","A_NEG","B_POS","B_NEG","AB_POS","AB_NEG","O_POS","O_NEG"] as const).map((bt) => (
                    <option key={bt} value={bt}>
                      {bt.replace("_POS", "+").replace("_NEG", "−")}
                    </option>
                  ))}
                </select>
              </EditField>
              <EditField label="Град">
                <input {...register("city")} className={inputCls} />
              </EditField>
              <EditField label="Адреса" fullWidth>
                <input {...register("address")} className={inputCls} />
              </EditField>
              <EditField label="Поштенски број">
                <input {...register("postalCode")} className={inputCls} />
              </EditField>
              <EditField label="Земја">
                <input {...register("country")} className={inputCls} />
              </EditField>
              <EditField label="Алергии" fullWidth>
                <textarea {...register("allergies")} rows={2} className={inputCls} />
              </EditField>
              <EditField label="Хронични заболувања" fullWidth>
                <textarea {...register("chronicConditions")} rows={2} className={inputCls} />
              </EditField>
              <EditField label="Осигурувач">
                <input {...register("insuranceProvider")} className={inputCls} />
              </EditField>
              <EditField label="Бр. на осигурување">
                <input {...register("insuranceNumber")} className={inputCls} />
              </EditField>
              <EditField label="Контакт при итност">
                <input {...register("emergencyContact")} className={inputCls} />
              </EditField>
              <EditField label="Тел. при итност">
                <input {...register("emergencyPhone")} className={inputCls} />
              </EditField>
            </div>
          </Card>
        </form>
      ) : (
        <Card>
          <h2 className="text-sm font-semibold text-slate-700">Медицински информации</h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            <Field label="Датум на раѓање"     value={p.dateOfBirth ?? "—"} />
            <Field label="Пол"                  value={p.gender === "M" ? "Машки" : p.gender === "F" ? "Женски" : p.gender === "O" ? "Друго" : "—"} />
            <div>
              <dt className="text-xs text-slate-500">Крвна група</dt>
              <dd className="mt-0.5"><BloodTypeBadge value={p.bloodType} /></dd>
            </div>
            <Field label="Град"                  value={p.city ?? "—"} />
            <Field label="Адреса"                value={p.address ?? "—"} />
            <Field label="Алергии"               value={p.allergies ?? "—"} />
            <Field label="Хронични заболувања"   value={p.chronicConditions ?? "—"} />
            <Field label="Осигурувач"            value={p.insuranceProvider ?? "—"} />
            <Field label="Контакт при итност"    value={p.emergencyContact ?? "—"} />
            <Field label="Тел. при итност"       value={p.emergencyPhone ?? "—"} />
          </dl>
        </Card>
      )}
    </div>
  );
}

function BloodTypeBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const isNeg = value.endsWith("_NEG");
  const label = value.replace("_POS", "+").replace("_NEG", "−");
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
      isNeg ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"
    )}>
      <Droplet className={cn("h-3 w-3", isNeg ? "text-blue-500" : "text-red-500")} />
      {label}
    </span>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function EditField({ label, children, fullWidth }: {
  label: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={cn(fullWidth && "sm:col-span-2")}>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}
