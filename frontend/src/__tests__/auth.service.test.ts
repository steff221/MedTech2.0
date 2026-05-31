import { describe, it, expect, vi, beforeEach } from "vitest";
import { authService } from "@/services/auth.service";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Silence zustand store initialisation in the api interceptors
vi.mock("@/store/auth.store", () => ({
  useAuthStore: {
    getState: () => ({ accessToken: null, setAuth: vi.fn(), logout: vi.fn() }),
  },
}));

const mockPost = vi.mocked(api.post);
const mockGet  = vi.mocked(api.get);

beforeEach(() => {
  vi.clearAllMocks();
});

const MOCK_AUTH_RESPONSE = {
  accessToken: "tok",
  user: { id: 1, email: "a@b.com", firstName: "A", lastName: "B", role: "PATIENT" },
};

describe("authService.login", () => {
  it("calls POST /auth/login and returns the response data", async () => {
    mockPost.mockResolvedValueOnce({ data: MOCK_AUTH_RESPONSE });
    const result = await authService.login({ email: "a@b.com", password: "pw" });
    expect(mockPost).toHaveBeenCalledWith("/auth/login", { email: "a@b.com", password: "pw" });
    expect(result.accessToken).toBe("tok");
  });
});

describe("authService.register", () => {
  it("calls POST /auth/register", async () => {
    mockPost.mockResolvedValueOnce({ data: MOCK_AUTH_RESPONSE });
    await authService.register({ email: "a@b.com", password: "pw", firstName: "A", lastName: "B", role: "PATIENT" } as never);
    expect(mockPost).toHaveBeenCalledWith("/auth/register", expect.objectContaining({ email: "a@b.com" }));
  });
});

describe("authService.verifyEmail", () => {
  it("calls GET /auth/verify-email with encoded token", async () => {
    mockGet.mockResolvedValueOnce({ data: undefined });
    await authService.verifyEmail("tok+en");
    expect(mockGet).toHaveBeenCalledWith("/auth/verify-email?token=tok%2Ben");
  });
});

describe("authService.forgotPassword", () => {
  it("calls POST /auth/forgot-password with the email", async () => {
    mockPost.mockResolvedValueOnce({ data: undefined });
    await authService.forgotPassword("test@example.com");
    expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", { email: "test@example.com" });
  });
});
