"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Plus,
  ListChecks,
  Eye,
  Trash2,
  Pencil,
  MoreVertical,
  CheckCircle2,
  FileEdit,
  Inbox,
  Link2,
  Copy,
  ExternalLink,
  Power,
  PowerOff,
} from "lucide-react";
import {
  useForms,
  useCreateForm,
  useDeleteForm,
  useUpdateForm,
  type FormListItem,
} from "../hooks/useForms";
import { useUIStore } from "@/stores/useUIStore";
import { motionTokens } from "@/styles/design-tokens";
import { FadeIn, StaggerList, StaggerItem } from "@/shared/components/motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Form } from "@/shared/types";
import { cn } from "@/lib/utils";
import { BrandLoader } from "@/shared/components/BrandLoader";
import { copyPublicFormUrl, getPublicFormUrl } from "@/shared/lib/public-form-url";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusLabels: Record<Form["status"], { label: string; variant: "default" | "secondary" | "outline" }> = {
  published: { label: "منشور", variant: "default" },
  draft: { label: "مسودة", variant: "secondary" },
  archived: { label: "مؤرشف", variant: "outline" },
};

export function FormsListView() {
  const { data: forms, isLoading } = useForms();
  const setView = useUIStore((s) => s.setView);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormListItem | null>(null);

  const stats = {
    total: forms?.length ?? 0,
    published: forms?.filter((f) => f.status === "published").length ?? 0,
    draft: forms?.filter((f) => f.status === "draft").length ?? 0,
    responses: forms?.reduce((acc, f) => acc + (f._responseCount ?? 0), 0) ?? 0,
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="flex flex-col flex-1">
      {/* Hero / Stats band */}
      <div className="border-b border-border bg-gradient-to-b from-sidebar/40 to-background">
        <div className="px-6 py-8 max-w-7xl mx-auto w-full">
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  النماذج الإلكترونية
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  أنشئ وأدر النماذج الديناميكية مع دعم الأقسام القابلة للتكرار.
                </p>
              </div>
              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-2 animate-attention-pulse"
                size="lg"
              >
                <Plus className="size-4" />
                إنشاء نموذج جديد
              </Button>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={FileText} label="إجمالي النماذج" value={stats.total} loading={isLoading} />
            <StatCard icon={CheckCircle2} label="منشورة" value={stats.published} loading={isLoading} accent />
            <StatCard icon={FileEdit} label="مسودات" value={stats.draft} loading={isLoading} />
            <StatCard icon={Inbox} label="الاستجابات" value={stats.responses} loading={isLoading} />
          </div>
        </div>
      </div>

      {/* Forms grid */}
      <div className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <BrandLoader variant="section" label="جارٍ تحميل النماذج..." />
        ) : forms && forms.length > 0 ? (
          <StaggerList className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {forms.map((form) => (
              <StaggerItem key={form.id}>
                <FormCard
                  form={form}
                  onOpenBuilder={() => setView({ name: "builder", formId: form.id })}
                  onOpenResponses={() => setView({ name: "responses", formId: form.id })}
                  onOpenFiller={() => setView({ name: "filler", formId: form.id })}
                  onDelete={() => setDeleteTarget(form)}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        ) : (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        )}
      </div>

      <CreateFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteFormDialog
        form={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
    </TooltipProvider>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  loading: boolean;
  accent?: boolean;
}) {
  return (
    <Card className={cn("p-4 relative overflow-hidden", accent && "border-gold/30")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
            {loading ? "—" : value}
          </p>
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            accent ? "bg-gold/15 text-gold-dark" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function FormCard({
  form,
  onOpenBuilder,
  onOpenResponses,
  onOpenFiller,
  onDelete,
}: {
  form: FormListItem;
  onOpenBuilder: () => void;
  onOpenResponses: () => void;
  onOpenFiller: () => void;
  onDelete: () => void;
}) {
  const updateForm = useUpdateForm(form.id);
  const status = statusLabels[form.status];
  const updated = new Date(form.updatedAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const isPublished = form.status === "published";
  const isEnabled = form.isEnabled !== false;

  const handleCopyLink = async () => {
    try {
      await copyPublicFormUrl(form.id);
      toast.success("تم نسخ رابط النموذج");
    } catch {
      toast.error("تعذّر نسخ الرابط");
    }
  };

  const handleOpenLink = () => {
    window.open(getPublicFormUrl(form.id), "_blank", "noopener,noreferrer");
  };

  const handleToggleEnabled = () => {
    updateForm.mutate(
      { isEnabled: !isEnabled },
      {
        onSuccess: () =>
          toast.success(isEnabled ? "تم تعطيل النموذج" : "تم تفعيل النموذج"),
        onError: () => toast.error("تعذّر تحديث حالة النموذج"),
      }
    );
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: motionTokens.duration.fast, ease: motionTokens.ease.snappy }}
      className="h-full"
    >
      <Card className="h-full p-5 flex flex-col gap-4 group hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold-dark">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="font-semibold text-foreground text-base leading-snug break-words line-clamp-3"
                title={form.title}
              >
                {form.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-1 break-words line-clamp-1">
                {form.entityName}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="المزيد">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onOpenBuilder} className="gap-2">
                <Pencil className="size-4" /> تحرير النموذج
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenFiller} className="gap-2">
                <Eye className="size-4" /> معاينة التعبئة
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenResponses} className="gap-2">
                <ListChecks className="size-4" /> عرض الاستجابات
              </DropdownMenuItem>
              {isPublished && (
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
                  <Link2 className="size-4" /> نسخ الرابط
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" /> حذف النموذج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {form.description || "لا يوجد وصف"}
        </p>

        <div className="flex items-center gap-2 flex-wrap mt-auto">
          <Badge variant={status.variant} className="gap-1">
            {status.label}
          </Badge>
          {isPublished && !isEnabled && (
            <Badge variant="outline" className="gap-1 border-amber-500/40 text-amber-700 bg-amber-50">
              معطّل
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 font-normal">
            <ListChecks className="size-3" />
            {form._questionCount ?? 0} سؤال
          </Badge>
          <Badge variant="outline" className="gap-1 font-normal">
            <Inbox className="size-3" />
            {form._responseCount ?? 0} استجابة
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
          <span className="text-[11px] text-muted-foreground shrink-0">آخر تحديث: {updated}</span>
          <div className="flex items-center gap-1">
            {isPublished && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyLink}
                      className="size-9 shrink-0"
                      aria-label="نسخ رابط النموذج"
                    >
                      <Copy className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">نسخ الرابط</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleOpenLink}
                      className="size-9 shrink-0"
                      aria-label="فتح النموذج في تبويب جديد"
                    >
                      <ExternalLink className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">فتح في تبويب جديد</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleToggleEnabled}
                      disabled={updateForm.isPending}
                      className={cn(
                        "size-9 shrink-0",
                        !isEnabled && "border-amber-500/40 text-amber-700 hover:bg-amber-50"
                      )}
                      aria-label={isEnabled ? "تعطيل النموذج" : "تفعيل النموذج"}
                    >
                      {isEnabled ? (
                        <PowerOff className="size-4" />
                      ) : (
                        <Power className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isEnabled ? "تعطيل النموذج" : "تفعيل النموذج"}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="default"
                  onClick={onOpenBuilder}
                  className="size-9 shrink-0"
                  aria-label="تحرير النموذج"
                >
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">تحرير</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-muted mb-5">
        <FileText className="size-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">لا توجد نماذج بعد</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
        ابدأ بإنشاء نموذجك الأول. يمكنك إضافة أقسام وأسئلة وخيارات، مع دعم
        الأقسام القابلة للتكرار.
      </p>
      <Button onClick={onCreate} className="gap-2">
        <Plus className="size-4" />
        إنشاء نموذج
      </Button>
    </FadeIn>
  );
}

function CreateFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [entityName, setEntityName] = useState("");
  const createForm = useCreateForm();

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("يرجى إدخال عنوان النموذج");
      return;
    }
    createForm.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        entityName: entityName.trim() || "الجهة الحكومية",
      },
      {
        onSuccess: (form) => {
          toast.success("تم إنشاء النموذج بنجاح");
          setTitle("");
          setDescription("");
          setEntityName("");
          onOpenChange(false);
          useUIStore.getState().setView({ name: "builder", formId: form.id });
        },
        onError: () => toast.error("تعذر إنشاء النموذج"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>إنشاء نموذج جديد</DialogTitle>
          <DialogDescription>
            أدخل المعلومات الأساسية للنموذج. يمكنك تعديل التفاصيل لاحقاً في المحرر.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="form-title">عنوان النموذج *</Label>
            <Input
              id="form-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: طلب ترخيص نشاط تجاري"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-entity">اسم الجهة</Label>
            <Input
              id="form-entity"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="مثال: بلدية المنطقة الكبرى"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-desc">الوصف</Label>
            <Textarea
              id="form-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف موجز لغرض النموذج..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={createForm.isPending} className="gap-2">
            {createForm.isPending ? "جارٍ الإنشاء..." : "إنشاء"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteFormDialog({
  form,
  onClose,
}: {
  form: FormListItem | null;
  onClose: () => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [forceDelete, setForceDelete] = useState(false);
  const deleteForm = useDeleteForm();

  const responseCount = form?._responseCount ?? 0;
  const hasResponses = responseCount > 0;
  const canConfirm = confirmText === "حذف" && (!hasResponses || forceDelete);

  const handleDelete = () => {
    if (!form) return;
    deleteForm.mutate(
      { formId: form.id, confirmText, forceDelete: hasResponses ? forceDelete : undefined },
      {
        onSuccess: () => {
          toast.success("تم حذف النموذج");
          setConfirmText("");
          setForceDelete(false);
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "تعذر الحذف");
        },
      }
    );
  };

  return (
    <AlertDialog
      open={!!form}
      onOpenChange={(o) => {
        if (!o) {
          setConfirmText("");
          setForceDelete(false);
          onClose();
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-[460px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            تأكيد حذف النموذج
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                أنت على وشك حذف النموذج{" "}
                <span className="font-semibold text-foreground">«{form?.title}»</span>.
                لا يمكن التراجع عن هذا الإجراء.
              </p>
              {hasResponses && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  هذا النموذج يحتوي على{" "}
                  <span className="font-bold">{responseCount}</span> استجابة.
                  سيتم حذف جميع الاستجابات المرتبطة به نهائياً.
                </div>
              )}
              <p className="text-sm">
                لكتابة كلمة <span className="font-bold text-destructive">«حذف»</span> لتأكيد العملية:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="حذف"
                className="text-center font-semibold"
              />
              {hasResponses && confirmText === "حذف" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    className="size-4 rounded border-border"
                  />
                  أوافق على حذف النموذج وجميع استجاباته نهائياً
                </label>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!canConfirm || deleteForm.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteForm.isPending ? "جارٍ الحذف..." : "حذف نهائي"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
