"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  ClipboardList,
  Droplet,
  FileText,
  Pill,
  Plus,
  Printer,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { Badge, appointmentStatusTone } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { MedicalRecordForm } from "./MedicalRecordForm";
import { PrescriptionForm } from "./PrescriptionForm";
import { SickLeaveModal } from "./SickLeaveModal";
import { useT } from "@/hooks/useT";
import { patientService } from "@/services/patient.service";
import { appointmentService } from "@/services/appointment.service";
import { prescriptionService } from "@/services/prescription.service";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { extractErrorMessage } from "@/services/api";
import type {
  AppointmentResponse,
  MedicalRecordResponse,
  PatientResponse,
  PrescriptionResponse,
  PrescriptionRoute,
  PrescriptionStatus,
} from "@/types/api";
import { cn } from "@/utils/cn";
import { formatDate, formatTime, initials } from "@/utils/format";
import {
  MOCK_ACTIVE_MEDS,
  MOCK_PATIENT_PROFILES,
  MOCK_PRESCRIPTIONS,
  MOCK_RECORDS,
} from "@/__fixtures__/patientDrawer.fixtures";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// ── BloodTypeBadge ────────────────────────────────────────────────────────────
function formatBloodType(bt: string): string {
  return bt.replace("_POS", "+").replace("_NEG", "−");
}

function BloodTypeBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const isNeg = value.endsWith("_NEG");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isNeg
          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
          : "bg-red-50 text-red-700 ring-1 ring-red-200"
      )}
    >
      <Droplet className={cn("h-3 w-3", isNeg ? "text-blue-500" : "text-red-500")} />
      {formatBloodType(value)}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
interface PatientDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  patientId: number | null;
  patientName: string;
}

type Tab = "overview" | "appointments" | "records" | "prescriptions";

export function PatientDetailDrawer({
  open,
  onClose,
  patientId,
  patientName,
}: PatientDetailDrawerProps) {
  const t = useT();

  const TABS = useMemo<{ key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[]>(() => [
    { key: "overview",      label: t.doctorDrawer.tabOverview,      icon: Droplet   },
    { key: "appointments",  label: t.doctorDrawer.tabAppointments,  icon: Calendar  },
    { key: "records",       label: t.doctorDrawer.tabRecords,       icon: FileText  },
    { key: "prescriptions", label: t.doctorDrawer.tabPrescriptions, icon: Pill      },
  ], [t]);

  const [tab, setTab] = useState<Tab>("overview");
  const [soapOpen, setSoapOpen] = useState(false);
  const [rxOpen, setRxOpen] = useState(false);
  const [sickLeaveOpen, setSickLeaveOpen] = useState(false);

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

  const patient = patientQuery.data
    ?? (USE_MOCKS && patientId ? MOCK_PATIENT_PROFILES[patientId] ?? null : null);
  const mockRecords = USE_MOCKS && patientId ? MOCK_RECORDS[patientId] ?? [] : [];
  const mockPrescriptions = USE_MOCKS && patientId ? MOCK_PRESCRIPTIONS[patientId] ?? [] : [];
  const activeMedications = USE_MOCKS && patientId ? MOCK_ACTIVE_MEDS[patientId] ?? [] : [];

  const ageYears = useMemo(() => {
    if (!patient?.dateOfBirth) return null;
    const dob = parseISO(patient.dateOfBirth);
    return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }, [patient]);

  const drawerContent = (
    <>
      {/* Backdrop — separate AnimatePresence so it's removed from DOM quickly
          and doesn't block clicks on the patient list during the drawer's slide-out */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-x-0 bottom-0 top-24 z-40 bg-slate-900/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed bottom-0 right-0 top-24 z-50 flex w-full flex-col bg-white shadow-2xl sm:w-[500px]"
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
                          {ageYears ?? "?"} год · {patient.gender ?? "?"} · <BloodTypeBadge value={patient.bloodType} />
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setSoapOpen(true)} disabled={!patientId}>
                    <Plus className="h-3.5 w-3.5" /> {t.doctorDrawer.addRecord}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSickLeaveOpen(true)}
                    disabled={!patientId}
                    className="gap-1.5"
                  >
                    <ClipboardList className="h-3.5 w-3.5" /> {t.doctorDrawer.sickLeaveBtn}
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
                    records={mockRecords}
                    activeMeds={activeMedications}
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
                    items={prescriptionsQuery.data?.content?.length ? prescriptionsQuery.data.content : mockPrescriptions}
                    loading={prescriptionsQuery.isLoading}
                    patientId={patientId}
                  />
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
    </>
  );

  return typeof window === "undefined"
    ? null
    : createPortal(
        <>
          {drawerContent}
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
            activeMedications={activeMedications}
          />
          <SickLeaveModal
            open={sickLeaveOpen}
            onClose={() => setSickLeaveOpen(false)}
            patientName={patientName}
            patientDob={patient?.dateOfBirth}
          />
        </>
      )}
        </>,
        document.body,
      );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function OverviewPanel({
  patient,
  loading,
  records,
  activeMeds,
}: {
  patient: PatientResponse | null | undefined;
  loading: boolean;
  records: MedicalRecordResponse[];
  activeMeds: string[];
}) {
  const t = useT();
  if (loading) return <Skeleton className="h-48" />;
  if (!patient) return <p className="text-sm text-slate-500">{t.doctorDrawer.patientNotFound}</p>;

  const lastRecord = records[0];
  const lastThree = records.slice(0, 3);

  return (
    <div className="space-y-5">
      {/* Allergy alert */}
      {patient.allergies && patient.allergies.toLowerCase() !== "none known" && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">{t.doctorDrawer.allergiesLabel}</p>
            <p className="text-amber-700">{patient.allergies}</p>
          </div>
        </div>
      )}

      {/* Clinical summary */}
      {(lastRecord || patient.chronicConditions || activeMeds.length > 0) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.doctorDrawer.clinicalSummary}</p>

          {patient.chronicConditions && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.doctorDrawer.chronicConditions}</p>
              <p className="mt-0.5 text-sm text-slate-800">{patient.chronicConditions}</p>
            </div>
          )}

          {activeMeds.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.doctorDrawer.currentTherapy}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {activeMeds.map((m) => (
                  <span key={m} className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {lastRecord && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                {t.doctorDrawer.lastExam} · {format(parseISO(lastRecord.createdAt), "d MMM yyyy")}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">{lastRecord.diagnosis}</p>
              {lastRecord.bloodPressure && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.doctorDrawer.bpLabel} {lastRecord.bloodPressure}
                  {lastRecord.heartRate ? ` · ${t.doctorDrawer.hrLabel} ${lastRecord.heartRate} bpm` : ""}
                  {lastRecord.weight ? ` · ${lastRecord.weight} kg` : ""}
                </p>
              )}
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{lastRecord.plan}</p>
            </div>
          )}

          {lastThree.length > 1 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.doctorDrawer.priorDiagnoses}</p>
              <ul className="mt-1 space-y-0.5">
                {lastThree.slice(1).map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-mono text-[10px] text-brand-600">{r.mkb10Code}</span>
                    <span>{r.diagnosis}</span>
                    <span className="ml-auto text-slate-400">{format(parseISO(r.createdAt), "MMM yyyy")}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Demographics */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        {([
          [t.doctorDrawer.emailLabel,     patient.email],
          [t.doctorDrawer.phoneLabel,     patient.phoneNumber],
          [t.doctorDrawer.dobLabel,       patient.dateOfBirth],
          [t.doctorDrawer.cityLabel,      patient.city],
          [t.doctorDrawer.addressLabel,   patient.address],
          [t.doctorDrawer.insuranceLabel, patient.insuranceProvider],
          [t.doctorDrawer.emergencyLabel, patient.emergencyContact],
        ] as [string, string | null | undefined][]).map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-0.5 text-sm text-slate-900">{value || "—"}</dd>
          </div>
        ))}
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.doctorDrawer.bloodTypeLabel}</dt>
          <dd className="mt-0.5"><BloodTypeBadge value={patient.bloodType} /></dd>
        </div>
      </dl>
    </div>
  );
}

function AppointmentItem({ a }: { a: AppointmentResponse }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(a.videoCallUrl ?? "");

  const saveMutation = useMutation({
    mutationFn: () => appointmentService.setVideoUrl(a.id, url),
    onSuccess: () => {
      toast.success("Линкот е зачуван.");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["patient", a.patientId, "appointments"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const isVirtualScheduled =
    a.appointmentType === "VIRTUAL" && a.status === "SCHEDULED";

  return (
    <li className="rounded-lg border border-slate-200 px-3 py-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {formatDate(a.appointmentDate)} · {formatTime(a.appointmentTime?.substring(0, 5))}
          </p>
          <p className="text-xs text-slate-500">{a.reason ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {isVirtualScheduled && (
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <Video className="h-3 w-3" />
              {a.videoCallUrl ? "Промени" : "Постави линк"}
            </button>
          )}
          <Badge tone={appointmentStatusTone(a.status)}>{a.status}</Badge>
        </div>
      </div>
      {a.videoCallUrl && !editing && (
        <a
          href={a.videoCallUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 flex items-center gap-1 text-xs text-emerald-600 hover:underline"
        >
          <Video className="h-3 w-3" />
          {a.videoCallUrl}
        </a>
      )}
      {editing && (
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://meet.google.com/..."
            className="flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:border-emerald-400 focus:outline-none"
          />
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !url}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {saveMutation.isPending ? "…" : "Зачувај"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
          >
            Откажи
          </button>
        </div>
      )}
    </li>
  );
}

function AppointmentsPanel({ items, loading }: { items: AppointmentResponse[]; loading: boolean }) {
  const t = useT();
  if (loading) return <Skeleton className="h-32" />;
  if (items.length === 0)
    return <p className="text-sm text-slate-500">{t.doctorDrawer.noAppointments}</p>;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <AppointmentItem key={a.id} a={a} />
      ))}
    </ul>
  );
}

function RecordsPanel({ items, loading }: { items: MedicalRecordResponse[]; loading: boolean }) {
  const t = useT();
  if (loading) return <Skeleton className="h-32" />;
  if (items.length === 0)
    return <p className="text-sm text-slate-500">{t.doctorDrawer.noRecords}</p>;
  return (
    <ul className="space-y-3">
      {items.map((r) => (
        <li key={r.id} className="rounded-lg border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {format(parseISO(r.createdAt), "d MMM yyyy")} · Dr {r.doctorName ?? "?"}
            </p>
            {r.mkb10Code && (
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-brand-700">
                {r.mkb10Code}
              </span>
            )}
          </div>
          {r.diagnosis && <p className="mt-1 text-sm font-semibold text-slate-900">{r.diagnosis}</p>}
          <p className="mt-1 text-xs text-slate-700">{r.clinicalNotes}</p>
          {r.bloodPressure && (
            <p className="mt-1 text-xs text-slate-400">
              {t.doctorDrawer.bpLabel} {r.bloodPressure}
              {r.heartRate ? ` · ${t.doctorDrawer.hrLabel} ${r.heartRate} bpm` : ""}
              {r.weight ? ` · ${r.weight} kg` : ""}
            </p>
          )}
          {r.plan && (
            <p className="mt-1 text-xs font-medium text-emerald-700">{t.doctorDrawer.planLabel} {r.plan}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function PrescriptionsPanel({ items, loading, patientId }: { items: PrescriptionResponse[]; loading: boolean; patientId: number | null }) {
  const t = useT();
  const qc = useQueryClient();
  const { data: doctor } = useDoctorProfile();

  const cancelMutation = useMutation({
    mutationFn: (id: number) => prescriptionService.cancel(id),
    onSuccess: () => {
      toast.success("Рецептот е откажан");
      qc.invalidateQueries({ queryKey: ["patient", patientId, "prescriptions"] });
    },
    onError: () => toast.error("Неуспешно откажување"),
  });

  function handlePrint(p: PrescriptionResponse) {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`<html><head><title>Рецепт — MedTech</title><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#1e293b}
      .header{border-bottom:2px solid #0891b2;padding-bottom:16px;margin-bottom:24px}
      .hospital{font-size:12px;color:#64748b}
      .title{font-size:22px;font-weight:bold;margin-top:8px}
      .section{margin-bottom:16px}
      .label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em}
      .value{font-size:15px;font-weight:500;margin-top:2px}
      .footer{margin-top:60px;border-top:1px solid #e2e8f0;padding-top:16px;display:flex;justify-content:space-between;font-size:12px;color:#94a3b8}
      .signature-line{border-bottom:1px solid #1e293b;width:200px;margin-top:40px}
      @media print{body{padding:20px}}
    </style></head><body>
      <div class="header">
        <div class="hospital">MedTech · ${doctor?.hospitalName ?? "Болница"}</div>
        <div class="title">МЕДИЦИНСКИ РЕЦЕПТ</div>
      </div>
      <div class="section"><div class="label">Доктор</div><div class="value">д-р ${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""} · ${doctor?.specialization ?? ""}</div></div>
      <div class="section"><div class="label">Лек</div><div class="value">${p.medicationName}</div></div>
      <div class="section"><div class="label">Доза / Фреквенција</div><div class="value">${p.dosage} — ${p.frequency}</div></div>
      ${p.route ? `<div class="section"><div class="label">Начин</div><div class="value">${p.route}</div></div>` : ""}
      ${p.durationDays ? `<div class="section"><div class="label">Траење</div><div class="value">${p.durationDays} денови</div></div>` : ""}
      ${p.instructions ? `<div class="section"><div class="label">Инструкции</div><div class="value">${p.instructions}</div></div>` : ""}
      <div class="section"><div class="label">Датум</div><div class="value">${format(parseISO(p.startDate), "d MMMM yyyy")}</div></div>
      <div style="margin-top:40px"><div class="label">Потпис на доктор</div><div class="signature-line"></div></div>
      <div class="footer"><span>Издадено преку MedTech</span><span>Рецепт #${p.id}</span></div>
      <script>window.onload=()=>{window.print();window.close()}</script>
    </body></html>`);
    win.document.close();
  }

  if (loading) return <Skeleton className="h-32" />;
  if (items.length === 0)
    return <p className="text-sm text-slate-500">{t.doctorDrawer.noPrescriptions}</p>;

  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li key={p.id} className="rounded-lg border border-slate-200 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{p.medicationName}</p>
              <p className="text-xs text-slate-500">
                {p.dosage} · {p.frequency}
                {p.route ? ` · ${p.route}` : ""}
              </p>
              {p.instructions && (
                <p className="mt-0.5 text-[11px] italic text-slate-400">{p.instructions}</p>
              )}
            </div>
            <Badge tone={p.status === "ACTIVE" ? "success" : "neutral"}>
              {p.status === "ACTIVE" ? t.doctorDrawer.prescriptionActive : p.status}
            </Badge>
          </div>
          {p.status === "ACTIVE" && (
            <div className="mt-2 flex gap-2 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => handlePrint(p)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" /> Печати рецепт
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() => cancelMutation.mutate(p.id)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Откажи
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
