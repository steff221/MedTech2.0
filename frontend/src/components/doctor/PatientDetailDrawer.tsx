"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  Droplet,
  FileText,
  Pill,
  Plus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Badge, appointmentStatusTone } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { MedicalRecordForm } from "./MedicalRecordForm";
import { PrescriptionForm } from "./PrescriptionForm";
import { patientService } from "@/services/patient.service";
import type {
  AppointmentResponse,
  MedicalRecordResponse,
  PatientResponse,
  PrescriptionResponse,
} from "@/types/api";
import { cn } from "@/utils/cn";
import { formatDate, formatTime, initials } from "@/utils/format";

// ── Mock data for demo patients (IDs 1001–1008) ──────────────────────────────
const MOCK_PATIENT_PROFILES: Record<number, PatientResponse> = {
  1001: { id: 1001, userId: 1001, email: "marija.petrovska@mail.mk", firstName: "Марија", lastName: "Петровска", phoneNumber: "+389 70 123 456", dateOfBirth: "1985-03-12", gender: "F", bloodType: "A_POS", allergies: "Пеницилин", chronicConditions: "Хипертензија", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1001-2024", emergencyContact: "Петар Петровски", emergencyPhone: "+389 70 999 001", address: "ул. Партизанска 14", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1002: { id: 1002, userId: 1002, email: "aleksandar.stojanovski@mail.mk", firstName: "Александар", lastName: "Стојановски", phoneNumber: "+389 71 234 567", dateOfBirth: "1972-07-28", gender: "M", bloodType: "O_POS", allergies: null, chronicConditions: "Дијабет тип 2, Дислипидемија", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1002-2024", emergencyContact: "Ана Стојановска", emergencyPhone: "+389 71 888 002", address: "ул. Борис Трајковски 7", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1003: { id: 1003, userId: 1003, email: "elena.nikolovska@mail.mk", firstName: "Елена", lastName: "Николовска", phoneNumber: "+389 72 345 678", dateOfBirth: "1990-11-05", gender: "F", bloodType: "B_POS", allergies: "Аспирин, Ибупрофен", chronicConditions: null, insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1003-2024", emergencyContact: "Марко Николовски", emergencyPhone: "+389 72 777 003", address: "ул. Загреб 21", city: "Битола", postalCode: "7000", country: "Македонија" },
  1004: { id: 1004, userId: 1004, email: "borce.dimovski@mail.mk", firstName: "Борче", lastName: "Димовски", phoneNumber: "+389 75 456 789", dateOfBirth: "1968-01-19", gender: "M", bloodType: "AB_NEG", allergies: null, chronicConditions: "Дијабет тип 2, Хипертензија, Гојазност", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1004-2024", emergencyContact: "Весна Димовска", emergencyPhone: "+389 75 666 004", address: "ул. Митрополит Теодосиј Гологанов 33", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1005: { id: 1005, userId: 1005, email: "sanja.velkoska@mail.mk", firstName: "Сања", lastName: "Велкоска", phoneNumber: "+389 76 567 890", dateOfBirth: "1995-06-22", gender: "F", bloodType: "A_NEG", allergies: null, chronicConditions: null, insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1005-2024", emergencyContact: null, emergencyPhone: null, address: "ул. Димитар Влахов 5", city: "Охрид", postalCode: "6000", country: "Македонија" },
  1006: { id: 1006, userId: 1006, email: "goran.trajkovski@mail.mk", firstName: "Горан", lastName: "Трајковски", phoneNumber: "+389 77 678 901", dateOfBirth: "1980-09-14", gender: "M", bloodType: "O_NEG", allergies: "Сулфонамиди", chronicConditions: "Хронична бубрежна болест стадиум 2", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1006-2024", emergencyContact: "Снежана Трајковска", emergencyPhone: "+389 77 555 006", address: "ул. Васко Карангелевски 9", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1007: { id: 1007, userId: 1007, email: "ana.kocevska@mail.mk", firstName: "Ана", lastName: "Коцевска", phoneNumber: "+389 78 789 012", dateOfBirth: "1988-04-30", gender: "F", bloodType: "B_NEG", allergies: null, chronicConditions: "Хипотиреоза", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1007-2024", emergencyContact: "Ристе Коцевски", emergencyPhone: "+389 78 444 007", address: "ул. Смиљаничка 17", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1008: { id: 1008, userId: 1008, email: "metodi.stefanovski@mail.mk", firstName: "Методи", lastName: "Стефановски", phoneNumber: "+389 79 890 123", dateOfBirth: "1963-12-08", gender: "M", bloodType: "A_POS", allergies: "Контрастни средства", chronicConditions: "ХОББ, Артериска хипертензија", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1008-2024", emergencyContact: "Лилјана Стефановска", emergencyPhone: "+389 79 333 008", address: "ул. Мајка Тереза 44", city: "Скопје", postalCode: "1000", country: "Македонија" },
};

const MOCK_RECORDS: Record<number, MedicalRecordResponse[]> = {
  1001: [
    { id: 101, patientId: 1001, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 2, diagnosis: "Есенцијална хипертензија", mkb10Code: "I10", clinicalNotes: "Пациентот се жали на главоболка и зашеметеност. КП: 155/95 mmHg. Препишана терапија со ACE инхибитор.", vitalSigns: null, bloodPressure: "155/95", heartRate: 88, temperature: 36.7, weight: 68, height: 165, bmi: 24.9, assessment: "Неконтролирана хипертензија", plan: "Рамиприл 5mg 1x дневно, контрола за 4 недели", confidential: false, updatedAt: "", createdAt: "2026-03-15T10:30:00" },
    { id: 102, patientId: 1001, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: null, diagnosis: "Хипертензија под контрола", mkb10Code: "I10", clinicalNotes: "КП: 130/82 mmHg. Терапијата добро се поднесува. Нема несакани ефекти. Продолжи со тековна терапија.", vitalSigns: null, bloodPressure: "130/82", heartRate: 72, temperature: 36.5, weight: 67, height: 165, bmi: 24.6, assessment: "Добра контрола на ХТА", plan: "Продолжи со Рамиприл 5mg, следна контрола за 3 месеци", confidential: false, updatedAt: "", createdAt: "2026-01-20T09:00:00" },
  ],
  1002: [
    { id: 103, patientId: 1002, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 3, diagnosis: "Дијабет мелитус тип 2 — лоша контрола", mkb10Code: "E11", clinicalNotes: "HbA1c: 9.2%. Пациентот не се придржува до диета. Зголемена доза на Метформин. ЕКГ наручен.", vitalSigns: null, bloodPressure: "142/88", heartRate: 91, temperature: 36.9, weight: 102, height: 178, bmi: 32.2, assessment: "Дијабет со лоша гликемиска контрола, метаболен синдром", plan: "Метформин 1000mg 2x дневно, диетален режим, ЕКГ, липиден профил", confidential: false, updatedAt: "", createdAt: "2026-04-18T11:00:00" },
  ],
  1003: [
    { id: 104, patientId: 1003, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 4, diagnosis: "Артериска хипертензија", mkb10Code: "I10", clinicalNotes: "Прв преглед. КП: 148/92 mmHg. Алергии на НСАИЛ. Започната нефармаколошка терапија.", vitalSigns: null, bloodPressure: "148/92", heartRate: 80, temperature: 36.6, weight: 72, height: 168, bmi: 25.5, assessment: "Нова дијагноза на ХТА стадиум 1", plan: "Промена на животен стил, контрола за 1 месец. При неуспех — Калциум антагонист (не НСАИЛ заради алергија)", confidential: false, updatedAt: "", createdAt: "2026-04-10T08:30:00" },
    { id: 105, patientId: 1003, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 5, diagnosis: "Рутински преглед", mkb10Code: "Z00.0", clinicalNotes: "Годишна контрола. Пациентот без поплаки. КП нормален. Лабораториски наоди во норма.", vitalSigns: null, bloodPressure: "122/78", heartRate: 68, temperature: 36.5, weight: 71, height: 168, bmi: 25.1, assessment: "Здраво лице", plan: "Следна контрола за 12 месеци", confidential: false, updatedAt: "", createdAt: "2026-02-20T09:00:00" },
  ],
  1004: [
    { id: 106, patientId: 1004, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 6, diagnosis: "Дијабет мелитус тип 2", mkb10Code: "E11.9", clinicalNotes: "Контрола на гликемија. Гладен шеќер: 8.4 mmol/L. HbA1c чека. Препорачано засилување на терапија.", vitalSigns: null, bloodPressure: "138/86", heartRate: 84, temperature: 36.8, weight: 118, height: 182, bmi: 35.7, assessment: "Дијабет со умерена контрола, дислипидемија", plan: "Додај Glimepirid 2mg, Atorvastatin 20mg, контрола за 6 недели", confidential: false, updatedAt: "", createdAt: "2026-03-01T14:00:00" },
  ],
  1005: [
    { id: 107, patientId: 1005, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 8, diagnosis: "Нестабилна ангина пекторис", mkb10Code: "I20.0", clinicalNotes: "Пациентот со атипична болка во градите при напор. ЕКГ: СТ депресија во V4-V6. Упатен на кардиолог. Иницирана антиангинозна терапија.", vitalSigns: null, bloodPressure: "135/85", heartRate: 92, temperature: 36.6, weight: 61, height: 162, bmi: 23.2, assessment: "Суспектна нестабилна ангина — потребна кардиолошка евалуација", plan: "Аспирин 100mg, Нитроглицерин SL при болка, ургентно кардиолошко упатство", confidential: false, updatedAt: "", createdAt: "2026-05-05T10:00:00" },
  ],
  1006: [
    { id: 108, patientId: 1006, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 9, diagnosis: "Хронична бубрежна болест стадиум 2", mkb10Code: "N18.2", clinicalNotes: "GFR: 68 ml/min. Протеинурија: 0.4 g/24h. Лабораториски наоди нарачани. Советување за протеинска диета.", vitalSigns: null, bloodPressure: "140/90", heartRate: 76, temperature: 36.7, weight: 83, height: 175, bmi: 27.1, assessment: "ХББ ст.2 со протеинурија, ХТА", plan: "Рамиприл 10mg (нефропротекција), диета со ниски протеини, контрола за 2 месеци", confidential: false, updatedAt: "", createdAt: "2026-04-05T09:30:00" },
  ],
  1007: [
    { id: 109, patientId: 1007, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 10, diagnosis: "Хипотиреоза", mkb10Code: "E03.9", clinicalNotes: "TSH: 7.8 mIU/L. FT4 на долна граница. Пациентот со замор и зголемена телесна тежина. Дозата на Levothyroxin зголемена.", vitalSigns: null, bloodPressure: "118/72", heartRate: 58, temperature: 36.3, weight: 74, height: 170, bmi: 25.6, assessment: "Субклиничка хипотиреоза", plan: "Levothyroxin 75mcg наутро на гладно, контрола на TSH за 6 недели", confidential: false, updatedAt: "", createdAt: "2026-04-22T15:30:00" },
    { id: 110, patientId: 1007, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 11, diagnosis: "Хипотиреоза — иницијална дијагноза", mkb10Code: "E03.9", clinicalNotes: "Нова пациентка. TSH: 12.4 mIU/L. Клиничка слика: замор, добивање на тежина, опстипација. Иницирана супституциска терапија.", vitalSigns: null, bloodPressure: "115/70", heartRate: 55, temperature: 36.2, weight: 76, height: 170, bmi: 26.3, assessment: "Хипотиреоза", plan: "Levothyroxin 50mcg, лабораториска контрола за 6-8 недели", confidential: false, updatedAt: "", createdAt: "2026-01-18T11:00:00" },
  ],
  1008: [
    { id: 111, patientId: 1008, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 12, diagnosis: "ХОББ — средно тешка форма", mkb10Code: "J44.1", clinicalNotes: "Пациент пушач 35 пакет/години. FEV1/FVC: 0.62. SpO2: 94% на воздух. Диспнеа при умерен напор. Започнат LAMA инхалатор.", vitalSigns: null, bloodPressure: "145/92", heartRate: 88, temperature: 36.8, weight: 78, height: 173, bmi: 26.1, assessment: "ХОББ GOLD стадиум 2, ХТА", plan: "Tiotropium инхалатор 1x дневно, спирометриска контрола, советување за откажување пушење", confidential: false, updatedAt: "", createdAt: "2026-05-10T08:00:00" },
  ],
};

interface PatientDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  patientId: number | null;
  patientName: string;
}

type Tab = "overview" | "appointments" | "records" | "prescriptions";

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "overview",      label: "Overview",      icon: Droplet },
  { key: "appointments",  label: "Appointments",  icon: Calendar },
  { key: "records",       label: "Records",       icon: FileText },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
];

export function PatientDetailDrawer({
  open,
  onClose,
  patientId,
  patientName,
}: PatientDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>("overview");
  const [soapOpen, setSoapOpen] = useState(false);
  const [rxOpen, setRxOpen] = useState(false);

  useEffect(() => {
    if (open) setTab("overview");
  }, [open, patientId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => patientService.byId(patientId!),
    enabled: !!patientId && open,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["patient", patientId, "appointments"],
    queryFn: () => patientService.appointments(patientId!),
    enabled: !!patientId && open && tab === "appointments",
  });

  const recordsQuery = useQuery({
    queryKey: ["patient", patientId, "medical-records"],
    queryFn: () => patientService.medicalRecords(patientId!),
    enabled: !!patientId && open && tab === "records",
  });

  const prescriptionsQuery = useQuery({
    queryKey: ["patient", patientId, "prescriptions"],
    queryFn: () => patientService.prescriptions(patientId!),
    enabled: !!patientId && open && tab === "prescriptions",
  });

  const patient = patientQuery.data ?? (patientId ? MOCK_PATIENT_PROFILES[patientId] ?? null : null);
  const mockRecords = patientId ? MOCK_RECORDS[patientId] ?? [] : [];
  const ageYears = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    const dob = parseISO(patient.dateOfBirth);
    return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, [patient]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay starts below the sticky top nav (h-24 = 96px) so the user
                can always click another menu item to navigate away without
                first dismissing the drawer. */}
            <motion.div
              className="fixed inset-x-0 bottom-0 top-24 z-40 bg-slate-900/30 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed bottom-0 right-0 top-24 z-50 flex w-full flex-col bg-white shadow-2xl sm:w-[480px]"
            >
              {/* Header */}
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-base font-semibold text-brand-700">
                      {initials(
                        patientName.split(" ")[0] ?? "",
                        patientName.split(" ").slice(1).join(" ") || "",
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{patientName}</h2>
                      {patient && (
                        <p className="text-sm text-slate-500">
                          {ageYears ?? "?"} yrs · {patient.gender ?? "?"} · {patient.bloodType ?? "?"}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Action row */}
                <div className="mt-4 flex gap-2">
                  <Button size="sm" onClick={() => setSoapOpen(true)} disabled={!patientId}>
                    <Plus className="h-3.5 w-3.5" /> Medical record
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setRxOpen(true)} disabled={!patientId}>
                    <Plus className="h-3.5 w-3.5" /> Prescription
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-slate-200 px-3 pt-2">
                {TABS.map((t) => {
                  const active = tab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-medium transition-colors",
                        active ? "text-brand-700" : "text-slate-500 hover:text-slate-900",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="drawer-tab"
                          className="absolute inset-x-0 -bottom-px h-0.5 bg-brand-500"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <t.icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {tab === "overview" && (
                  <OverviewPanel
                    patient={patient}
                    loading={patientQuery.isLoading && !patient}
                  />
                )}
                {tab === "appointments" && (
                  <AppointmentsPanel
                    items={appointmentsQuery.data?.content ?? []}
                    loading={appointmentsQuery.isLoading}
                  />
                )}
                {tab === "records" && (
                  <RecordsPanel
                    items={recordsQuery.data?.content?.length ? recordsQuery.data.content : mockRecords}
                    loading={recordsQuery.isLoading}
                  />
                )}
                {tab === "prescriptions" && (
                  <PrescriptionsPanel
                    items={prescriptionsQuery.data?.content ?? []}
                    loading={prescriptionsQuery.isLoading}
                  />
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {patientId && (
        <>
          <MedicalRecordForm
            open={soapOpen}
            onClose={() => setSoapOpen(false)}
            patientId={patientId}
            patientName={patientName}
          />
          <PrescriptionForm
            open={rxOpen}
            onClose={() => setRxOpen(false)}
            patientId={patientId}
            patientName={patientName}
            patientAllergies={patient?.allergies ?? null}
          />
        </>
      )}
    </>
  );
}

function OverviewPanel({
  patient,
  loading,
}: {
  patient: PatientResponse | null | undefined;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-48" />;
  if (!patient) return <p className="text-sm text-slate-500">Patient not found.</p>;

  const rows: Array<[string, string | null | undefined]> = [
    ["Email", patient.email],
    ["Phone", patient.phoneNumber],
    ["Date of birth", patient.dateOfBirth],
    ["Blood type", patient.bloodType],
    ["City", patient.city],
    ["Address", patient.address],
    ["Insurance", patient.insuranceProvider],
    ["Emergency contact", patient.emergencyContact],
  ];

  return (
    <div className="space-y-5">
      {patient.allergies && patient.allergies.toLowerCase() !== "none known" && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Allergies</p>
            <p className="text-amber-700">{patient.allergies}</p>
          </div>
        </div>
      )}

      {patient.chronicConditions && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Chronic conditions
          </p>
          <p className="mt-1 text-sm text-slate-700">{patient.chronicConditions}</p>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </dt>
            <dd className="mt-0.5 text-sm text-slate-900">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function AppointmentsPanel({
  items,
  loading,
}: {
  items: AppointmentResponse[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-32" />;
  if (items.length === 0)
    return <p className="text-sm text-slate-500">No appointments on record.</p>;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {formatDate(a.appointmentDate)} · {formatTime(a.appointmentTime?.substring(0, 5))}
              </p>
              <p className="text-xs text-slate-500">{a.reason ?? "—"}</p>
            </div>
            <Badge tone={appointmentStatusTone(a.status)}>{a.status}</Badge>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RecordsPanel({
  items,
  loading,
}: {
  items: MedicalRecordResponse[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-32" />;
  if (items.length === 0)
    return <p className="text-sm text-slate-500">No medical records yet.</p>;
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {format(parseISO(r.createdAt), "MMM d, yyyy")} · Dr {r.doctorName ?? "?"}
            </p>
            {r.mkb10Code && (
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-700">
                {r.mkb10Code}
              </span>
            )}
          </div>
          {r.diagnosis && <p className="mt-1 text-sm font-semibold text-slate-900">{r.diagnosis}</p>}
          <p className="mt-1 text-xs text-slate-700">{r.clinicalNotes}</p>
        </li>
      ))}
    </ul>
  );
}

function PrescriptionsPanel({
  items,
  loading,
}: {
  items: PrescriptionResponse[];
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-32" />;
  if (items.length === 0)
    return <p className="text-sm text-slate-500">No prescriptions on file.</p>;
  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li key={p.id} className="rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{p.medicationName}</p>
            <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>{p.status}</Badge>
          </div>
          <p className="text-xs text-slate-500">
            {p.dosage} · {p.frequency}
            {p.route ? ` · ${p.route}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
