// React компонента: форма за издавање рецепт.
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, Info, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { extractErrorMessage } from "@/services/api";
import { prescriptionService } from "@/services/prescription.service";
import type { PrescriptionRoute } from "@/types/api";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

// ── Drug interaction rules ────────────────────────────────────────────────────
interface InteractionRule {
  drugs: [string[], string[]];
  severity: "high" | "moderate";
  message: string;
}

const INTERACTION_RULES: InteractionRule[] = [
  {
    drugs: [
      ["рамиприл", "ramipril", "lisinopril", "enalapril", "perindopril", "ace"],
      ["ibuprofen", "ибупрофен", "диклофенак", "diclofenac", "naproxen", "напроксен", "мелоксикам", "meloxicam"],
    ],
    severity: "high",
    message: "ACE инхибитор + НСАИЛ: намалено антихипертензивно дејство и ризик од акутна бубрежна инсуфициенција. Разгледај алтернатива.",
  },
  {
    drugs: [
      ["аспирин", "aspirin"],
      ["варфарин", "warfarin", "apixaban", "апиксабан", "rivaroxaban", "ривароксабан"],
    ],
    severity: "high",
    message: "Аспирин + антикоагулант: значително зголемен ризик од гастроинтестинално и церебрално крвавење.",
  },
  {
    drugs: [
      ["метформин", "metformin"],
      ["контраст", "contrast", "iodine", "јоден"],
    ],
    severity: "high",
    message: "Метформин + јоден контраст: паузирај метформин 48h пред и по контрастната процедура (ризик од лактатна ацидоза).",
  },
  {
    drugs: [
      ["аторвастатин", "atorvastatin", "симвастатин", "simvastatin", "розувастатин", "rosuvastatin"],
      ["фибрат", "fibrate", "gemfibrozil", "гемфиброзил", "fenofibrate", "фенофибрат"],
    ],
    severity: "moderate",
    message: "Статин + фибрат: зголемен ризик од миопатија и рабдомиолиза. Мониторирај CK.",
  },
  {
    drugs: [
      ["levothyrox", "левотироксин", "thyroxin"],
      ["calcium", "калциум", "iron", "железо", "omeprazole", "омепразол", "esomeprazole", "езомепразол", "pantoprazole"],
    ],
    severity: "moderate",
    message: "Левотироксин + калциум/железо/ИПП: намалена апсорпција. Препишувај со минимум 4 часа разлика.",
  },
  {
    drugs: [
      ["digoxin", "дигоксин"],
      ["amiodarone", "амиодарон", "clarithromycin", "кларитромицин", "verapamil", "верапамил"],
    ],
    severity: "high",
    message: "Дигоксин + амиодарон/кларитромицин/верапамил: ризик од дигоксинска токсичност. Намали доза и мониторирај нивоа.",
  },
  {
    drugs: [
      ["ciprofloxacin", "ципрофлоксацин", "levofloxacin", "левофлоксацин"],
      ["theophylline", "теофилин"],
    ],
    severity: "high",
    message: "Флуорохинолон + теофилин: ризик од теофилинска токсичност (конвулзии, аритмии). Намали доза на теофилин.",
  },
  {
    drugs: [
      ["methotrexate", "метотрексат"],
      ["ibuprofen", "ибупрофен", "diclofenac", "диклофенак", "naproxen", "напроксен"],
    ],
    severity: "high",
    message: "Метотрексат + НСАИЛ: ризик од тешка хематолошка и хепатична токсичност. Избегнувај ја комбинацијата.",
  },
  {
    drugs: [
      ["sildenafil", "силденафил", "tadalafil", "тадалафил"],
      ["nitro", "нитро", "isosorbide", "изосорбид"],
    ],
    severity: "high",
    message: "PDE5 инхибитор + нитрат: тешка и потенцијално фатална хипотензија. Апсолутна контраиндикација.",
  },
  {
    drugs: [
      ["lithium", "литиум"],
      ["ibuprofen", "ибупрофен", "diclofenac", "диклофенак", "naproxen", "напроксен", "рамиприл", "ramipril", "lisinopril"],
    ],
    severity: "high",
    message: "Литиум + НСАИЛ/ACE инхибитори: намалено бубрежно излачување на литиум → токсичност. Мониторирај нивоа на литиум.",
  },
];

function checkDrugInteractions(
  newMed: string,
  existing: string[],
): Array<{ severity: "high" | "moderate"; message: string }> {
  if (!newMed.trim() || !existing.length) return [];
  const nLow = newMed.toLowerCase();
  const eLow = existing.join(" ").toLowerCase();
  const warnings: Array<{ severity: "high" | "moderate"; message: string }> = [];

  for (const rule of INTERACTION_RULES) {
    const [gA, gB] = rule.drugs;
    const nA = gA.some((k) => nLow.includes(k));
    const nB = gB.some((k) => nLow.includes(k));
    const eA = gA.some((k) => eLow.includes(k));
    const eB = gB.some((k) => eLow.includes(k));
    if ((nA && eB) || (nB && eA)) warnings.push({ severity: rule.severity, message: rule.message });
  }
  return warnings;
}

// ── Prescription templates ───────────────────────────────────────────────────
interface Template {
  name: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  route: PrescriptionRoute;
  durationDays: number;
  instructions?: string;
}

const TEMPLATES: Template[] = [
  { name: "Рамиприл 5mg", medicationName: "Рамиприл",    dosage: "5mg",   frequency: "1x дневно наутро",         route: "ORAL", durationDays: 90 },
  { name: "Метформин 500", medicationName: "Метформин",   dosage: "500mg", frequency: "2x дневно со оброк",       route: "ORAL", durationDays: 90 },
  { name: "Аторвастатин",  medicationName: "Аторвастатин",dosage: "20mg",  frequency: "1x навечер",               route: "ORAL", durationDays: 90 },
  { name: "Аспирин 100",   medicationName: "Аспирин",     dosage: "100mg", frequency: "1x дневно со оброк",       route: "ORAL", durationDays: 90, instructions: "Не земај на гладно" },
  { name: "Левотироксин",  medicationName: "Levothyroxin",dosage: "50mcg", frequency: "1x наутро на гладно 30мин пред оброк", route: "ORAL", durationDays: 90 },
  { name: "Омепразол 20",  medicationName: "Омепразол",   dosage: "20mg",  frequency: "1x наутро пред оброк",     route: "ORAL", durationDays: 28 },
  { name: "Амоксицилин",   medicationName: "Амоксицилин", dosage: "500mg", frequency: "3x дневно на секои 8h",    route: "ORAL", durationDays: 7,  instructions: "Заврши ја целата серија" },
  { name: "Иbuprofen 400", medicationName: "Ибупрофен",   dosage: "400mg", frequency: "3x дневно по потреба",     route: "ORAL", durationDays: 5,  instructions: "Зема со оброк. Не повеќе од 5 дена." },
];

// ── Form schema ───────────────────────────────────────────────────────────────
const ROUTES: PrescriptionRoute[] = ["ORAL", "INJECTION", "TOPICAL", "INHALED", "IV", "IM", "SC"];

const schema = z.object({
  medicationName: z.string().min(1, "Задолжително").max(255),
  dosage: z.string().min(1, "Задолжително").max(100),
  frequency: z.string().min(1, "Задолжително").max(100),
  durationDays: z.coerce.number().int().positive().optional(),
  quantity: z.coerce.number().int().positive().optional(),
  route: z.enum(["ORAL", "INJECTION", "TOPICAL", "INHALED", "IV", "IM", "SC"]).optional(),
  refillsAllowed: z.coerce.number().int().min(0).max(12).optional(),
  startDate: z.string().min(1, "Задолжително"),
  instructions: z.string().max(4000).optional(),
});

type FormData = z.infer<typeof schema>;

interface PrescriptionFormProps {
  open: boolean;
  onClose: () => void;
  patientId: number;
  patientName: string;
  patientAllergies?: string | null;
  activeMedications?: string[];
}

export function PrescriptionForm({
  open,
  onClose,
  patientId,
  patientName,
  patientAllergies,
  activeMedications = [],
}: PrescriptionFormProps) {
  const t = useT();
  const qc = useQueryClient();
  const [showTemplates, setShowTemplates] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      route: "ORAL",
      refillsAllowed: 0,
    },
  });

  const watchedMed = useWatch({ control, name: "medicationName" }) ?? "";
  const [interactions, setInteractions] = useState<Array<{ severity: "high" | "moderate"; message: string }>>([]);

  useEffect(() => {
    setInteractions(checkDrugInteractions(watchedMed, activeMedications));
  }, [watchedMed, activeMedications]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      prescriptionService.issue({
        patientId,
        medicationName: data.medicationName,
        dosage: data.dosage,
        frequency: data.frequency,
        durationDays: data.durationDays,
        quantity: data.quantity,
        route: data.route,
        instructions: data.instructions || undefined,
        startDate: data.startDate,
        refillsAllowed: data.refillsAllowed ?? 0,
      }),
    onSuccess: () => {
      toast.success(t.prescriptionForm.successToast);
      qc.invalidateQueries({ queryKey: ["patient", patientId, "prescriptions"] });
      handleClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleClose = () => {
    reset();
    setShowTemplates(false);
    onClose();
  };

  const applyTemplate = (t: Template) => {
    setValue("medicationName", t.medicationName);
    setValue("dosage", t.dosage);
    setValue("frequency", t.frequency);
    setValue("route", t.route);
    setValue("durationDays", t.durationDays);
    if (t.instructions) setValue("instructions", t.instructions);
    setShowTemplates(false);
  };

  const hasAllergies =
    !!patientAllergies &&
    patientAllergies.toLowerCase() !== "none known" &&
    patientAllergies !== "—";

  const hasHighInteraction = interactions.some((w) => w.severity === "high");

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t.prescriptionForm.title}
      description={`${t.doctorReferrals.newPatientLabel}: ${patientName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            loading={mutation.isPending}
            className={hasHighInteraction ? "bg-amber-600 hover:bg-amber-700" : undefined}
          >
            {hasHighInteraction ? t.prescriptionForm.issueWithWarningBtn : t.prescriptionForm.issueBtn}
          </Button>
        </>
      }
    >
      {/* Allergy banner */}
      {hasAllergies && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">{t.prescriptionForm.allergyTitle}</p>
            <p className="text-amber-700">{patientAllergies}</p>
          </div>
        </div>
      )}

      {/* Drug interaction banner */}
      {interactions.length > 0 && (
        <div className="mb-4 space-y-2">
          {interactions.map((w, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                w.severity === "high"
                  ? "border-rose-200 bg-rose-50"
                  : "border-amber-200 bg-amber-50",
              )}
            >
              <AlertTriangle
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  w.severity === "high" ? "text-rose-600" : "text-amber-600",
                )}
              />
              <div>
                <p
                  className={cn(
                    "font-semibold",
                    w.severity === "high" ? "text-rose-800" : "text-amber-800",
                  )}
                >
                  {w.severity === "high" ? t.prescriptionForm.interactionHigh : t.prescriptionForm.interactionModerate}
                </p>
                <p className={w.severity === "high" ? "text-rose-700" : "text-amber-700"}>
                  {w.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active medications info */}
      {activeMedications.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <div>
            <p className="font-semibold text-blue-800">{t.prescriptionForm.currentTherapy}</p>
            <p className="text-blue-700">{activeMedications.join(", ")}</p>
          </div>
        </div>
      )}

      {/* Templates */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowTemplates((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <Zap className="h-3.5 w-3.5" />
          {t.prescriptionForm.templatesLabel}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showTemplates && "rotate-180")} />
        </button>
        {showTemplates && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => applyTemplate(t)}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition-all hover:border-emerald-400 hover:bg-emerald-100"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <div className="md:col-span-2">
          <Input
            label={t.prescriptionForm.medicationLabel}
            placeholder="пр. Аторвастатин"
            {...register("medicationName")}
            error={errors.medicationName?.message}
          />
        </div>
        <Input
          label={t.prescriptionForm.doseLabel}
          placeholder="20 mg"
          {...register("dosage")}
          error={errors.dosage?.message}
        />
        <Input
          label={t.prescriptionForm.frequencyLabel}
          placeholder="1x навечер"
          {...register("frequency")}
          error={errors.frequency?.message}
        />
        <Input
          label={t.prescriptionForm.durationLabel}
          type="number"
          {...register("durationDays")}
          error={errors.durationDays?.message}
        />
        <Input
          label={t.prescriptionForm.quantityLabel}
          type="number"
          {...register("quantity")}
          error={errors.quantity?.message}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.prescriptionForm.routeLabel}</label>
          <select
            {...register("route")}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          >
            {ROUTES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <Input
          label={t.prescriptionForm.refillsLabel}
          type="number"
          min={0}
          max={12}
          {...register("refillsAllowed")}
          error={errors.refillsAllowed?.message}
        />
        <Input
          label={t.prescriptionForm.startDateLabel}
          type="date"
          {...register("startDate")}
          error={errors.startDate?.message}
        />
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">{t.prescriptionForm.instructionsLabel}</label>
          <textarea
            {...register("instructions")}
            rows={3}
            placeholder="Земај со оброк. Избегнувај грејпфрут. Заврши ја целата серија."
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
      </form>
    </Modal>
  );
}
