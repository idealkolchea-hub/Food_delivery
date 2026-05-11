export function Avatar({ src, alt, size = 'md' }) {
  const sizes = {
    sm: 'h-10 w-10',
    md: 'h-12 w-12',
    lg: 'h-14 w-14',
  };
  return (
    <div className={`${sizes[size]} overflow-hidden rounded-full border border-white/15 bg-white/10 shadow-glass`}>
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}
