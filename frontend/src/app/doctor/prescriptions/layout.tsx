import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Рецепти | MedTech Doctor",
};

export default function PrescriptionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
