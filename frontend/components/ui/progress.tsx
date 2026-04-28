export function Progress({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-purple-50">
      <div
        className="h-full rounded-full bg-gradient-to-r from-green-200 via-blue-200 to-purple-200 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
