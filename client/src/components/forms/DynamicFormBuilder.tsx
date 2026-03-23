import React from "react";
import { useForm, Controller } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface FormFieldDef {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "select" | "checkbox" | "date" | "textarea";
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

interface DynamicFormProps {
  fields: FormFieldDef[];
  onSubmit: (data: Record<string, any>) => void;
  defaultValues?: Record<string, any>;
  submitLabel?: string;
  className?: string;
}

export function DynamicFormBuilder({
  fields,
  onSubmit,
  defaultValues,
  submitLabel = "Submit",
  className,
}: DynamicFormProps) {
  const { control, handleSubmit } = useForm({ defaultValues });

  const renderField = (field: FormFieldDef) => (
    <Controller
      key={field.name}
      name={field.name}
      control={control}
      rules={{ required: field.required }}
      render={({ field: fieldProps, fieldState }) => {
        const errorMsg = fieldState.error?.message || (fieldState.error ? "Required" : "");

        switch (field.type) {
          case "text":
          case "email":
          case "number":
          case "date":
            return (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                <Input
                  {...fieldProps}
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder || field.label}
                />
                {errorMsg && (
                  <p className="text-xs text-destructive">{errorMsg}</p>
                )}
              </div>
            );

          case "textarea":
            return (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                <Textarea
                  {...fieldProps}
                  id={field.name}
                  placeholder={field.placeholder || field.label}
                  rows={3}
                />
                {errorMsg && (
                  <p className="text-xs text-destructive">{errorMsg}</p>
                )}
              </div>
            );

          case "select":
            return (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                <select
                  {...fieldProps}
                  id={field.name}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errorMsg && (
                  <p className="text-xs text-destructive">{errorMsg}</p>
                )}
              </div>
            );

          case "checkbox":
            return (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={fieldProps.value}
                  onCheckedChange={fieldProps.onChange}
                />
                <Label htmlFor={field.name} className="text-sm font-normal">
                  {field.label}
                </Label>
              </div>
            );

          default:
            return <></>;

        }
      }}
    />
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
    >
      {fields.map(renderField)}
      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
