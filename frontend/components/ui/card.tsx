import { HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("rounded-2xl bg-white p-4 shadow-soft ring-1 ring-black/5", className)} {...props} />;
}
