// Deterministic cartoon avatar via DiceBear Lorelei style.
// Free, no auth, identical output for the same seed string.

interface AvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

export function Avatar({ seed, size = 40, className = "" }: AvatarProps) {
  const safe = encodeURIComponent(seed || "speaker");
  const src = `https://api.dicebear.com/8.x/lorelei/svg?seed=${safe}&backgroundColor=fef3c7,dbeafe,d1fae5,fce7f3&radius=50`;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={seed} width={size} height={size} className="block" />
    </span>
  );
}
