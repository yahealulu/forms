"use client";

import { toast } from "sonner";

export function toastUndo(message: string, onUndo: () => void) {
  toast(message, {
    action: {
      label: "تراجع",
      onClick: onUndo,
    },
  });
}
