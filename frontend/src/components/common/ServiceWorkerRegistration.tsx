"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.info("[SW] Registered, scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("[SW] Registration failed:", err);
        });
    }
  }, []);

  return null;
}
