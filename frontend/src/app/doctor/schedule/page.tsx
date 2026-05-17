"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/common/Skeleton";
import { PageBanner } from "@/components/layout/PageBanner";
import { CompleteDoctorProfilePrompt } from "@/components/doctor/CompleteDoctorProfilePrompt";
import { WeeklyCalendar } from "@/components/doctor/WeeklyCalendar";
import { useDoctorProfile } from "@/hooks/useDoctor";

export default function DoctorSchedulePage() {
  const profile = useDoctorProfile();

  return (
    <>
      <PageBanner
        title="Календар на активности"
        breadcrumb={[{ label: "Календар" }, { label: "Распоред" }]}
      />

      <div className="mx-auto max-w-7xl px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {profile.isLoading ? (
            <Skeleton className="h-96" />
          ) : profile.data === null ? (
            <CompleteDoctorProfilePrompt />
          ) : profile.data ? (
            <WeeklyCalendar doctorId={profile.data.id} />
          ) : null}
        </motion.div>
      </div>
    </>
  );
}
