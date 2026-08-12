"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUIStore } from "@/stores/useUIStore";
import { Header } from "@/shared/components/layout/Header";
import { Sidebar } from "@/shared/components/layout/Sidebar";
import { Footer } from "@/shared/components/layout/Footer";
import { motionTokens } from "@/styles/design-tokens";
import { FormsListView } from "@/features/forms-management/components/FormsListView";
import { FormBuilderView } from "@/features/form-builder/components/FormBuilderView";
import { ResponsesView } from "@/features/responses/components/ResponsesView";
import { ResponseDetailView } from "@/features/responses/components/ResponseDetailView";
import { FormFillerView } from "@/features/form-filler/components/FormFillerView";
import { AppSplash } from "@/shared/components/AppSplash";

export default function Home() {
  const view = useUIStore((s) => s.view);
  const isFiller = view.name === "filler";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppSplash />
      <Header />
      <div className="flex flex-1">
        {!isFiller && <Sidebar />}
        <main className="flex-1 min-w-0 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                view.name === "response-detail"
                  ? `rd-${view.responseId}`
                  : view.name === "builder" ||
                    view.name === "responses" ||
                    view.name === "filler"
                    ? `${view.name}-${view.formId}`
                    : view.name
              }
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: motionTokens.duration.page,
                ease: motionTokens.ease.gentle,
              }}
              className="flex-1 flex flex-col"
            >
              {view.name === "dashboard" && <FormsListView />}
              {view.name === "builder" && (
                <FormBuilderView formId={view.formId} />
              )}
              {view.name === "responses" && (
                <ResponsesView formId={view.formId} />
              )}
              {view.name === "response-detail" && (
                <ResponseDetailView
                  formId={view.formId}
                  responseId={view.responseId}
                />
              )}
              {view.name === "filler" && (
                <FormFillerView formId={view.formId} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Footer />
    </div>
  );
}
