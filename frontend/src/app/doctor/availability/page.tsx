"use client";

import { motion } from "framer-motion";
import { Clock, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PageBanner } from "@/components/layout/PageBanner";
import { Skeleton } from "@/components/common/Skeleton";
import { availabilityService } from "@/services/availability.service";
import { useDoctorProfile } from "@/hooks/useDoctor";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";
import { extractErrorMessage } from "@/services/api";
import type { AvailabilitySlotRequest } from "@/types/api";

const DEFAULT_START = "08:00";
const DEFAULT_END   = "16:00";

interface DayState {
  dayOfWeek: number;
  active: boolean;
  startTime: string;
  endTime: string;
}

function buildDefaults(): DayState[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i + 1,
    active: i < 5, // Mon–Fri active by default
    startTime: DEFAULT_START,
    endTime: DEFAULT_END,
  }));
}

export default function DoctorAvailabilityPage() {
  const t = useT();
  const at = t.doctorAvailability;
  const qc = useQueryClient();
  const { data: doctor } = useDoctorProfile();

  const [days, setDays] = useState<DayState[]>(buildDefaults);

  const { data: existing, isLoading } = useQuery({
    queryKey: ["doctor-availability", doctor?.id],
    queryFn: () => availabilityService.getForDoctor(doctor!.id),
    enabled: !!doctor,
  });

  // Merge server data into local state once loaded
  useEffect(() => {
    if (!existing) return;
    setDays((prev) =>
      prev.map((d) => {
        const server = existing.find((s) => s.dayOfWeek === d.dayOfWeek);
        if (!server) return d;
        return {
          ...d,
          active: server.active,
          startTime: server.startTime.slice(0, 5),
          endTime: server.endTime.slice(0, 5),
        };
      }),
    );
  }, [existing]);

  const save = useMutation({
    mutationFn: () => {
      const slots: AvailabilitySlotRequest[] = days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        active: d.active,
        startTime: d.active ? d.startTime : null,
        endTime: d.active ? d.endTime : null,
      }));
      return availabilityService.saveMySchedule(slots);
    },
    onSuccess: () => {
      toast.success(at.saved);
      qc.invalidateQueries({ queryKey: ["doctor-availability"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err) ?? "Failed to save"),
  });

  const toggle = (dow: number) =>
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dow ? { ...d, active: !d.active } : d)),
    );

  const setTime = (dow: number, field: "startTime" | "endTime", value: string) =>
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dow ? { ...d, [field]: value } : d)),
    );

  return (
    <>
      <PageBanner
        title={at.title}
        breadcrumb={[{ label: "Лекар" }, { label: at.title }]}
        actions={
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {at.save}
          </button>
        }
      />

      <div className="mx-auto max-w-2xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="mb-6 text-sm text-slate-500">{at.subtitle}</p>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {isLoading
              ? Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="border-b border-slate-100 px-5 py-4">
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))
              : days.map((day, idx) => (
                  <motion.div
                    key={day.dayOfWeek}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={cn(
                      "flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0 transition-colors",
                      !day.active && "bg-slate-50/60",
                    )}
                  >
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggle(day.dayOfWeek)}
                      className={cn(
                        "flex h-5 w-9 flex-shrink-0 items-center rounded-full px-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1",
                        day.active ? "bg-emerald-500" : "bg-slate-300",
                      )}
                      aria-label={at.workingDay}
                    >
                      <span
                        className={cn(
                          "block h-4 w-4 rounded-full bg-white shadow transition-transform",
                          day.active ? "translate-x-4" : "translate-x-0",
                        )}
                      />
                    </button>

                    {/* Day name */}
                    <span
                      className={cn(
                        "w-28 text-sm font-semibold",
                        day.active ? "text-slate-800" : "text-slate-400",
                      )}
                    >
                      {at.dayNames[day.dayOfWeek]}
                    </span>

                    {/* Time pickers */}
                    {day.active ? (
                      <div className="flex flex-1 items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500">{at.from}</span>
                          <input
                            type="time"
                            value={day.startTime}
                            onChange={(e) => setTime(day.dayOfWeek, "startTime", e.target.value)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>
                        <span className="text-slate-400">—</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">{at.to}</span>
                          <input
                            type="time"
                            value={day.endTime}
                            onChange={(e) => setTime(day.dayOfWeek, "endTime", e.target.value)}
                            className="rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="flex-1 text-xs text-slate-400 italic">
                        {at.notAvailable}
                      </span>
                    )}
                  </motion.div>
                ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => save.mutate()}
              disabled={save.isPending}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              <Save className="h-4 w-4" />
              {save.isPending ? "Зачувување…" : at.save}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
