"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, Plus, Eye, ListChecks } from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";
import { motionTokens } from "@/styles/design-tokens";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  view: Parameters<ReturnType<typeof useUIStore.getState>["setView"]>[0];
}

export function Sidebar() {
  const { view, setView } = useUIStore();

  const items: NavItem[] = [
    {
      label: "لوحة التحكم",
      icon: LayoutDashboard,
      view: { name: "dashboard" },
    },
  ];

  // Contextual items when inside a form
  if (view.name === "builder" || view.name === "responses" || view.name === "response-detail") {
    const formId = view.formId;
    items.push(
      {
        label: "محرر النموذج",
        icon: Plus,
        view: { name: "builder", formId },
      },
      {
        label: "الاستجابات",
        icon: ListChecks,
        view: { name: "responses", formId },
      }
    );
  }

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-border bg-sidebar/50 h-[calc(100vh-68px)] sticky top-[68px]">
      <nav className="flex-1 p-4 space-y-1.5">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          التنقل
        </p>
        {items.map((item) => {
          const active =
            (item.view.name === "dashboard" && view.name === "dashboard") ||
            (item.view.name === "builder" && view.name === "builder") ||
            (item.view.name === "responses" &&
              (view.name === "responses" || view.name === "response-detail"));
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              onClick={() => setView(item.view)}
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.snappy }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60"
              )}
            >
              <Icon className={cn("size-4", active && "text-gold")} />
              {item.label}
              {active && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute right-0 h-6 w-1 rounded-full bg-gold"
                  style={{ marginRight: "-1px" }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer note */}
      <div className="p-4 border-t border-border">
        <div className="rounded-lg bg-sidebar-accent/50 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">نظام إصدار 1.0</p>
          <p>منصة حكومية لإدارة النماذج الإلكترونية الديناميكية.</p>
        </div>
      </div>
    </aside>
  );
}
