export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass-card overflow-hidden ${className}`}>
      <div className="shimmer h-full w-full" />
    </div>
  );
}
