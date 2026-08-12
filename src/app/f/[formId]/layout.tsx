import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تعبئة النموذج | المنصة الحكومية",
  description: "تعبئة نموذج إلكتروني منشور عبر الرابط العام.",
};

export default function PublicFillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
