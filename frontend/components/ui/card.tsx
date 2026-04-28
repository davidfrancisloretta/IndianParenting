import { HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-purple-50 p-4 shadow-soft ring-1 ring-purple-200",
        className,
      )}
      {...props}
    />
  );
}
