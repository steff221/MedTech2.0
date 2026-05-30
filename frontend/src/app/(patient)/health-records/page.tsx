"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileText,
  Heart,
  History,
  Printer,
  Ruler,
  Search,
  Stethoscope,
  Thermometer,
  Weight,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { patientService } from "@/services/patient.service";
import { medicalRecordService } from "@/services/medicalRecord.service";
import { usePatientProfile } from "@/hooks/usePatient";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import type { MedicalRecordResponse } from "@/types/api";

// bmiTier resolved at runtime inside component using translation keys
const BMI_THRESHOLDS = [18.5, 25, 30, 999];
const bmiTierIndex = (bmi: number) => BMI_THRESHOLDS.findIndex((max) => bmi < max);

const fmt     = (d: string) => format(parseISO(d), "d MMM yyyy");
const fmtFull = (d: string) => format(parseISO(d), "d MMM yyyy • HH:mm");

// ── Summary banner ────────────────────────────────────────────────────────────
function SummaryBanner({ records }: { records: MedicalRecordResponse[] }) {
  const t  = useT();
  const hr = t.patientHealthRecords;
  const total         = records.length;
  const last          = records[0]?.createdAt ? fmt(records[0].createdAt) : "—";
  const uniqueDoctors = new Set(records.map((r) => r.doctorId)).size;

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {([
        { icon: ClipboardList, label: hr.statTotal,     value: String(total)         },
        { icon: CalendarDays,  label: hr.statLastVisit, value: last                  },
        { icon: Stethoscope,   label: hr.statDoctors,   value: String(uniqueDoctors) },
      ] as const).map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50">
            <Icon className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-base font-bold text-slate-900">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Audit history ─────────────────────────────────────────────────────────────
function AuditHistory({ recordId }: { recordId: number }) {
  const t  = useT();
  const hr = t.patientHealthRecords;
  const { data, isLoading } = useQuery({
    queryKey: ["medical-record-history", recordId],
    queryFn: () => medicalRecordService.getHistory(recordId),
  });

  if (isLoading) return <Skeleton className="h-12 w-full mt-3" />;
  if (!data || data.length === 0) return null;

  const EVENT_LABELS: Record<string, string> = {
    CREATED:  hr.eventCreated,
    ADDENDUM: hr.eventAddendum,
    VIEWED:   hr.eventViewed,
  };

  return (
    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <History className="h-3.5 w-3.5" /> {hr.historyTitle}
      </p>
      <ol className="space-y-1.5">
        {data.map((ev) => (
          <li key={ev.id} className="flex items-start gap-2 text-xs text-slate-600">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
            <span>
              <span className="font-medium text-slate-800">
                {EVENT_LABELS[ev.eventType] ?? ev.eventType}
              </span>
              {ev.note && <span className="text-slate-500"> — {ev.note}</span>}
              <span className="ml-1.5 text-slate-400">
                {fmtFull(ev.createdAt)} · {ev.authorName}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Record card ───────────────────────────────────────────────────────────────
function RecordCard({ record }: { record: MedicalRecordResponse }) {
  const t  = useT();
  const hr = t.patientHealthRecords;
  const [expanded, setExpanded] = useState(false);

  const BMI_TIER_LABELS = [hr.bmiUnder, hr.bmiNormal, hr.bmiOver, hr.bmiObese];
  const BMI_TIER_COLORS = [
    { color: "text-blue-600",    bg: "bg-blue-100"    },
    { color: "text-emerald-600", bg: "bg-emerald-100" },
    { color: "text-amber-600",   bg: "bg-amber-100"   },
    { color: "text-rose-600",    bg: "bg-rose-100"    },
  ];

  type VitalEntry = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    extra?: React.ReactNode;
  };

  const vitals: VitalEntry[] = [];
  if (record.bloodPressure) vitals.push({ icon: Heart,       label: hr.vitalBP,     value: record.bloodPressure });
  if (record.heartRate)     vitals.push({ icon: Activity,    label: hr.vitalHR,     value: `${record.heartRate} bpm` });
  if (record.temperature)   vitals.push({ icon: Thermometer, label: hr.vitalTemp,   value: `${record.temperature}°C` });
  if (record.weight)        vitals.push({ icon: Weight,      label: hr.vitalWeight, value: `${record.weight} kg` });
  if (record.height)        vitals.push({ icon: Ruler,       label: hr.vitalHeight, value: `${record.height} cm` });
  if (record.bmi) {
    const idx = bmiTierIndex(Number(record.bmi));
    const tierLabel = BMI_TIER_LABELS[idx] ?? "";
    const tierStyle = BMI_TIER_COLORS[idx] ?? BMI_TIER_COLORS[1];
    vitals.push({
      icon: Activity,
      label: hr.vitalBMI,
      value: `${record.bmi}`,
      extra: (
        <span className={cn("ml-1 rounded px-1 py-0.5 text-[10px] font-semibold", tierStyle.bg, tierStyle.color)}>
          {tierLabel}
        </span>
      ),
    });
  }

  const hasDetails = !!(record.assessment || record.plan);

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;
    w.document.write(`
      <html><head><title>Здравствен запис #${record.id}</title>
      <style>
        body { font-family: sans-serif; padding: 2rem; color: #1e293b; }
        h1 { font-size: 1.4rem; margin-bottom: 0.25rem; }
        p.meta { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
        td, th { border: 1px solid #e2e8f0; padding: 0.4rem 0.6rem; font-size: 0.85rem; }
        th { background: #f8fafc; font-size: 0.7rem; text-transform: uppercase; }
        .section { margin-top: 1rem; }
        .section h3 { font-size: 0.75rem; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.25rem; }
        .section p { font-size: 0.9rem; white-space: pre-wrap; }
      </style></head><body>
      <h1>${record.diagnosis ?? "Здравствен запис"} ${record.mkb10Code ? `(${record.mkb10Code})` : ""}</h1>
      <p class="meta">Дата: ${fmt(record.createdAt)} &nbsp;|&nbsp; Лекар: ${record.doctorName ?? "—"} ${record.doctorSpecialization ? `· ${record.doctorSpecialization}` : ""}</p>
      ${vitals.length ? `<table><tr>${vitals.map((v) => `<th>${v.label}</th>`).join("")}</tr><tr>${vitals.map((v) => `<td>${v.value}</td>`).join("")}</tr></table>` : ""}
      ${record.clinicalNotes ? `<div class="section"><h3>Клинички белешки</h3><p>${record.clinicalNotes}</p></div>` : ""}
      ${record.assessment ? `<div class="section"><h3>Проценка</h3><p>${record.assessment}</p></div>` : ""}
      ${record.plan ? `<div class="section"><h3>Третман / план</h3><p>${record.plan}</p></div>` : ""}
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <Card>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-400">{fmt(record.createdAt)}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            <h3 className="text-lg font-bold text-slate-900">{record.diagnosis ?? hr.defaultDiag}</h3>
            {record.mkb10Code && (
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-brand-700">
                {record.mkb10Code}
              </span>
            )}
          </div>
          {record.doctorName && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Stethoscope className="h-3 w-3" />
              Dr. {record.doctorName}
              {record.doctorSpecialization ? ` · ${record.doctorSpecialization}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {record.confidential && <Badge tone="warning">{hr.confidential}</Badge>}
          <button
            type="button"
            onClick={handlePrint}
            title={hr.printRecord}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Vitals grid */}
      {vitals.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 md:grid-cols-3 lg:grid-cols-6">
          {vitals.map(({ icon: Icon, label, value, extra }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="leading-tight">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="flex items-center text-sm font-semibold text-slate-900">
                  {value}{extra}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Always-visible notes */}
      {record.clinicalNotes && <Section label={hr.sectionNotes} body={record.clinicalNotes} />}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {record.assessment && <Section label={hr.sectionAssess} body={record.assessment} />}
            {record.plan && <Section label={hr.sectionPlan} body={record.plan} />}
            <AuditHistory recordId={record.id} />
          </motion.div>
        )}
      </AnimatePresence>

      {hasDetails && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-800"
        >
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          {expanded ? hr.hideDetails : hr.showDetails}
        </button>
      )}
    </Card>
  );
}

function Section({ label, body }: { label: string; body: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{body}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HealthRecordsPage() {
  const t  = useT();
  const hr = t.patientHealthRecords;
  const profile   = usePatientProfile();
  const [search,   setSearch]   = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  const records = useQuery({
    queryKey: ["patient", profile.data?.id, "medical-records"],
    queryFn: () => patientService.medicalRecords(profile.data!.id, 0, 100),
    enabled: !!profile.data?.id,
  });

  const items = records.data?.content ?? [];

  const filtered = useMemo(() => {
    let result = items;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(
        (r) =>
          r.diagnosis?.toLowerCase().includes(q) ||
          r.mkb10Code?.toLowerCase().includes(q) ||
          r.clinicalNotes?.toLowerCase().includes(q) ||
          r.doctorName?.toLowerCase().includes(q),
      );
    }
    if (fromDate) result = result.filter((r) => r.createdAt >= fromDate);
    if (toDate)   result = result.filter((r) => r.createdAt <= toDate + "T23:59:59Z");
    return result;
  }, [items, search, fromDate, toDate]);

  const hasFilter = !!(search || fromDate || toDate);
  const clearFilters = () => { setSearch(""); setFromDate(""); setToDate(""); };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="text-3xl font-bold text-slate-900">{hr.title}</h1>
        <p className="mt-1 text-slate-500">{hr.subtitle}</p>
      </motion.div>

      {profile.isLoading || records.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : !profile.data ? (
        <EmptyState title={hr.noProfile} description={hr.noProfileDesc} />
      ) : (
        <>
          {items.length > 0 && <SummaryBanner records={items} />}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={hr.searchPlaceholder}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title={hr.fromDate}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title={hr.toDate}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {hasFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" /> {hr.clearFilters}
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={hasFilter ? hr.noResults : hr.noRecords}
              description={hasFilter ? hr.noResultsDesc : hr.noRecordsDesc}
            />
          ) : (
            <ol className="relative space-y-5 border-l-2 border-slate-200 pl-6">
              {filtered.map((r, i) => (
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
        </>
      )}
    </div>
  );
}
