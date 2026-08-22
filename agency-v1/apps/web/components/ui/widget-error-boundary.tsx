"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  title?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[WidgetErrorBoundary] Caught UI exception:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-4 rounded-xl bg-slate-900/60 border border-amber-500/30 backdrop-blur-md text-slate-200 flex flex-col items-center justify-center text-center gap-3 my-2 shadow-lg">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-100">
              {this.props.title || "Módulo temporalmente no disponible"}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              {this.props.fallbackMessage || "Este componente sufrió una pausa. El resto de la plataforma sigue operando normalmente."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleRetry}
            className="h-8 border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reintentar componente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
