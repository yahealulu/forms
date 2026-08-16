"use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/shared/components/layout/Logo";
import { useUIStore } from "@/stores/useUIStore";
import { motionTokens } from "@/styles/design-tokens";

export interface SubmitSuccessAnimationProps {
  /** Called when the user dismisses the overlay. */
  onDismiss?: () => void;
  /** Public fill: dismiss only. Admin preview: return to dashboard. */
  mode?: "admin" | "public";
}

/**
 * SubmitSuccessAnimation — a composed, professional success overlay.
 *
 * Three-step GSAP timeline:
 *   1. Draw the SVG circle (stroke-dashoffset → 0, 0.6s, power2.out)
 *   2. Draw the checkmark path (same technique, 0.4s)
 *   3. Fade in the success text + button (delay +=0.1)
 *
 * Uses `gsap.context()` for safe cleanup on unmount.
 */
export function SubmitSuccessAnimation({
  onDismiss,
  mode = "admin",
}: SubmitSuccessAnimationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Step 1: Draw the circle
      if (circleRef.current) {
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        gsap.set(circleRef.current, {
          strokeDasharray: circumference,
          strokeDashoffset: circumference,
        });
        tl.to(circleRef.current, {
          strokeDashoffset: 0,
          duration: 0.6,
          ease: "power2.out",
        });
      }

      // Step 2: Draw the checkmark (starts right after the circle)
      if (checkRef.current) {
        const path = checkRef.current;
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        tl.to(
          path,
          {
            strokeDashoffset: 0,
            duration: 0.4,
            ease: "power2.out",
          },
          ">-0.05"
        );
      }

      // Step 3: Fade in the text + button
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
          "+=0.1"
        );
      }
      if (buttonRef.current) {
        tl.fromTo(
          buttonRef.current,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: motionTokens.duration.base,
            ease: "power2.out",
          },
          "-=0.2"
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const setView = useUIStore((s) => s.setView);
  const isPublic = mode === "public";
  const [closeBlocked, setCloseBlocked] = useState(false);

  const handleReturn = () => {
    if (!isPublic) {
      onDismiss?.();
      setView({ name: "dashboard" });
      return;
    }
    // Tab opened via window.open can close itself. Direct URL visits cannot.
    window.close();
    setCloseBlocked(true);
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "color-mix(in srgb, var(--background) 80%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="تم إرسال الاستمارة بنجاح"
    >
      {/* Faint logo as identity element */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Logo faint size={320} />
      </div>

      <div className="relative flex flex-col items-center text-center max-w-md">
        {/* SVG success icon */}
        <svg
          width="140"
          height="140"
          viewBox="0 0 120 120"
          className="mb-6"
          aria-hidden="true"
        >
          {/* Soft background disc */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="var(--gold)"
            fillOpacity="0.08"
          />
          {/* The animated gold ring */}
          <circle
            ref={circleRef}
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="4"
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
          {/* The animated checkmark */}
          <path
            ref={checkRef}
            d="M40 62 L54 76 L82 46"
            fill="none"
            stroke="var(--gold-dark)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div ref={textRef} className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            تم إرسال استمارتك بنجاح
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            شكراً لك. سيتم مراجعة طلبك.
          </p>
        </div>

        <div ref={buttonRef} className="mt-8 space-y-3">
          <Button
            type="button"
            size="lg"
            onClick={handleReturn}
            className="bg-gold-gradient text-white hover:opacity-90 shadow-sm"
          >
            {isPublic ? (
              <>
                <X className="size-4" />
                إغلاق التبويب
              </>
            ) : (
              "العودة للوحة التحكم"
            )}
          </Button>
          {isPublic && closeBlocked && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              تعذّر إغلاق التبويب تلقائياً. يمكنك إغلاقه يدوياً من المتصفح.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
