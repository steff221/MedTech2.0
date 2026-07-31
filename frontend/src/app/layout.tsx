// Главен (root) layout на апликацијата — заеднички за сите страници.
import type { Metadata } from "next";
import { Bitter, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Providers } from "./providers";
import { ServiceWorkerRegistration } from "@/components/common/ServiceWorkerRegistration";
import "./globals.css";

// Every face loads the Cyrillic subset. The interface is Macedonian first, and
// the previous Inter setup requested "latin" only — so all Cyrillic text was
// silently falling back to a system font.

// Display: slab serif. Documentary and institutional, like a form heading.
const bitter = Bitter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-bitter",
  weight: ["400", "600", "700"],
  display: "swap",
});

// Body and UI.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "cyrillic"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// MKB-10 codes, record numbers, vitals, timestamps.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MedTech · Здравствена платформа",
    template: "%s · MedTech",
  },
  description: "Закажи прегледи, следи рецепти и пристапи до медицинската историја.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MedTech",
  },
  themeColor: "#10262b",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    apple: "/apple-touch-icon.png",
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="mk"
      className={`${bitter.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <body className="font-sans">
        <ServiceWorkerRegistration />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
