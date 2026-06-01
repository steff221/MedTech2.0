"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { doctorService } from "@/services/doctor.service";
import { useAuth } from "./useAuth";

/**
 * Current user's doctor profile. Returns null (not error) when the user is a
 * DOCTOR but has not yet completed the profile — the layout uses this to gate
 * the calendar.
 */
export function useDoctorProfile() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && (user?.role === "DOCTOR" || user?.role === "GENERAL_PRACTITIONER");

  return useQuery({
    queryKey: ["doctor", "me"],
    queryFn: async () => {
      try {
        return await doctorService.me();
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled,
  });
}
