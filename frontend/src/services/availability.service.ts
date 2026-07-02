// API сервис: повици за слободните термини на докторите.
import { api } from "./api";
import type { AvailabilitySlotRequest, AvailabilitySlotResponse } from "@/types/api";

export const availabilityService = {
  getForDoctor: (doctorId: number) =>
    api.get<AvailabilitySlotResponse[]>(`/doctors/${doctorId}/availability`).then((r) => r.data),

  saveMySchedule: (slots: AvailabilitySlotRequest[]) =>
    api.put<AvailabilitySlotResponse[]>("/doctors/me/availability", slots).then((r) => r.data),
};
