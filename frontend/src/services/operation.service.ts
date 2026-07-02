// API сервис: повици за операции.
import { api } from "./api";
import type { OperationResponse, ScheduleOperationRequest, Page } from "@/types/api";

export const operationService = {
  myOperations: (page = 0, size = 50) =>
    api
      .get<Page<OperationResponse>>("/operations", { params: { page, size, sort: "operationDate,desc" } })
      .then((r) => r.data),

  schedule: (body: ScheduleOperationRequest) =>
    api.post<OperationResponse>("/operations", body).then((r) => r.data),
};
