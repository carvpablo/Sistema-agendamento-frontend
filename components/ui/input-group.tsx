import * as React from "react";
import { cn } from "@/lib/utils";

function InputGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "relative flex items-center w-full rounded-xl bg-background border border-input focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all",
        className,
      )}
      {...props}
    />
  );
}

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      data-slot="input-group-input"
      className={cn(
        "flex-1 w-full bg-transparent px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 tabular-nums",
        className,
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = "InputGroupInput";

function InputGroupAddon({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "flex items-center justify-center pr-3 pl-1 text-muted-foreground pointer-events-none shrink-0 [&_svg]:w-4 [&_svg]:h-4",
        className,
      )}
      {...props}
    />
  );
}

export { InputGroup, InputGroupInput, InputGroupAddon };

