"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrandLoader } from "@/shared/components/BrandLoader";
import { colorTokens, motionTokens } from "@/styles/design-tokens";

const SPLASH_MS = 900;

/**
 * One-shot branded splash on first paint.
 * Covers the shell while fonts/layout settle, then fades out.
 */
export function AppSplash() {
  const [visible, setVisible] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const delay = reduceMotion ? 200 : SPLASH_MS;
    const timer = window.setTimeout(() => setVisible(false), delay);
    return () => window.clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="app-splash"
          role="status"
          aria-live="polite"
          aria-busy="true"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: {
              duration: motionTokens.duration.slow,
              ease: motionTokens.ease.smooth,
            },
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: `linear-gradient(165deg, ${colorTokens.paper} 0%, #F5F0E8 45%, ${colorTokens.paper} 100%)`,
          }}
        >
          {/* Subtle paper texture wash */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: `radial-gradient(ellipse at 30% 20%, ${colorTokens.gold}18 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, ${colorTokens.charcoal}08 0%, transparent 45%)`,
            }}
          />
          <BrandLoader variant="page" label="جارٍ تجهيز المنصة..." className="min-h-0" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
