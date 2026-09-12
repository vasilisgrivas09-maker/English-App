import Image from "next/image";
import logo from "@/public/logo.png";

/**
 * Το λογότοπο σε μαύρο πλαίσιο. Είναι πάνω από το fold, άρα φορτώνεται με
 * προτεραιότητα και σε ακριβές μέγεθος για να μην κοστίζει τίποτα στο layout.
 */
export function BrandMark({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-[12px] bg-black ring-1 ring-brand-600/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={logo}
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
