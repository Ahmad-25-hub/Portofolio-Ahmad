/** Text that rolls up to a duplicate on hover of the nearest link/button. */
export default function RollText({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`roll ${className}`}>
      <span>{children}</span>
      <span aria-hidden>{children}</span>
    </span>
  );
}
