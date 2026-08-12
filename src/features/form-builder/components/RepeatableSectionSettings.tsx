"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Repeat, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motionTokens } from "@/styles/design-tokens";
import type { Section } from "@/shared/types";

interface RepeatableSectionSettingsProps {
  isRepeatable: boolean;
  minRepeat: number;
  maxRepeat: number;
  repeatLabel: string;
  onChange: (patch: Partial<Pick<Section, "minRepeat" | "maxRepeat" | "repeatLabel">>) => void;
}

/**
 * RepeatableSectionSettings — the min/max + repeat-label inputs that appear
 * when a section is toggled to "repeatable". Smoothly expands/collapses via
 * Framer Motion height-auto animation.
 *
 * Constraints: minRepeat 0..20, maxRepeat 0..20, maxRepeat >= minRepeat.
 */
export function RepeatableSectionSettings({
  isRepeatable,
  minRepeat,
  maxRepeat,
  repeatLabel,
  onChange,
}: RepeatableSectionSettingsProps) {
  return (
    <AnimatePresence initial={false}>
      {isRepeatable && (
        <motion.div
          key="repeatable-settings"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            duration: motionTokens.duration.slow,
            ease: motionTokens.ease.smooth,
          }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 pt-1">
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
              <div className="flex items-center gap-2 mb-3 text-gold-dark">
                <Repeat className="size-4" />
                <span className="text-sm font-medium">إعدادات القسم القابل للتكرار</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`min-${repeatLabel}`} className="text-xs text-muted-foreground">
                    الحد الأدنى للتكرار
                  </Label>
                  <Input
                    id={`min-${repeatLabel}`}
                    type="number"
                    min={0}
                    max={20}
                    value={minRepeat}
                    onChange={(e) => {
                      const v = clampInt(e.target.value, 0, 20);
                      onChange({
                        minRepeat: v,
                        maxRepeat: Math.max(v, maxRepeat),
                      });
                    }}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`max-${repeatLabel}`} className="text-xs text-muted-foreground">
                    الحد الأقصى للتكرار
                  </Label>
                  <Input
                    id={`max-${repeatLabel}`}
                    type="number"
                    min={0}
                    max={20}
                    value={maxRepeat}
                    onChange={(e) => {
                      const v = clampInt(e.target.value, 0, 20);
                      onChange({
                        maxRepeat: Math.max(v, minRepeat),
                      });
                    }}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`label-${repeatLabel}`} className="text-xs text-muted-foreground">
                    اسم كل نسخة
                  </Label>
                  <div className="relative">
                    <Tag className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <Input
                      id={`label-${repeatLabel}`}
                      value={repeatLabel}
                      onChange={(e) => onChange({ repeatLabel: e.target.value })}
                      placeholder="مثال: مشروع"
                      className="h-9 pr-8"
                    />
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                سيُطلب من المستخدم تعبئة هذا القسم بين {minRepeat} و {maxRepeat} مرة،
                وتظهر كل نسخة بعنوان «{repeatLabel || "نسخة"} #1، #2...».
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function clampInt(value: string, min: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.max(min, Math.min(max, parsed));
}
