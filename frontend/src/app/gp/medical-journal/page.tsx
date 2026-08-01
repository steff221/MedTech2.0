// Страница (Next.js): медицински дневник — дел за матичен лекар (GP).
"use client";

import { motion } from "framer-motion";
import { BookOpen, Calendar, ChevronDown, Search, Stethoscope } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/common/Badge";
import { Card } from "@/components/common/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { PageBanner } from "@/components/layout/PageBanner";
import { Skeleton } from "@/components/common/Skeleton";
import { medicalRecordService } from "@/services/medicalRecord.service";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import type { MedicalRecordResponse } from "@/types/api";

const fmt = (d: string) => format(parseISO(d), "d MMM yyyy");

function RecordCard({ record }: { record: MedicalRecordResponse }) {
  const t = useT();
  const mj = t.medicalJournal;
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900 text-sm">{record.diagnosis ?? "—"}</span>
            {record.mkb10Code && (
              <Badge tone="neutral">{record.mkb10Code}</Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {record.createdAt ? fmt(record.createdAt) : "—"}
            </span>
            {record.patientName && (
              <span className="flex items-center gap-1">
                <Stethoscope className="h-3 w-3" />
                {record.patientName}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          {record.clinicalNotes && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">{mj.clinicalNotes}</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.clinicalNotes}</p>
            </div>
          )}
          {record.assessment && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">{mj.assessment}</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.assessment}</p>
            </div>
          )}
          {record.plan && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">{mj.plan}</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.plan}</p>
            </div>
          )}
          {(record.bloodPressure || record.heartRate || record.temperature) && (
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
              {record.bloodPressure && <div><span className="text-slate-400">{t.doctorDrawer.bpLabel}</span><br /><span className="font-semibold">{record.bloodPressure}</span></div>}
              {record.heartRate && <div><span className="text-slate-400">{mj.pulse}</span><br /><span className="font-semibold">{record.heartRate} bpm</span></div>}
              {record.temperature && <div><span className="text-slate-400">{mj.temperature}</span><br /><span className="font-semibold">{record.temperature}°C</span></div>}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default function GPMedicalJournalPage() {
  const t = useT();
  const mj = t.medicalJournal;
  const [search, setSearch] = useState("");

  const records = useQuery({
    queryKey: ["medical-records", "my"],
    queryFn: () => medicalRecordService.myRecords(0, 200),
    staleTime: 5 * 60_000,
  });

  const items: MedicalRecordResponse[] = useMemo(
    () => records.data?.content ?? [],
    [records.data],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (r) =>
        (r.diagnosis ?? "").toLowerCase().includes(q) ||
        (r.mkb10Code ?? "").toLowerCase().includes(q) ||
        (r.patientName ?? "").toLowerCase().includes(q) ||
        (r.clinicalNotes ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(() => {
    const map = new Map<number, { name: string; records: MedicalRecordResponse[] }>();
    filtered.forEach((r) => {
      const existing = map.get(r.patientId);
      if (existing) {
        existing.records.push(r);
      } else {
        map.set(r.patientId, { name: r.patientName ?? mj.unknownPatient, records: [r] });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, mj.unknownPatient]);

  return (
    <>
      <PageBanner
        title={t.gpNav.medicalJournal}
        breadcrumb={[{ label: t.gpNav.medicalJournal }]}
      />

      <div className="mx-auto max-w-4xl px-6 py-6 space-y-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={mj.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {records.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={mj.noRecords}
            description={search ? mj.noResultsSearch : mj.noRecordsDesc}
          />
        ) : (
          <div className="space-y-6">
            {grouped.map(({ name, records: patientRecords }) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="tile h-7 w-7 text-xs">
                    {name[0]}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">{name}</h3>
                  <span className="text-xs text-slate-400">
                    {patientRecords.length} {patientRecords.length !== 1 ? mj.recordSuffixPlural : mj.recordSuffix}
                  </span>
                </div>
                <div className="space-y-2">
                  {patientRecords.map((r) => <RecordCard key={r.id} record={r} />)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
