// Страница (Next.js): поставки — дел за матичен лекар (GP).
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Check, Pencil, X } from "lucide-react";
import { Card } from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { PageBanner } from "@/components/layout/PageBanner";
import { useAuth } from "@/hooks/useAuth";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { doctorService } from "@/services/doctor.service";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

const schema = z.object({
  qualification:     z.string().max(500).optional(),
  experienceYears:   z.coerce.number().nonnegative().optional().or(z.literal("")),
  officeNumber:      z.string().max(50).optional(),
  // Печати се до потписот на секој ФЗОМ образец.
  facsimileNumber:   z.string().max(20).optional(),
  consultationFee:   z.coerce.number().nonnegative().optional().or(z.literal("")),
  availabilityHours: z.string().max(255).optional(),
  bio:               z.string().max(5000).optional(),
});

type FormData = z.infer<typeof schema>;

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";

export default function DoctorSettingsPage() {
  const { user }  = useAuth();
  const profile   = useDoctorProfile();
  const qc        = useQueryClient();
  const t         = useT();
  const ds        = t.doctorSettings;
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      doctorService.updateMe({
        qualification:     data.qualification || undefined,
        experienceYears:   data.experienceYears === "" ? undefined : (data.experienceYears as number | undefined),
        officeNumber:      data.officeNumber || undefined,
        facsimileNumber:   data.facsimileNumber || undefined,
        consultationFee:   data.consultationFee === "" ? undefined : (data.consultationFee as number | undefined),
        availabilityHours: data.availabilityHours || undefined,
        bio:               data.bio || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctor", "me"] });
      toast.success(ds.saveSuccess);
      setEditing(false);
    },
    onError: () => toast.error(ds.saveError),
  });

  const startEditing = () => {
    const p = profile.data;
    reset({
      qualification:     p?.qualification ?? "",
      experienceYears:   p?.experienceYears ?? "",
      officeNumber:      p?.officeNumber ?? "",
      facsimileNumber:   p?.facsimileNumber ?? "",
      consultationFee:   p?.consultationFee ?? "",
      availabilityHours: p?.availabilityHours ?? "",
      bio:               p?.bio ?? "",
    });
    setEditing(true);
  };

  return (
    <>
      <PageBanner
        title={t.doctorNav.settings}
        breadcrumb={[{ label: t.doctorNav.settings }]}
      />

      <div className="mx-auto max-w-4xl px-6 py-6 space-y-6">
        {profile.isLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <>
            {/* Read-only identity card */}
            <Card>
              <h2 className="text-sm font-semibold text-slate-700">{ds.basicData}</h2>
              <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                <Field label={ds.fullName}       value={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`} />
                <Field label={ds.email}          value={user?.email ?? "—"} />
                <Field label={ds.licenseNumber}  value={profile.data?.licenseNumber ?? "—"} />
                <Field label={ds.specialization} value={profile.data?.specialization ? (t.specialties[profile.data.specialization] ?? profile.data.specialization) : "—"} />
                <Field label={ds.hospital}       value={profile.data?.hospitalName ?? "—"} />
                <Field label={ds.city}           value={profile.data?.hospitalCity ?? "—"} />
              </dl>
            </Card>

            {/* Editable clinical details */}
            {editing ? (
              <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
                <Card>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700">{ds.clinicalDetails}</h2>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        <X className="h-3.5 w-3.5" /> {t.common.cancel}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-push inline-flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:opacity-60"
                      >
                        <Check className="h-3.5 w-3.5" />
                        {isSubmitting ? t.common.saving : t.common.save}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <EditField label={ds.qualification} fullWidth>
                      <input {...register("qualification")} className={inputCls} />
                    </EditField>
                    <EditField label={ds.experienceYears}>
                      <input type="number" min={0} {...register("experienceYears")} className={inputCls} />
                    </EditField>
                    <EditField label="Факсимил">
                      <input {...register("facsimileNumber")} className={inputCls} />
                    </EditField>
                    <EditField label={ds.officeNumber}>
                      <input {...register("officeNumber")} className={inputCls} />
                    </EditField>
                    <EditField label={ds.consultationFee}>
                      <input type="number" min={0} step="0.01" {...register("consultationFee")} className={inputCls} />
                    </EditField>
                    <EditField label={ds.workingHours} fullWidth>
                      <input
                        {...register("availabilityHours")}
                        placeholder={ds.workingHoursPlaceholder}
                        className={inputCls}
                      />
                    </EditField>
                    <EditField label={ds.bio} fullWidth>
                      <textarea {...register("bio")} rows={4} className={inputCls} />
                    </EditField>
                  </div>
                </Card>
              </form>
            ) : (
              <Card>
                <div className="flex items-start justify-between">
                  <h2 className="text-sm font-semibold text-slate-700">{ds.clinicalDetails}</h2>
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {t.common.edit}
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                  <Field label={ds.qualification}        value={profile.data?.qualification ?? "—"} />
                  <Field label={ds.experienceYears}      value={profile.data?.experienceYears?.toString() ?? "—"} />
                  <Field label={ds.officeNumber}         value={profile.data?.officeNumber ?? "—"} />
                  <Field
                    label={ds.consultationFeeDisplay}
                    value={profile.data?.consultationFee ? `${profile.data.consultationFee} ${ds.currency}` : "—"}
                  />
                  <Field label={ds.workingHours}         value={profile.data?.availabilityHours ?? "—"} />
                  {profile.data?.bio && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">{ds.bio}</dt>
                      <dd className="mt-0.5 text-sm text-slate-900 whitespace-pre-line">{profile.data.bio}</dd>
                    </div>
                  )}
                </dl>
              </Card>
            )}
          </>
        )}
      </div>
    </>
  );
}

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
