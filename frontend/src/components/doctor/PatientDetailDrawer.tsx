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

  const patient = patientQuery.data;
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
            <motion.div
              className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
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
              className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-white shadow-2xl sm:w-[480px]"
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
                  <OverviewPanel patient={patient} loading={patientQuery.isLoading} />
                )}
                {tab === "appointments" && (
                  <AppointmentsPanel
                    items={appointmentsQuery.data?.content ?? []}
                    loading={appointmentsQuery.isLoading}
                  />
                )}
                {tab === "records" && (
                  <RecordsPanel
                    items={recordsQuery.data?.content ?? []}
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
