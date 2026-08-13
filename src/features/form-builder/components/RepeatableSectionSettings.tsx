"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Repeat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdjustableState } from "@/features/form-builder/hooks/useAdjustableState";
import { motionTokens } from "@/styles/design-tokens";
import type { Section } from "@/shared/types";

const MIN_BOUND = 0;
const MAX_BOUND = 20;

interface RepeatableSectionSettingsProps {
  isRepeatable: boolean;
  minRepeat: number;
  maxRepeat: number;
  repeatLabel: string;
  onChange: (
    patch: Partial<Pick<Section, "minRepeat" | "maxRepeat" | "repeatLabel">>
  ) => void;
}

/**
 * RepeatableSectionSettings — local draft + steppers.
 * Commits on stepper click, blur, or Enter — one PATCH per change, not per keystroke.
 */
export function RepeatableSectionSettings({
  isRepeatable,
  minRepeat,
  maxRepeat,
  repeatLabel,
  onChange,
}: RepeatableSectionSettingsProps) {
  const [minDraft, setMinDraft] = useAdjustableState(minRepeat);
  const [maxDraft, setMaxDraft] = useAdjustableState(maxRepeat);
  const [labelDraft, setLabelDraft] = useAdjustableState(repeatLabel);

  const commitMin = (next: number) => {
    const clamped = clampInt(next, MIN_BOUND, MAX_BOUND);
    const nextMax = Math.max(clamped, maxDraft);
    setMinDraft(clamped);
    if (nextMax !== maxDraft) setMaxDraft(nextMax);
    if (clamped === minRepeat && nextMax === maxRepeat) return;
    onChange({ minRepeat: clamped, maxRepeat: nextMax });
  };

  const commitMax = (next: number) => {
    const clamped = clampInt(next, minDraft, MAX_BOUND);
    setMaxDraft(clamped);
    if (clamped === maxRepeat) return;
    onChange({ maxRepeat: clamped });
  };

  const commitLabel = () => {
    const trimmed = labelDraft.trim();
    if (trimmed === repeatLabel) return;
    onChange({ repeatLabel: trimmed });
  };

  const previewCount = Math.min(3, Math.max(1, maxDraft));
  const previewName = labelDraft.trim() || "نسخة";

  return (
    <AnimatePresence initial={false}>
      {isRepeatable && (
        <motion.div
          key="repeatable-settings"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            duration: motionTokens.duration.fast,
            ease: motionTokens.ease.smooth,
          }}
          className="overflow-hidden"
        >
          <div className="px-4 pb-4 pt-1">
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 space-y-4">
              <div className="flex items-center gap-2 text-gold-dark">
                <Repeat className="size-4" aria-hidden="true" />
                <span className="text-sm font-medium">إعدادات التكرار</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StepperField
                  id="repeat-min"
                  label="الحد الأدنى"
                  value={minDraft}
                  min={MIN_BOUND}
                  max={MAX_BOUND}
                  onStep={(delta) => commitMin(minDraft + delta)}
                />
                <StepperField
                  id="repeat-max"
                  label="الحد الأقصى"
                  value={maxDraft}
                  min={minDraft}
                  max={MAX_BOUND}
                  onStep={(delta) => commitMax(maxDraft + delta)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="repeat-label" className="text-xs text-muted-foreground">
                  اسم كل نسخة
                </Label>
                <Input
                  id="repeat-label"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  onBlur={commitLabel}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="مثال: مشروع"
                  className="h-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: previewCount }, (_, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="font-normal text-[11px] bg-background"
                  >
                    {previewName} #{i + 1}
                  </Badge>
                ))}
                {maxDraft > previewCount && (
                  <span className="text-[11px] text-muted-foreground">
                    … حتى {maxDraft}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                سيُطلب من المستخدم تعبئة هذا القسم بين {minDraft} و {maxDraft} مرة.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepperField({
  id,
  label,
  value,
  min,
  max,
  onStep,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onStep: (delta: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => onStep(-1)}
          disabled={value <= min}
          aria-label={`إنقاص ${label}`}
        >
          <Minus className="size-4" aria-hidden="true" />
        </Button>
        <Input
          id={id}
          readOnly
          value={value}
          className="h-9 text-center tabular-nums"
          aria-live="polite"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => onStep(1)}
          disabled={value >= max}
          aria-label={`زيادة ${label}`}
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function clampInt(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}
