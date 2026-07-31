// React компонента: модал за оценување на термин/доктор.
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { StarRating } from "@/components/common/StarRating";
import { useT } from "@/hooks/useT";
import { ratingService } from "@/services/rating.service";
import { extractErrorMessage } from "@/services/api";

interface RateAppointmentModalProps {
  appointmentId: number;
  doctorName: string;
  open: boolean;
  onClose: () => void;
}

export function RateAppointmentModal({
  appointmentId,
  doctorName,
  open,
  onClose,
}: RateAppointmentModalProps) {
  const t = useT();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      ratingService.submit(appointmentId, {
        rating,
        comment: comment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(t.appointments.feedbackThanks);
      qc.invalidateQueries({ queryKey: ["appointments"] });
      onClose();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleClose = () => {
    setRating(0);
    setComment("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Rate your visit with ${doctorName}`}>
      <div className="space-y-5">
        <div>
          <p className="mb-3 text-sm text-slate-600">
            How was your experience? Your feedback helps other patients choose the right doctor.
          </p>
          <div className="flex justify-center py-2">
            <StarRating value={rating} onChange={setRating} size="lg" showLabel />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Comment <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Споделете што беше добро или што може да се подобри…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{comment.length}/1000</p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={rating === 0}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Submit rating
          </Button>
        </div>
      </div>
    </Modal>
  );
}
