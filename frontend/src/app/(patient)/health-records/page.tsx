"use client";

import { motion } from "framer-motion";
import { Activity, FileText, Heart, Stethoscope, Thermometer, Weight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { patientService } from "@/services/patient.service";
import { usePatientProfile } from "@/hooks/usePatient";
import type { MedicalRecordResponse } from "@/types/api";

export default function HealthRecordsPage() {
  const profile = usePatientProfile();

  const records = useQuery({
    queryKey: ["patient", profile.data?.id, "medical-records"],
    queryFn: () => patientService.medicalRecords(profile.data!.id),
    enabled: !!profile.data?.id,
  });

  const items = records.data?.content ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <p className="text-sm font-medium text-brand-600">Medical history</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Health records</h1>
        <p className="mt-1 text-slate-500">
          Diagnoses, vitals, and clinician notes from every completed visit.
        </p>
      </motion.div>

      {profile.isLoading || records.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : !profile.data ? (
        <EmptyState
          title="Profile not set up yet"
          description="Complete your patient profile from the dashboard to access your records."
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No medical records yet"
          description="Records appear after a completed appointment with a clinician."
        />
      ) : (
        <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
          {items.map((r, i) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="relative"
            >
              <span className="absolute -left-[33px] top-2 flex h-4 w-4 items-center justify-center rounded-full border-2 border-brand-500 bg-white">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              </span>
              <RecordCard record={r} />
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

function RecordCard({ record }: { record: MedicalRecordResponse }) {
  const vitals: Array<[React.ComponentType<{ className?: string }>, string, string]> = [];
  if (record.bloodPressure) vitals.push([Heart, "BP", record.bloodPressure]);
  if (record.heartRate) vitals.push([Activity, "HR", `${record.heartRate} bpm`]);
  if (record.temperature) vitals.push([Thermometer, "Temp", `${record.temperature}°C`]);
  if (record.weight) vitals.push([Weight, "Weight", `${record.weight} kg`]);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {format(parseISO(record.createdAt), "EEEE, MMMM d, yyyy")}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              {record.diagnosis ?? "Visit summary"}
            </h3>
            {record.mkb10Code && (
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-brand-700">
                {record.mkb10Code}
              </span>
            )}
          </div>
          {record.doctorName && (
            <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
              <Stethoscope className="h-3 w-3" /> Dr. {record.doctorName}
              {record.doctorSpecialization ? ` · ${record.doctorSpecialization}` : ""}
            </p>
          )}
        </div>
        {record.confidential && <Badge tone="warning">Confidential</Badge>}
      </div>

      {vitals.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 md:grid-cols-4">
          {vitals.map(([Icon, label, value]) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-slate-400" />
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
                <p className="text-sm font-semibold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {record.clinicalNotes && (
        <Section label="Clinical notes" body={record.clinicalNotes} />
      )}
      {record.assessment && <Section label="Assessment" body={record.assessment} />}
      {record.plan && <Section label="Plan" body={record.plan} />}
    </Card>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div className="mt-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{body}</p>
    </div>
  );
}
