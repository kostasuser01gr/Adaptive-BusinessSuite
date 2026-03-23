import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType<{
    data: Record<string, any>;
    onNext: (stepData: Record<string, any>) => void;
    isLastStep: boolean;
  }>;
}

interface FormWizardProps {
  steps: WizardStep[];
  onComplete: (data: Record<string, any>) => void;
  className?: string;
}

export function FormWizard({ steps, onComplete, className }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleNext = (stepData: Record<string, any>) => {
    const newData = { ...formData, ...stepData };
    setFormData(newData);

    if (currentStep === steps.length - 1) {
      onComplete(newData);
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const CurrentComponent = steps[currentStep].component;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  index === currentStep
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-1",
                  index < currentStep ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step title (mobile) */}
      <h2 className="text-lg font-heading font-semibold sm:hidden">
        {steps[currentStep].title}
      </h2>

      {/* Step component */}
      <CurrentComponent
        data={formData}
        onNext={handleNext}
        isLastStep={currentStep === steps.length - 1}
      />

      {/* Navigation */}
      {currentStep > 0 && (
        <div className="flex justify-start">
          <Button variant="outline" size="sm" onClick={handleBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
