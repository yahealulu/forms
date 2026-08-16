"use client";

import { memo } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReorderButtonsProps {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  upLabel: string;
  downLabel: string;
  compact?: boolean;
}

export const ReorderButtons = memo(function ReorderButtons({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  upLabel,
  downLabel,
  compact = false,
}: ReorderButtonsProps) {
  const size = compact ? "size-7" : "size-8";
  const icon = compact ? "size-3.5" : "size-4";
  return (
    <div className="flex flex-col shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(size, "rounded-b-none text-muted-foreground hover:text-foreground")}
        disabled={!canMoveUp}
        onClick={onMoveUp}
        aria-label={upLabel}
      >
        <ChevronUp className={icon} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(size, "rounded-t-none text-muted-foreground hover:text-foreground")}
        disabled={!canMoveDown}
        onClick={onMoveDown}
        aria-label={downLabel}
      >
        <ChevronDown className={icon} />
      </Button>
    </div>
  );
});
