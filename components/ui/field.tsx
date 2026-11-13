import * as React from "react";
import { cn } from "@/lib/utils";

function FieldGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-3.5 w-full", className)}
      {...props}
    />
  );
}

function Field({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field"
      className={cn("flex flex-col gap-1.5 w-full", className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "text-xs font-semibold tracking-wide text-foreground select-none",
        className,
      )}
      {...props}
    />
  );
}

export { FieldGroup, Field, FieldLabel };

