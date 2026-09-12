import Image from "next/image";

/**
 * Το λογότυπο (μυαλό + δάφνη) σε μαύρο πλαίσιο — ίδιο σήμα με favicon / PWA.
 */
export function BrandMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-[12px] bg-black ring-1 ring-brand-600/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/icons/logo-mark.png"
        alt="ManThinketh"
        width={size}
        height={size}
        sizes={`${size}px`}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}
