// Страница (Next.js): упати — дел за матичен лекар (GP).
//
// This was a ~530-line copy of the surgeon portal's page, so every referral
// change had to be made twice and the two copies drifted. The GP portal issues
// the same referrals from the same screen.
//
// The ФЗОМ form does differ by issuer — матичен лекар → ЛУ-1/РДУ-1,
// специјалист → ЛУ-2/РДУ-2 — but that is resolved server-side from the
// authenticated user's role, so one component serves both portals correctly.
export { default } from "@/app/doctor/referrals/page";
