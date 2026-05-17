"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Clock, Hospital, MapPin, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Badge, appointmentStatusTone } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { appointmentService } from "@/services/appointment.service";
import { extractErrorMessage } from "@/services/api";
import { formatDate, formatTime, initials } from "@/utils/format";
import type { AppointmentResponse } from "@/types/api";

interface AppointmentCardProps {
  appointment: AppointmentResponse;
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();
  const isTerminal =
    appointment.status === "CANCELLED" ||
    appointment.status === "COMPLETED" ||
    appointment.status === "NO_SHOW";

  const cancelMutation = useMutation({
    mutationFn: () => appointmentService.cancel(appointment.id, "Cancelled by patient"),
    onSuccess: () => {
      toast.success("Appointment cancelled");
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const [firstName, ...rest] = appointment.doctorName.split(" ");
  const lastName = rest.join(" ") || "";

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden rounded-2xl border-l-4 border-l-brand-500 border border-slate-200 bg-white shadow-card"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <div className="flex flex-1 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {initials(firstName, lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{appointment.doctorName}</h3>
              <Badge tone={appointmentStatusTone(appointment.status)}>{appointment.status}</Badge>
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
              {!isTerminal && (
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel appointment
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
