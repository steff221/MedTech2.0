"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Calendar, ChevronDown, Clock, Hospital, MapPin, Star, Video, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Link from "next/link";
import { Badge, appointmentStatusTone } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { StarRating } from "@/components/common/StarRating";
import { RateAppointmentModal } from "@/components/patient/RateAppointmentModal";
import { appointmentService } from "@/services/appointment.service";
import { extractErrorMessage } from "@/services/api";
import { formatDate, formatTime, initials } from "@/utils/format";
import { useT } from "@/hooks/useT";
import type { AppointmentResponse } from "@/types/api";

interface AppointmentCardProps {
  appointment: AppointmentResponse;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const qc = useQueryClient();
  const t = useT();
  const isTerminal =
    appointment.status === "CANCELLED" ||
    appointment.status === "COMPLETED" ||
    appointment.status === "NO_SHOW";
  const isCompleted = appointment.status === "COMPLETED";
  const canRate = isCompleted && appointment.ratingId == null;

  const accentColor =
    appointment.status === "COMPLETED" ? "bg-emerald-500" :
    appointment.status === "CANCELLED" ? "bg-rose-400" :
    appointment.status === "NO_SHOW"   ? "bg-slate-400" :
    "bg-amber-400";

  const cancelMutation = useMutation({
    mutationFn: () => appointmentService.cancel(appointment.id, "Cancelled by patient"),
    onSuccess: () => {
      toast.success(t.appointments.cancelBtn);
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const [firstName, ...rest] = appointment.doctorName.split(" ");
  const lastName = rest.join(" ") || "";

  const statusLabel =
    t.apptStatus[appointment.status as keyof typeof t.apptStatus] ?? appointment.status;

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card"
    >
      {/* Left accent bar */}
      <div className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${accentColor}`} />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-4 pl-5 pr-5 pt-5 pb-5 text-left"
      >
        <div className="flex flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(firstName, lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{appointment.doctorName}</h3>
              <Badge tone={appointmentStatusTone(appointment.status)}>{statusLabel}</Badge>
            </div>
            {appointment.doctorSpecialization && (
              <p className="text-sm text-slate-500">{appointment.doctorSpecialization}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formatDate(appointment.appointmentDate)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-slate-400" />
                {formatTime(appointment.appointmentTime)} · {appointment.durationMinutes} min
              </span>
            </div>
          </div>
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-5 py-4">
              {appointment.hospitalName && (
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                  <Hospital className="h-4 w-4 text-slate-400" />
                  {appointment.hospitalName}
                </div>
              )}
              {appointment.reason && (
                <div className="mb-3 flex items-start gap-2 text-sm text-slate-600">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{appointment.reason}</span>
                </div>
              )}
              {appointment.videoCallUrl && !isTerminal && (
                <a
                  href={appointment.videoCallUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors w-fit"
                >
                  <Video className="h-4 w-4" />
                  {t.appointments.joinVideoCall}
                </a>
              )}
              {/* Rating section for completed appointments */}
              {isCompleted && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  {canRate ? (
                    <button
                      type="button"
                      onClick={() => setRatingModalOpen(true)}
                      className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      <Star className="h-4 w-4" />
                      {t.appointments.rateVisit}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Your rating:</span>
                      <StarRating
                        value={appointment.ratingValue ?? 0}
                        readonly
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                {!isTerminal && (
                  <Button
                    size="sm"
                    variant="danger"
                    loading={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                  >
                    <X className="h-3.5 w-3.5" />
                    {t.appointments.cancelBtn}
                  </Button>
                )}
                <Link
                  href={`/appointments/${appointment.id}`}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  {t.appointments.details} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <RateAppointmentModal
        appointmentId={appointment.id}
        doctorName={appointment.doctorName}
        open={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
      />
    </motion.div>
  );
}
