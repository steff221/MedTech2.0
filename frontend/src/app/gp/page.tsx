// Страница (Next.js): почетен дел за матичен лекар (GP).
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function GPRootPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/gp/overview"); }, [router]);
  return null;
}
