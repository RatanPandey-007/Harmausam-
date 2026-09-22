import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./button";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        secondary:
          "border-transparent bg-slate-800 text-slate-300 border-slate-700",
        outline: "text-slate-300 border-slate-700",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        danger:
          "border-rose-500/30 bg-rose-500/10 text-rose-400",
        scientific:
          "border-cyan-500/40 bg-slate-900/90 text-cyan-300 font-mono text-[11px] uppercase tracking-wider",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
