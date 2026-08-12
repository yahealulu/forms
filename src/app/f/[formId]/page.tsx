"use client";

import { use } from "react";
import { FormFillerView } from "@/features/form-filler/components/FormFillerView";

export default function PublicFillPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);

  return (
    <div className="min-h-screen bg-background">
      <FormFillerView formId={formId} mode="public" />
    </div>
  );
}
