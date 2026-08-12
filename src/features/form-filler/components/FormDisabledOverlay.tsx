"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { Ban } from "lucide-react";
import { Logo } from "@/shared/components/layout/Logo";
import { motionTokens } from "@/styles/design-tokens";

export interface FormDisabledOverlayProps {
  formTitle?: string;
}

/**
 * Full-screen overlay shown when a published form is temporarily disabled.
 * Matches the success overlay layout for a consistent public experience.
 */
export function FormDisabledOverlay({ formTitle }: FormDisabledOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      if (iconRef.current) {
        tl.fromTo(
          iconRef.current,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.4)" }
        );
      }
      if (textRef.current) {
        tl.fromTo(
          textRef.current,
          { opacity: 0, y: 12 },
          {
            opacity: 1,
            y: 0,
            duration: motionTokens.duration.slow,
            ease: "power2.out",
          },
          "-=0.15"
        );
      }
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 min-h-screen"
      style={{
        backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      role="alert"
      aria-live="polite"
      aria-label="النموذج معطّل"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Logo faint size={320} />
      </div>

      <div className="relative flex flex-col items-center text-center max-w-md">
        <div
          ref={iconRef}
          className="mb-6 flex size-[140px] items-center justify-center rounded-full bg-muted/60 ring-4 ring-muted"
        >
          <Ban className="size-16 text-muted-foreground" strokeWidth={1.5} />
        </div>

        <div ref={textRef} className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">النموذج معطّل حالياً</h2>
          {formTitle && (
            <p className="text-sm font-medium text-foreground/80">{formTitle}</p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">
            لا يمكن تعبئة هذا النموذج في الوقت الحالي. يرجى المحاولة لاحقاً أو
            التواصل مع الجهة المختصة.
          </p>
        </div>
      </div>
    </div>
  );
}
