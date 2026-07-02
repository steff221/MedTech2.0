// Страница (Next.js): рецепти — дел за матичен лекар (GP).
"use client";

import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { FileText, Printer, Search, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useDoctorPatients, type DoctorPatientSummary } from "@/hooks/useDoctorPatients";
import { prescriptionService } from "@/services/prescription.service";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import type { PrescriptionResponse, PrescriptionStatus } from "@/types/api";

const STATUS_COLORS: Record<PrescriptionStatus, string> = {
  ACTIVE:    "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-rose-100 text-rose-600",
  SUSPENDED: "bg-amber-100 text-amber-700",
};

export default function DoctorPrescriptionsPage() {
  const doctor  = useDoctorProfile();
  const t       = useT();
  const px      = t.prescriptions;
  const { summaries: patients, isLoading: patientsLoading } = useDoctorPatients(doctor.data?.id);
  const qc      = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState<PrescriptionResponse | null>(null);

  const STATUS_LABELS: Record<PrescriptionStatus, string> = {
    ACTIVE:    px.statusActive,
    COMPLETED: px.statusCompleted,
    CANCELLED: px.statusCancelled,
    SUSPENDED: px.statusSuspended,
  };

  const prescriptionsQuery = useQuery({
    queryKey: ["prescriptions", "patient", selectedPatientId],
    queryFn:  () => prescriptionService.activeForPatient(selectedPatientId!, 0, 100),
    enabled:  !!selectedPatientId,
    staleTime: 2 * 60_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => prescriptionService.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prescriptions", "patient", selectedPatientId] });
      toast.success(px.cancelSuccess);
      setSelected(null);
    },
    onError: () => toast.error(px.cancelError),
  });

  const filteredPatients = patients.filter((p: DoctorPatientSummary) =>
    !search || p.patientName.toLowerCase().includes(search.toLowerCase()),
  );

  function handlePrint() {
    if (!selected || !printRef.current) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Рецепт — MedTech</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
            .hospital { font-size: 12px; color: #64748b; }
            .title { font-size: 22px; font-weight: bold; margin-top: 8px; }
            .section { margin-bottom: 16px; }
            .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { font-size: 15px; font-weight: 500; margin-top: 2px; }
            .footer { margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 16px;
                      display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
            .signature-line { border-bottom: 1px solid #1e293b; width: 200px; margin-top: 40px; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hospital">MedTech Здравствен Систем · ${doctor.data?.hospitalName ?? "Болница"}</div>
            <div class="title">МЕДИЦИНСКИ РЕЦЕПТ</div>
          </div>
          <div class="section">
            <div class="label">Доктор</div>
            <div class="value">д-р ${doctor.data?.firstName ?? ""} ${doctor.data?.lastName ?? ""} · ${doctor.data?.specialization ?? ""}</div>
          </div>
          <div class="section">
            <div class="label">Лек</div>
            <div class="value">${selected.medicationName}</div>
          </div>
          <div class="section">
            <div class="label">Доза / Фреквенција</div>
            <div class="value">${selected.dosage} — ${selected.frequency}</div>
          </div>
          ${selected.route ? `<div class="section"><div class="label">Начин на примање</div><div class="value">${selected.route}</div></div>` : ""}
          ${selected.durationDays ? `<div class="section"><div class="label">Траење</div><div class="value">${selected.durationDays} денови</div></div>` : ""}
          ${selected.instructions ? `<div class="section"><div class="label">Инструкции</div><div class="value">${selected.instructions}</div></div>` : ""}
          <div class="section">
            <div class="label">Датум на издавање</div>
            <div class="value">${format(parseISO(selected.startDate), "d MMMM yyyy")}</div>
          </div>
          <div style="margin-top:40px;">
            <div class="label">Потпис на доктор</div>
            <div class="signature-line"></div>
          </div>
          <div class="footer">
            <span>Издадено преку MedTech платформата</span>
            <span>Рецепт #${selected.id}</span>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{px.title}</h1>
          <p className="text-sm text-slate-500">{px.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Patient list */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={px.searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {patientsLoading ? (
            <div className="space-y-2 p-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filteredPatients.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-400">{px.noPatients}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {filteredPatients.map((p: DoctorPatientSummary) => (
                <li key={p.patientId}>
                  <button
                    type="button"
                    onClick={() => { setSelectedPatientId(p.patientId); setSelected(null); }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50",
                      selectedPatientId === p.patientId ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700",
                    )}
                  >
                    {p.patientName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Prescriptions list */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedPatientId ? (
            <EmptyState
              title={px.selectPatient}
              description={px.selectPatientDesc}
              action={<FileText className="h-10 w-10 text-slate-300" />}
            />
          ) : prescriptionsQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
          ) : !prescriptionsQuery.data?.content?.length ? (
            <EmptyState title={px.noRx} description={px.noRxDesc} />
          ) : (
            <motion.div
              className="space-y-3"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {prescriptionsQuery.data.content.map((rx) => (
                <motion.div
                  key={rx.id}
                  variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                  onClick={() => setSelected(selected?.id === rx.id ? null : rx)}
                  className={cn(
                    "cursor-pointer rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md",
                    selected?.id === rx.id ? "border-brand-300 ring-2 ring-brand-100" : "border-slate-200",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{rx.medicationName}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{rx.dosage} · {rx.frequency}</p>
                      {rx.instructions && (
                        <p className="mt-1 text-xs text-slate-400 line-clamp-1">{rx.instructions}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[rx.status])}>
                        {STATUS_LABELS[rx.status]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {format(parseISO(rx.startDate), "d MMM yyyy")}
                      </span>
                    </div>
                  </div>

                  {selected?.id === rx.id && (
                    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
                      <Button onClick={(e) => { e.stopPropagation(); handlePrint(); }} variant="secondary" className="gap-1.5 text-xs">
                        <Printer className="h-3.5 w-3.5" />
                        {px.printBtn}
                      </Button>
                      {rx.status === "ACTIVE" && (
                        <Button
                          onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(rx.id); }}
                          variant="secondary"
                          className="gap-1.5 text-xs text-rose-600 hover:border-rose-300 hover:bg-rose-50"
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {px.cancelBtn}
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div ref={printRef} className="hidden" />
    </div>
  );
}
