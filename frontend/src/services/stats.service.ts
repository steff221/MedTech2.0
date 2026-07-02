// API сервис: повици за збирни статистики.
import { api } from "./api";
import type { StatsOverviewResponse } from "@/types/api";

export const statsService = {
  overview: () =>
    api.get<StatsOverviewResponse>("/stats/overview").then((r) => r.data),
};
