"use client";

import { motion } from "framer-motion";
import { ArrowRight, LayoutDashboard, FileText, ListChecks, Eye } from "lucide-react";
import { Logo } from "./Logo";
import { useUIStore } from "@/stores/useUIStore";
import { motionTokens } from "@/styles/design-tokens";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const viewTitles: Record<string, string> = {
  dashboard: "لوحة التحكم",
  builder: "محرر النموذج",
  responses: "الاستجابات",
  "response-detail": "تفاصيل الاستجابة",
  filler: "تعبئة النموذج",
};

export function Header() {
  const { view, setView } = useUIStore();
  const title = viewTitles[view.name] ?? "";
  const isFiller = view.name === "filler";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md",
        "supports-[backdrop-filter]:bg-background/70"
      )}
    >
      <div className="flex h-[68px] items-center gap-4 px-4 sm:px-6">
        {/* Emblem + Entity name */}
        <button
          onClick={() => setView({ name: "dashboard" })}
          className="flex items-center gap-3 group"
          aria-label="العودة إلى لوحة التحكم"
        >
          <Logo size={42} className="transition-transform group-hover:scale-105" />
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
              الجمهورية العربية السورية
         
            </span>
            <span className="text-sm font-bold text-foreground">
              منصة النماذج الحكومية
            </span>
          </div>
        </button>

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-border" />

        {/* Current view title */}
        <motion.div
          key={view.name}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: motionTokens.duration.base, ease: motionTokens.ease.smooth }}
          className="flex items-center gap-2"
        >
          {isFiller ? (
            <Eye className="size-4 text-gold" />
          ) : view.name === "dashboard" ? (
            <LayoutDashboard className="size-4 text-gold" />
          ) : view.name === "responses" || view.name === "response-detail" ? (
            <ListChecks className="size-4 text-gold" />
          ) : (
            <FileText className="size-4 text-gold" />
          )}
          <h1 className="text-base font-semibold text-foreground">{title}</h1>
        </motion.div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quick nav for filler → back to dashboard */}
        {isFiller && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setView({ name: "dashboard" })}
            className="gap-2"
          >
            <ArrowRight className="size-4 rtl-flip" />
            العودة للوحة
          </Button>
        )}
      </div>
    </header>
  );
}
