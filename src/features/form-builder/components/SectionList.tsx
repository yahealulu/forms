"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/features/form-builder/store/useBuilderStore";
import { SectionCard } from "./SectionCard";
import { FadeIn } from "@/shared/components/motion";
import { Layers } from "lucide-react";

export function SectionList() {
  const sectionOrder = useBuilderStore((s) => s.sectionOrder);
  const addSection = useBuilderStore((s) => s.addSection);

  if (sectionOrder.length === 0) {
    return (
      <>
        <EmptyState onAddSection={addSection} />
        <div className="mt-5">
          <AddSectionButton onClick={addSection} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {sectionOrder.map((sectionId, index) => (
          <SectionCard
            key={sectionId}
            sectionId={sectionId}
            index={index}
            canMoveUp={index > 0}
            canMoveDown={index < sectionOrder.length - 1}
          />
        ))}
      </div>
      <div className="mt-5">
        <AddSectionButton onClick={addSection} />
      </div>
    </>
  );
}

function AddSectionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="w-full gap-2 border-dashed border-2 text-gold-dark hover:bg-gold/5 hover:border-gold"
    >
      <Plus className="size-4" />
      إضافة قسم
    </Button>
  );
}

function EmptyState({ onAddSection }: { onAddSection: () => void }) {
  return (
    <FadeIn className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-gold/10 mb-5">
        <Layers className="size-10 text-gold-dark" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">ابدأ بإضافة قسم</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5 max-w-sm">
        لا توجد أقسام بعد. أضف قسماً أول ثم ابدأ ببناء أسئلة النموذج. يمكنك لاحقاً
        تكرار الأقسام لمتطلبات مثل «عدة مشاريع».
      </p>
      <Button onClick={onAddSection} className="gap-2 builder-cta" size="lg">
        <Plus className="size-4" />
        إضافة القسم الأول
      </Button>
    </FadeIn>
  );
}
