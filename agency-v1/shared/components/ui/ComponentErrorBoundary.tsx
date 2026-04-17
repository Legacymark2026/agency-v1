'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
    title?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ComponentErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ComponentErrorBoundary caught an error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center p-6 border border-red-200 bg-red-50 rounded-xl space-y-4">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-red-800">
                            {this.props.title || 'Error cargando componente'}
                        </h3>
                        <p className="text-sm text-red-600 max-w-md mt-1">
                            {this.state.error?.message || 'Ha ocurrido un problema inesperado renderizando esta sección.'}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="bg-white hover:bg-red-50 text-red-600 border-red-200"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Reintentar
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
