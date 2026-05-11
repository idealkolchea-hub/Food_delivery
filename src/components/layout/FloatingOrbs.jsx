export function FloatingOrbs() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="bb-light-pool bb-light-pool--customer" />
      <div className="bb-light-pool bb-light-pool--restaurant" />
      <div className="bb-light-pool bb-light-pool--delivery" />
      <div className="bb-light-pool bb-light-pool--admin" />
    </div>
  );
}
