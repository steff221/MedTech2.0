// Тестови за report.service (извештаи).
import { describe, it, expect, vi, beforeEach } from "vitest";
import { reportService } from "@/services/report.service";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/store/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: null, setAuth: vi.fn(), logout: vi.fn() }),
  },
}));

const mockGet  = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut  = vi.mocked(api.put);

beforeEach(() => vi.clearAllMocks());

const MOCK_REPORT = {
  id: 1,
  reportNumber: "RP-2026-001",
  periodType: "MONTHLY",
  periodLabel: "Мај 2026",
  periodStart: "2026-05-01",
  periodEnd: "2026-05-31",
  patientCount: 38,
  diagnosisCount: 52,
  appointmentCount: 40,
  prescriptionCount: 15,
  status: "SUBMITTED",
  submittedAt: "2026-06-01T10:00:00",
  createdAt: "2026-05-31T09:00:00",
};

describe("reportService.myReports", () => {
  it("calls GET /reports/my with pagination params", async () => {
    mockGet.mockResolvedValueOnce({ data: { content: [MOCK_REPORT], totalElements: 1 } });
    const result = await reportService.myReports(0, 50);
    expect(mockGet).toHaveBeenCalledWith("/reports/my", { params: { page: 0, size: 50 } });
    expect(result.content[0].reportNumber).toBe("RP-2026-001");
  });
});

describe("reportService.generate", () => {
  it("calls POST /reports with the request body", async () => {
    mockPost.mockResolvedValueOnce({ data: { ...MOCK_REPORT, status: "DRAFT" } });
    const req = { periodType: "MONTHLY" as const, year: 2026, periodUnit: 5 };
    const result = await reportService.generate(req);
    expect(mockPost).toHaveBeenCalledWith("/reports", req);
    expect(result.status).toBe("DRAFT");
  });
});

describe("reportService.submit", () => {
  it("calls PUT /reports/:id/submit", async () => {
    mockPut.mockResolvedValueOnce({ data: { ...MOCK_REPORT, status: "SUBMITTED" } });
    const result = await reportService.submit(1);
    expect(mockPut).toHaveBeenCalledWith("/reports/1/submit");
    expect(result.status).toBe("SUBMITTED");
  });
});
