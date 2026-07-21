import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-11 min-w-11 px-4",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-accent)] text-[var(--color-paper)] hover:opacity-90",
        ghost: "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-accent-soft)]",
        outline:
          "border border-[var(--color-line)] bg-transparent hover:bg-[var(--color-accent-soft)]",
        danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}
