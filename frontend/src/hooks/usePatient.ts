"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { patientService } from "@/services/patient.service";
import { useAuth } from "./useAuth";

/**
 * Fetches the current user's patient profile.
 * Returns null (not error) when the user has not yet created one — the dashboard
 * uses this to prompt the user to complete their profile.
 */
export function usePatientProfile() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && user?.role === "PATIENT";

  return useQuery({
    queryKey: ["patient", "me"],
    queryFn: async () => {
      try {
        return await patientService.me();
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
