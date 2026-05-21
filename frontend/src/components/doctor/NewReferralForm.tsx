"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertTriangle, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { Mkb10Autocomplete } from "@/components/doctor/Mkb10Autocomplete";
import { useT } from "@/hooks/useT";

const REFERRAL_TYPES = ["Општа медицина", "Специјалист", "Лабораторија", "Дијагностика", "Болница"] as const;

const MOCK_PATIENTS = [
  { id: 1001, name: "Марија Петровска" },
  { id: 1002, name: "Александар Стојановски" },
  { id: 1003, name: "Елена Николовска" },
  { id: 1004, name: "Борче Димовски" },
  { id: 1005, name: "Сања Велкоска" },
  { id: 1006, name: "Горан Трајковски" },
  { id: 1007, name: "Ана Коцевска" },
  { id: 1008, name: "Методи Стефановски" },
];

// Allergies relevant for referrals (contrast media, latex, anaesthetics)
const PATIENT_ALLERGIES: Record<number, string | null> = {
  1001: "Пеницилин",
  1002: null,
  1003: "Аспирин, Ибупрофен (НСАИЛ)",
  1004: null,
  1005: null,
  1006: "Сулфонамиди",
  1007: null,
  1008: "Контрастни средства (јодни)",
};

// Allergy warnings specific to referral type
const REFERRAL_ALLERGY_WARNINGS: Array<{
  allergyKeywords: string[];
  referralTypes: string[];
  warning: string;
}> = [
  {
    allergyKeywords: ["контраст", "јодн"],
    referralTypes: ["Дијагностика", "Болница"],
    warning: "Пациентот има алергија на јодни контрастни средства. Предупреди го радиологот и разгледај алтернативна техника (МРИ наместо CT со контраст).",
  },
  {
    allergyKeywords: ["пеницилин", "амоксицилин", "ампицилин"],
    referralTypes: ["Болница", "Специјалист"],
    warning: "Алергија на пеницилин — предупреди ги колегите за можна вкрстена реакција со цефалоспорини при хоспитализација.",
  },
  {
    allergyKeywords: ["аспирин", "ибупрофен", "нсаил", "диклофенак"],
    referralTypes: ["Болница", "Специјалист", "Дијагностика"],
    warning: "Алергија на НСАИЛ — потенцијален ризик при постоперативна аналгезија. Информирај го примателот на упатот.",
  },
  {
    allergyKeywords: ["сулфонамид", "сулфа"],
    referralTypes: ["Болница", "Специјалист"],
    warning: "Алергија на сулфонамиди — информирај ги при евентуална антибиотска терапија или диуретска терапија (фуросемид).",
  },
];

function getAllergyWarning(patientId: number, referralType: string): string | null {
  const allergies = PATIENT_ALLERGIES[patientId];
  if (!allergies) return null;
  const aLow = allergies.toLowerCase();
  for (const rule of REFERRAL_ALLERGY_WARNINGS) {
    const matchesAllergy = rule.allergyKeywords.some((k) => aLow.includes(k));
    const matchesType = rule.referralTypes.includes(referralType);
    if (matchesAllergy && matchesType) return rule.warning;
  }
  return null;
}

const schema = z.object({
  patientId: z.coerce.number().positive("Задолжително"),
  referralType: z.enum(REFERRAL_TYPES, { required_error: "Задолжително" }),
  referredTo: z.string().min(1, "Задолжително").max(200),
  scheduledDate: z.string().min(1, "Задолжително"),
  description: z.string().max(1000).optional(),
  mkb10Code: z.string().optional(),
  mkb10Label: z.string().optional(),
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
}

interface NewReferralFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: (row: ReferralRow) => void;
  existingReferrals?: ReferralRow[];
}

export function NewReferralForm({ open, onClose, onCreated, existingReferrals = [] }: NewReferralFormProps) {
  const t = useT();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      referralType: "Специјалист",
    },
  });

  const watchedPatientId = watch("patientId");
  const watchedType = watch("referralType");

  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);
  const [repeatWarning, setRepeatWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!watchedPatientId) { setAllergyWarning(null); return; }
    const pid = Number(watchedPatientId);
    const allergies = PATIENT_ALLERGIES[pid];
    setAllergyWarning(allergies || null);
  }, [watchedPatientId]);

  useEffect(() => {
    if (!watchedPatientId || !watchedType) { setRepeatWarning(null); return; }
    const pid = Number(watchedPatientId);
    const patient = MOCK_PATIENTS.find((p) => p.id === pid);
    if (!patient) return;

    const recent = existingReferrals.filter(
      (r) => r.patientName === patient.name && r.referralType === watchedType && r.status === "active",
    );
    if (recent.length > 0) {
      const last = recent[recent.length - 1];
      setRepeatWarning(
        `Постои активен упат за ${patient.name} за "${watchedType}" (${last.createdAt}). Провери дали е веќе реализиран пред да издадеш нов.`,
      );
    } else {
      setRepeatWarning(null);
    }
  }, [watchedPatientId, watchedType, existingReferrals]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data: FormData) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === data.patientId);
    const now = format(new Date(), "dd.MM.yyyy");
    const [year, month, day] = data.scheduledDate.split("-");
    const formattedDate = `${day}.${month}.${year}`;

    const row: ReferralRow = {
      id: `UP-${Date.now()}`,
      createdAt: now,
      scheduledDate: formattedDate,
      referredTo: data.referredTo,
      patientName: patient?.name ?? "—",
      referralType: data.referralType,
      mkb10Code: data.mkb10Code ?? "—",
      description: data.description ?? "—",
      status: "active",
    };

    onCreated(row);
    toast.success(t.doctorReferrals.successToast);
    handleClose();
  };

  const contextualAllergyWarning = watchedPatientId && watchedType
    ? getAllergyWarning(Number(watchedPatientId), watchedType)
    : null;

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
          <Button onClick={handleSubmit(onSubmit)}>
            {t.doctorReferrals.newIssueBtn}
          </Button>
        </>
      }
    >
      {/* Allergy banner */}
      {allergyWarning && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">{t.doctorReferrals.allergyTitle}</p>
            <p className="text-amber-700">{allergyWarning}</p>
          </div>
        </div>
      )}

      {/* Contextual allergy + referral type warning */}
      {contextualAllergyWarning && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div>
            <p className="font-semibold text-rose-800">{t.doctorReferrals.warningTitle}</p>
            <p className="text-rose-700">{contextualAllergyWarning}</p>
          </div>
        </div>
      )}

      {/* Repeat referral warning */}
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
        {/* Patient */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorReferrals.newPatientLabel}</label>
          <select
            {...register("patientId")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="">{t.doctorReferrals.newPatientPlaceholder}</option>
            {MOCK_PATIENTS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {errors.patientId && (
            <p className="mt-1 text-xs text-rose-600">{errors.patientId.message}</p>
          )}
        </div>

        {/* Referral type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.doctorReferrals.newTypeLabel}</label>
          <select
            {...register("referralType")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {REFERRAL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          {errors.referralType && (
            <p className="mt-1 text-xs text-rose-600">{errors.referralType.message}</p>
          )}
        </div>

        {/* Referred-to */}
        <div className="md:col-span-2">
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
