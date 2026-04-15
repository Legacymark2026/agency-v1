"use client";

import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="bg-red-500/10 p-4 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Algo salió mal
          </h2>
          <p className="text-slate-400 mb-6 max-w-md">
            {this.state.error?.message || "Ha ocurrido un error inesperado"}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
            <Button onClick={() => window.location.href = "/dashboard"}>
              <Home className="mr-2 h-4 w-4" />
              Ir al Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorCard({ message = "Error al cargar los datos" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-red-500/20 rounded-lg bg-red-500/5">
      <AlertTriangle className="h-8 w-8 text-red-500 mb-3" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}