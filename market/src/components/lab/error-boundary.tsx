"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; fallbackTitle?: string };
type State = { error: Error | null };

export class LabErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-lg border border-error/40 bg-error-container p-4 text-sm text-on-surface">
          <p className="font-bold text-error">{this.props.fallbackTitle ?? "خطا در آزمایشگاه"}</p>
          <p className="mt-2 text-on-surface-variant">{this.state.error.message}</p>
          <button
            type="button"
            className="mt-3 text-primary underline"
            onClick={() => this.setState({ error: null })}
          >
            تلاش مجدد
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
