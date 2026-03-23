import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedMount } from "@/components/animation/AnimatedMount";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <AnimatedMount className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
          <div className="bg-card/60 backdrop-blur-lg border border-white/[0.06] rounded-2xl p-10 shadow-xl max-w-md w-full flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-5">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-heading font-semibold mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        </AnimatedMount>
      );
    }

    return this.props.children;
  }
}
