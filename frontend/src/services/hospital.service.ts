// API сервис: повици за болници.
import { api } from "./api";
import type { HospitalResponse } from "@/types/api";

export const hospitalService = {
  listActive: () =>
    api.get<HospitalResponse[]>("/hospitals/active").then((r) => r.data),
};
