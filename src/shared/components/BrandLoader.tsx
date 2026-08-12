"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Logo } from "@/shared/components/layout/Logo";
import { colorTokens, motionTokens } from "@/styles/design-tokens";
import { cn } from "@/lib/utils";

type BrandLoaderVariant = "page" | "section" | "compact";

interface BrandLoaderProps {
  /** Visual size / spacing preset */
  variant?: BrandLoaderVariant;
  /** Arabic status label under the emblem */
  label?: string;
  className?: string;
}

const sizeMap: Record<
  BrandLoaderVariant,
  { logo: number; ring: number; minHeight: string; label: string }
> = {
  page: { logo: 72, ring: 112, minHeight: "min-h-[420px] flex-1", label: "text-sm" },
  section: { logo: 64, ring: 100, minHeight: "min-h-[280px]", label: "text-sm" },
  compact: { logo: 48, ring: 76, minHeight: "min-h-[180px]", label: "text-xs" },
};

/**
 * Branded government loader — emblem + gold orbital ring.
 * Trust & Authority: calm motion, gold accent, Arabic status text.
 * Honors prefers-reduced-motion (static emblem, no spin).
 */
export function BrandLoader({
  variant = "section",
  label = "جارٍ التحميل...",
  className,
}: BrandLoaderProps) {
  const reduceMotion = useReducedMotion();
  const sizes = sizeMap[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-5 px-4 py-10",
        sizes.minHeight,
        className
      )}
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: sizes.ring, height: sizes.ring }}
      >
        {/* Soft gold aura */}
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${colorTokens.gold}33 0%, transparent 68%)`,
          }}
          animate={
            reduceMotion
              ? { opacity: 0.55 }
              : { opacity: [0.35, 0.7, 0.35], scale: [0.96, 1.04, 0.96] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 2.4,
                  ease: "easeInOut",
                  repeat: Infinity,
                }
          }
        />

        {/* Orbital ring */}
        <motion.svg
          aria-hidden
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 2.8, ease: "linear", repeat: Infinity }
          }
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={`${colorTokens.gold}28`}
            strokeWidth="1.5"
          />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={colorTokens.gold}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeDasharray="36 220"
          />
        </motion.svg>

        {/* Inner dashed ring — counter-rotate for depth */}
        <motion.svg
          aria-hidden
          viewBox="0 0 100 100"
          className="absolute inset-[10%] size-[80%]"
          animate={reduceMotion ? undefined : { rotate: -360 }}
          transition={
            reduceMotion
              ? undefined
              : { duration: 5.5, ease: "linear", repeat: Infinity }
          }
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke={`${colorTokens.goldDark}40`}
            strokeWidth="1"
            strokeDasharray="2 8"
          />
        </motion.svg>

        {/* Emblem */}
        <motion.div
          animate={
            reduceMotion
              ? { opacity: 1, scale: 1 }
              : { scale: [1, 1.04, 1], opacity: [0.92, 1, 0.92] }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 2.2,
                  ease: motionTokens.ease.gentle,
                  repeat: Infinity,
                }
          }
          className="relative z-10"
        >
          <Logo size={sizes.logo} />
        </motion.div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <motion.p
          className={cn(
            "font-semibold text-foreground tracking-wide",
            sizes.label
          )}
          animate={reduceMotion ? { opacity: 1 } : { opacity: [0.55, 1, 0.55] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { duration: 1.8, ease: "easeInOut", repeat: Infinity }
          }
        >
          {label}
        </motion.p>
        <p className="text-[11px] text-muted-foreground">
          منصة النماذج الحكومية
        </p>
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
