export function Progress({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-black/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-400 via-violet-500 to-pink-500 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
