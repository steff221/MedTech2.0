"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Info, Search } from "lucide-react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Mkb10Autocomplete } from "@/components/doctor/Mkb10Autocomplete";
import { useT } from "@/hooks/useT";
import { patientService } from "@/services/patient.service";
import { referralService } from "@/services/referral.service";
import type { PatientResponse, ReferralResponse, ReferralType } from "@/types/api";

const REFERRAL_TYPES: { value: ReferralType; label: string }[] = [
  { value: "GENERAL_MEDICINE", label: "Општа медицина" },
  { value: "SPECIALIST",       label: "Специјалист" },
  { value: "LABORATORY",       label: "Лабораторија" },
  { value: "DIAGNOSTICS",      label: "Дијагностика" },
  { value: "HOSPITAL",         label: "Болница" },
];

const REFERRAL_TYPE_VALUES = REFERRAL_TYPES.map((t) => t.value) as [ReferralType, ...ReferralType[]];

const ALLERGY_RULES: Array<{
  keywords: string[];
  types: ReferralType[];
  warning: string;
}> = [
  {
    keywords: ["контраст", "јодн"],
    types: ["DIAGNOSTICS", "HOSPITAL"],
    warning:
      "Пациентот има алергија на јодни контрастни средства. Предупреди го радиологот и разгледај алтернативна техника (МРИ наместо CT со контраст).",
  },
  {
    keywords: ["пеницилин", "амоксицилин", "ампицилин"],
    types: ["HOSPITAL", "SPECIALIST"],
    warning:
      "Алергија на пеницилин — предупреди ги колегите за можна вкрстена реакција со цефалоспорини при хоспитализација.",
  },
  {
    keywords: ["аспирин", "ибупрофен", "нсаил", "диклофенак"],
    types: ["HOSPITAL", "SPECIALIST", "DIAGNOSTICS"],
    warning:
      "Алергија на НСАИЛ — потенцијален ризик при постоперативна аналгезија. Информирај го примателот на упатот.",
  },
  {
    keywords: ["сулфонамид", "сулфа"],
    types: ["HOSPITAL", "SPECIALIST"],
    warning:
      "Алергија на сулфонамиди — информирај ги при евентуална антибиотска терапија или диуретска терапија (фуросемид).",
  },
];

function getAllergyWarning(allergies: string | null, type: ReferralType): string | null {
  if (!allergies) return null;
  const low = allergies.toLowerCase();
  for (const rule of ALLERGY_RULES) {
    if (rule.types.includes(type) && rule.keywords.some((k) => low.includes(k))) {
      return rule.warning;
    }
  }
  return null;
}

const schema = z.object({
  patientId:     z.coerce.number({ invalid_type_error: "Задолжително" }).positive("Задолжително"),
  referralType:  z.enum(REFERRAL_TYPE_VALUES, { required_error: "Задолжително" }),
  referredTo:    z.string().min(1, "Задолжително").max(200),
  scheduledDate: z.string().min(1, "Задолжително"),
  description:   z.string().max(1000).optional(),
  mkb10Code:     z.string().optional(),
  mkb10Label:    z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export interface ReferralRow {
  id: string;
  createdAt: string;
  scheduledDate: string;
  referredTo: string;
  patientName: string;
  referralType: string;
  mkb10Code: string;
  description: string;
  status: "active" | "completed" | "cancelled";
  outcomeNote?: string;
  outcomeDate?: string;
  backendId?: number;
}

export function referralResponseToRow(r: ReferralResponse): ReferralRow {
  const [y, m, d] = r.scheduledDate.split("-");
  return {
    id:            r.referralNumber,
    backendId:     r.id,
    createdAt:     format(new Date(r.createdAt), "dd.MM.yyyy"),
    scheduledDate: `${d}.${m}.${y}`,
    referredTo:    r.referredTo,
    patientName:   r.patientName,
    referralType:  REFERRAL_TYPES.find((t) => t.value === r.referralType)?.label ?? r.referralType,
    mkb10Code:     r.mkb10Code ?? "—",
    description:   r.description ?? "—",
    status:        r.status === "ACTIVE" ? "active" : r.status === "COMPLETED" ? "completed" : "cancelled",
    outcomeNote:   r.outcomeNote ?? undefined,
    outcomeDate:   r.outcomeDate
      ? (() => { const [oy, om, od] = r.outcomeDate!.split("-"); return `${od}.${om}.${oy}`; })()
      : undefined,
  };
}

interface NewReferralFormProps {
  open:      boolean;
  onClose:   () => void;
  onCreated: (row: ReferralRow) => void;
  existingReferrals?: ReferralRow[];
}

export function NewReferralForm({ open, onClose, onCreated, existingReferrals = [] }: NewReferralFormProps) {
  const t = useT();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      referralType:  "SPECIALIST",
    },
  });

  const watchedType = watch("referralType");

  const patientQuery = useQuery({
    queryKey: ["referral-patient-search", patientSearch],
    queryFn:  () => patientService.search(patientSearch, 0, 10),
    enabled:  patientSearch.length >= 2 && !selectedPatient,
  });

  const createMutation = useMutation({
    mutationFn: referralService.create,
    onSuccess: (saved) => {
      onCreated(referralResponseToRow(saved));
      toast.success(t.doctorReferrals.successToast);
      handleClose();
    },
    onError: () => {
      toast.error("Грешка при издавање на упат.");
    },
  });

  const handleClose = () => {
    reset();
    setPatientSearch("");
    setSelectedPatient(null);
    onClose();
  };

  const selectPatient = (p: PatientResponse) => {
    setSelectedPatient(p);
    setValue("patientId", p.id);
    setPatientSearch(`${p.firstName} ${p.lastName}`);
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      patientId:     data.patientId,
      referralType:  data.referralType,
      referredTo:    data.referredTo,
      mkb10Code:     data.mkb10Code || undefined,
      description:   data.description || undefined,
      scheduledDate: data.scheduledDate,
    });
  };

  const allergyWarning =
    selectedPatient && watchedType
      ? getAllergyWarning(selectedPatient.allergies, watchedType)
      : null;

  const repeatWarning = (() => {
    if (!selectedPatient || !watchedType) return null;
    const typeLabel = REFERRAL_TYPES.find((t) => t.value === watchedType)?.label ?? watchedType;
    const name = `${selectedPatient.firstName} ${selectedPatient.lastName}`;
    const dupe = existingReferrals.find(
      (r) => r.patientName === name && r.referralType === typeLabel && r.status === "active",
    );
    return dupe
      ? `Постои активен упат за ${name} за "${typeLabel}" (${dupe.createdAt}). Провери дали е веќе реализиран пред да издадеш нов.`
      : null;
  })();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t.doctorReferrals.newTitle}
      description={t.doctorReferrals.newDesc}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Се зачувува…" : t.doctorReferrals.newIssueBtn}
          </Button>
        </>
      }
    >
      {selectedPatient?.allergies && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">{t.doctorReferrals.allergyTitle}</p>
            <p className="text-amber-700">{selectedPatient.allergies}</p>
          </div>
        </div>
      )}

      {allergyWarning && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-800">{t.doctorReferrals.warningTitle}</p>
            <p className="text-rose-700">{allergyWarning}</p>
          </div>
        </div>
      )}

      {repeatWarning && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div>
            <p className="font-semibold text-blue-800">{t.doctorReferrals.repeatTitle}</p>
            <p className="text-blue-700">{repeatWarning}</p>
          </div>
        </div>
      )}

      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        {/* Patient live search */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t.doctorReferrals.newPatientLabel}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                if (!e.target.value) setSelectedPatient(null);
              }}
              placeholder={t.doctorReferrals.newPatientPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          {patientSearch.length >= 2 && !selectedPatient && (
            <div className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {patientQuery.isLoading && (
                <p className="px-3 py-2 text-sm text-slate-400">Се вчитува…</p>
              )}
              {patientQuery.data?.content.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">Нема резултати.</p>
              )}
              {patientQuery.data?.content.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectPatient(p)}
                  className="flex w-full flex-col px-3 py-2 text-left hover:bg-emerald-50"
                >
                  <span className="text-sm font-medium text-slate-800">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-xs text-slate-500">{p.email}</span>
                </button>
              ))}
            </div>
          )}
          <input type="hidden" {...register("patientId")} />
          {errors.patientId && (
            <p className="mt-1 text-xs text-rose-600">{errors.patientId.message}</p>
          )}
        </div>

        {/* Referral type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t.doctorReferrals.newTypeLabel}
          </label>
          <select
            {...register("referralType")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {REFERRAL_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>{rt.label}</option>
            ))}
          </select>
          {errors.referralType && (
            <p className="mt-1 text-xs text-rose-600">{errors.referralType.message}</p>
          )}
        </div>

        {/* Referred-to */}
        <div>
          <Input
            label={t.doctorReferrals.newReferredToLabel}
            placeholder="пр. Кардиолог, ЈЗУ Клиничка болница"
            {...register("referredTo")}
            error={errors.referredTo?.message}
          />
        </div>

        {/* MKB-10 */}
        <div className="md:col-span-2">
          <Controller
            name="mkb10Code"
            control={control}
            render={({ field }) => (
              <Mkb10Autocomplete
                label="МКБ10 Дијагноза"
                value={
                  field.value
                    ? { code: field.value, label: (control._formValues as Record<string, string>).mkb10Label ?? "" }
                    : null
                }
                onChange={(v) => {
                  field.onChange(v?.code ?? "");
                  (control._formValues as Record<string, string>).mkb10Label = v?.label ?? "";
                }}
              />
            )}
          />
        </div>

        {/* Scheduled date */}
        <Input
          label={t.doctorReferrals.newDateLabel}
          type="date"
          {...register("scheduledDate")}
          error={errors.scheduledDate?.message}
        />

        {/* Description */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {t.doctorReferrals.newDescLabel}
          </label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Краток клинички опис, причина за упатувањето…"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      </form>
    </Modal>
  );
}
