"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Inbox,
  Mail,
  Clock,
} from "lucide-react";
import type { FormResponse } from "@/shared/types";
import { motionTokens } from "@/styles/design-tokens";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { BrandLoader } from "@/shared/components/BrandLoader";
import { CompletionBar } from "./AnswerDisplay";

type SortField = "submittedAt" | "completion";
type SortDir = "asc" | "desc";

/**
 * Counts the total number of section instances that contain answers in a
 * response — useful as a "scope" metric in the table.
 */
function countInstances(res: FormResponse): number {
  return res.sections.reduce((acc, s) => acc + s.instances.length, 0);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ResponsesTable({
  responses,
  loading,
  onRowClick,
}: {
  responses: FormResponse[];
  loading: boolean;
  onRowClick: (responseId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("submittedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? responses.filter((r) => {
          const name = (r.submitterName ?? "").toLowerCase();
          const email = (r.submitterEmail ?? "").toLowerCase();
          return name.includes(q) || email.includes(q);
        })
      : responses;
    const sorted = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === "submittedAt") {
        cmp =
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      } else {
        cmp = a.completion - b.completion;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [responses, query, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "submittedAt" ? "desc" : "asc");
    }
  };

  if (loading) {
    return <BrandLoader variant="section" label="جارٍ تحميل الاستجابات..." />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search / toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            className="pr-9 bg-background"
            aria-label="بحث في الاستجابات"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-normal gap-1">
            <Inbox className="size-3" />
            {filtered.length.toLocaleString("ar-EG")} استجابة
          </Badge>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyTable hasQuery={query.trim().length > 0} />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right font-semibold text-foreground h-11 px-4">
                  مقدم الطلب
                </TableHead>
                <SortHeader
                  label="تاريخ الإرسال"
                  active={sortField === "submittedAt"}
                  dir={sortDir}
                  onClick={() => toggleSort("submittedAt")}
                />
                <SortHeader
                  label="نسبة الاكتمال"
                  active={sortField === "completion"}
                  dir={sortDir}
                  onClick={() => toggleSort("completion")}
                />
                <TableHead className="text-right font-semibold text-foreground h-11 px-4">
                  عدد العناصر
                </TableHead>
                <TableHead className="text-center font-semibold text-foreground h-11 px-4">
                  إجراءات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, idx) => (
                <ResponseRow
                  key={r.id}
                  response={r}
                  index={idx}
                  onClick={() => onRowClick(r.id)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <TableHead
      className="text-right font-semibold text-foreground h-11 px-4"
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-gold-dark -mr-1 pr-1",
          active && "text-gold-dark"
        )}
      >
        <span>{label}</span>
        {active ? (
          dir === "asc" ? (
            <ChevronUp className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

function ResponseRow({
  response,
  index,
  onClick,
}: {
  response: FormResponse;
  index: number;
  onClick: () => void;
}) {
  const instances = countInstances(response);
  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: motionTokens.duration.base,
        ease: motionTokens.ease.smooth,
        delay: Math.min(index * motionTokens.stagger.list, 0.4),
      }}
      onClick={onClick}
      className="cursor-pointer hover:bg-muted/50 transition-colors group"
    >
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold-dark text-xs font-semibold">
            {(response.submitterName || "؟")
              .trim()
              .charAt(0)
              .toLocaleUpperCase("ar")}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {response.submitterName || "مقدم طلب غير محدد"}
            </div>
            {response.submitterEmail && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <Mail className="size-3" />
                <span className="truncate" dir="ltr">
                  {response.submitterEmail}
                </span>
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm text-foreground">
          <Clock className="size-3.5 text-muted-foreground" />
          <span
            className="truncate"
            title={formatDateTime(response.submittedAt)}
          >
            {formatDate(response.submittedAt)}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 min-w-[140px]">
        <CompletionBar value={response.completion} className="max-w-[180px]" />
      </TableCell>
      <TableCell className="px-4 py-3">
        <Badge variant="outline" className="font-normal tabular-nums">
          {instances.toLocaleString("ar-EG")}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-gold-dark hover:bg-gold/10 hover:text-gold-dark"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <Eye className="size-4" />
          عرض
        </Button>
      </TableCell>
    </motion.tr>
  );
}

function EmptyTable({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-card/50">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mb-3">
        <Inbox className="size-7 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">
        {hasQuery ? "لا توجد نتائج مطابقة لبحثك" : "لا توجد استجابات لعرضها"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {hasQuery
          ? "جرّب تعديل كلمات البحث أو مسحها."
          : "ستظهر الاستجابات هنا عند تقديمها."}
      </p>
    </div>
  );
}
