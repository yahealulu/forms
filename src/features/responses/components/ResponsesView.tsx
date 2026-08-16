"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  FileText,
  Inbox,
  Percent,
  CalendarClock,
  PencilLine,
} from "lucide-react";
import { useForm } from "@/features/forms-management/hooks/useForms";
import { useFormResponses } from "../hooks/useResponses";
import { useUIStore } from "@/stores/useUIStore";
import { FadeIn } from "@/shared/components/motion";
import { motionTokens } from "@/styles/design-tokens";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BrandLoader } from "@/shared/components/BrandLoader";
import { ResponsesTable } from "./ResponsesTable";
import { ResponseDetailSheet } from "./ResponseDetailSheet";

export function ResponsesView({ formId }: { formId: string }) {
  const setView = useUIStore((s) => s.setView);
  const { data: form, isLoading: formLoading } = useForm(formId);
  const { data: responses, isLoading: responsesLoading } = useFormResponses(formId);

  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const stats = useMemo(() => {
    const list = responses ?? [];
    const total = list.length;
    const avg =
      total === 0
        ? 0
        : Math.round(list.reduce((a, r) => a + r.completion, 0) / total);
    const latest = list
      .map((r) => new Date(r.submittedAt).getTime())
      .filter((t) => !Number.isNaN(t))
      .sort((a, b) => b - a)[0];
    return { total, avg, latest };
  }, [responses]);

  const openRow = (responseId: string) => {
    setSelectedResponseId(responseId);
    setSheetOpen(true);
  };

  const loading = formLoading || responsesLoading;

  return (
    <div className="flex flex-col flex-1">
      {/* Header / hero band */}
      <div className="border-b border-border bg-gradient-to-b from-sidebar/40 to-background">
        <div className="px-6 py-7 max-w-7xl mx-auto w-full">
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0"
                  onClick={() => setView({ name: "builder", formId })}
                  aria-label="العودة إلى المحرر"
                  title="العودة إلى المحرر"
                >
                  <ArrowRight className="size-4 rtl-flip" />
                </Button>
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground tracking-tight truncate">
                      {form?.title ?? (formLoading ? "…" : "—")}
                    </h2>
                    <Badge
                      variant="outline"
                      className="bg-gold/10 border-gold/30 text-gold-dark gap-1"
                    >
                      <Inbox className="size-3" />
                      {(responses?.length ?? 0).toLocaleString("ar-EG")} استجابة
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form?.entityName ?? "—"} · استجابات النموذج
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setView({ name: "builder", formId })}
                >
                  <PencilLine className="size-4" />
                  تحرير النموذج
                </Button>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.05}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                icon={Inbox}
                label="إجمالي الاستجابات"
                value={
                  loading
                    ? "—"
                    : stats.total.toLocaleString("ar-EG")
                }
              />
              <StatCard
                icon={Percent}
                label="متوسط الاكتمال"
                value={loading ? "—" : `${stats.avg.toLocaleString("ar-EG")}%`}
                accent
              />
              <StatCard
                icon={CalendarClock}
                label="أحدث إرسال"
                value={
                  loading
                    ? "—"
                    : stats.latest
                      ? new Date(stats.latest).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"
                }
              />
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-6 max-w-7xl mx-auto w-full">
        {loading && !responses ? (
          <BrandLoader variant="section" label="جارٍ تحميل الاستجابات..." />
        ) : responses && responses.length > 0 ? (
          <ResponsesTable
            responses={responses}
            form={form}
            loading={false}
            onRowClick={openRow}
          />
        ) : (
          <EmptyState />
        )}
      </div>

      <ResponseDetailSheet
        formId={formId}
        responseId={selectedResponseId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-4 py-4 gap-0 relative overflow-hidden",
        accent && "border-gold/30"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums truncate">
            {value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            accent
              ? "bg-gold/15 text-gold-dark"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-muted mb-5">
        <Inbox className="size-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">
        لا توجد استجابات بعد لهذا النموذج
      </h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
        بمجرد أن يبدأ المتقدمون بتعبئة النموذج ونشره، ستظهر الاستجابات هنا
        لإدارتها ومراجعتها.
      </p>
    </FadeIn>
  );
}
