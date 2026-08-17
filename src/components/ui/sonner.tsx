"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  Check,
  CircleAlert,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { colorTokens } from "@/styles/design-tokens";
import { cn } from "@/lib/utils";

function ToastGlyph({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg",
        className
      )}
    >
      {children}
    </span>
  );
}

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      dir="rtl"
      position="top-center"
      closeButton
      duration={4000}
      gap={12}
      visibleToasts={3}
      offset={{ top: "1.25rem" }}
      className="toaster group"
      containerAriaLabel="إشعارات النظام"
      icons={{
        success: (
          <ToastGlyph className="bg-gold/15 text-gold-dark">
            <Check className="size-4" strokeWidth={2.4} />
          </ToastGlyph>
        ),
        error: (
          <ToastGlyph className="bg-destructive/10 text-destructive">
            <CircleAlert className="size-4" />
          </ToastGlyph>
        ),
        warning: (
          <ToastGlyph className="bg-gold/15 text-gold-dark">
            <TriangleAlert className="size-4" />
          </ToastGlyph>
        ),
        info: (
          <ToastGlyph className="bg-charcoal/8 text-charcoal">
            <Info className="size-4" />
          </ToastGlyph>
        ),
        loading: (
          <ToastGlyph className="bg-gold/15 text-gold-dark">
            <LoaderCircle className="size-4 animate-spin" />
          </ToastGlyph>
        ),
        close: <X className="size-3.5" />,
      }}
      toastOptions={{
        closeButtonAriaLabel: "إغلاق الإشعار",
        classNames: {
          toast: "gov-toast",
          title: "gov-toast-title",
          description: "gov-toast-description",
          actionButton: "gov-toast-action",
          cancelButton: "gov-toast-cancel",
          closeButton: "gov-toast-close",
          icon: "gov-toast-icon",
        },
      }}
      style={
        {
          "--normal-bg": colorTokens.paper,
          "--normal-text": colorTokens.charcoal,
          "--normal-border": colorTokens.goldLight,
          "--success-bg": colorTokens.paper,
          "--success-text": colorTokens.charcoal,
          "--success-border": colorTokens.gold,
          "--error-bg": colorTokens.paper,
          "--error-text": colorTokens.charcoal,
          "--error-border": "oklch(0.58 0.21 25)",
          "--border-radius": "0.75rem",
          fontFamily: "var(--font-cairo), sans-serif",
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
