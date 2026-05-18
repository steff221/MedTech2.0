"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import React, { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional override of the fallback UI. */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time errors in the subtree and shows a recoverable fallback
 * instead of an Application-wide white screen. React class components are the
 * only reliable way to do this today; deliberately not a hook.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Hook for whatever observability you wire up later (Sentry, Datadog, …).
    // For now, keep it loud in dev so you don't miss it.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-card">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            Something went wrong on this page
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {this.state.error?.message ?? "Unexpected error."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={this.reset}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Try again
            </button>
            <a
              href="/"
              className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
