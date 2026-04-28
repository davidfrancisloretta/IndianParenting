import { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-gradient-to-r from-green-200 via-blue-200 to-purple-200 text-white shadow-soft hover:translate-y-0 hover:shadow-lg",
        variant === "secondary" &&
          "bg-white text-ink shadow-soft ring-1 ring-purple-200 hover:bg-purple-50",
        variant === "ghost" && "bg-transparent text-ink hover:bg-white/60",
        variant === "danger" && "bg-coral text-white hover:bg-[#ee644b]",
        className,
      )}
      {...props}
    />
  );
}
