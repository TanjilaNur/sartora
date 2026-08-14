export function Spinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-primary/20 border-t-primary dark:border-secondary/20 dark:border-t-secondary ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner size={32} />
    </div>
  );
}
