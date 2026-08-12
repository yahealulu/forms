import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** When true, renders a faint low-opacity version (used on success screen). */
  faint?: boolean;
  size?: number;
}

/**
 * Government entity emblem.
 * Uses the official emblem PNG (eagle + three stars, gold/beige).
 * {LOGO_PLACEHOLDER — official emblem attached at /public/emblem.png}
 */
export function Logo({ className, faint = false, size = 44 }: LogoProps) {
  return (
    <Image
      src="/emblem.png"
      alt="شعار الجهة الحكومية"
      width={size}
      height={size}
      style={{ width: size, height: "auto" }}
      className={cn(
        "object-contain shrink-0",
        faint && "opacity-[0.06]",
        className
      )}
      priority
    />
  );
}
