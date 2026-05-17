"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppointmentCard } from "@/components/patient/AppointmentCard";
import { BookAppointmentWizard } from "@/components/patient/BookAppointmentWizard";
import { CompleteProfilePrompt } from "@/components/patient/CompleteProfilePrompt";
import { QuickActionTiles } from "@/components/patient/QuickActionTiles";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { Skeleton } from "@/components/common/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePatientProfile } from "@/hooks/usePatient";
import { patientService } from "@/services/patient.service";

export default function DashboardPage() {
  const { user } = useAuth();
  const profile = usePatientProfile();
  const [bookOpen, setBookOpen] = useState(false);

  const appointments = useQuery({
    queryKey: ["appointments", profile.data?.id],
    queryFn: () => patientService.appointments(profile.data!.id),
    enabled: !!profile.data?.id,
  });

  const upcoming = appointments.data?.content.filter((a) => a.status === "SCHEDULED") ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-sm font-medium text-brand-600">
          {greet()}, {user?.firstName ?? "there"}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Your health, one place.</h1>
        <p className="mt-1 text-slate-500">
          Manage appointments, prescriptions, and records — all in one dashboard.
        </p>
      </motion.div>

      {profile.isLoading ? (
        <Skeleton className="h-32" />
      ) : profile.data === null ? (
        <CompleteProfilePrompt />
      ) : (
        <>
          <QuickActionTiles upcomingCount={upcoming.length} />

          <section>
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Upcoming appointments</h2>
                <p className="text-sm text-slate-500">
                  {upcoming.length} scheduled
                </p>
              </div>
              <Button onClick={() => setBookOpen(true)}>
                <Plus className="h-4 w-4" />
                Book appointment
              </Button>
            </div>

            {appointments.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-28" />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming appointments"
                description="Book your first appointment to get started."
                action={<Button onClick={() => setBookOpen(true)}>Book appointment</Button>}
              />
            ) : (
              <motion.div
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {upcoming.slice(0, 5).map((apt) => (
                  <motion.div
                    key={apt.id}
                    variants={{
                      hidden: { opacity: 0, x: -16 },
                      visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
                    }}
                  >
                    <AppointmentCard appointment={apt} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

          {profile.data && (
            <BookAppointmentWizard
              open={bookOpen}
              onClose={() => setBookOpen(false)}
              patientId={profile.data.id}
            />
          )}
        </>
      )}
    </div>
  );
}

function greet(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
