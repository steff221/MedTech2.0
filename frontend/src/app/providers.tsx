"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            background: "rgba(15, 23, 42, 0.92)",
            color: "#f8fafc",
            fontSize: "13px",
            fontWeight: 500,
            padding: "12px 16px",
            boxShadow:
              "0 10px 25px -10px rgba(6, 182, 212, 0.4), 0 4px 6px -1px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(10px)",
          },
          success: {
            iconTheme: { primary: "#06d6a0", secondary: "#0f172a" },
            style: {
              borderRadius: "12px",
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              border: "1px solid rgba(6, 214, 160, 0.3)",
              boxShadow: "0 10px 25px -10px rgba(6, 214, 160, 0.4)",
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 500,
              backdropFilter: "blur(10px)",
            },
          },
          error: {
            iconTheme: { primary: "#f43f5e", secondary: "#0f172a" },
            style: {
              borderRadius: "12px",
              background: "rgba(15, 23, 42, 0.92)",
              color: "#f8fafc",
              border: "1px solid rgba(244, 63, 94, 0.3)",
              boxShadow: "0 10px 25px -10px rgba(244, 63, 94, 0.4)",
              padding: "12px 16px",
              fontSize: "13px",
              fontWeight: 500,
              backdropFilter: "blur(10px)",
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
