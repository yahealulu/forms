import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background/60 py-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-3">
          <Logo size={32} faint />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-foreground">
              منصة النماذج الحكومية
            </span>
            <span className="text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} — جميع الحقوق محفوظة
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>سياسة الخصوصية</span>
          <span className="h-3 w-px bg-border" />
          <span>شروط الاستخدام</span>
          <span className="h-3 w-px bg-border" />
          <span>الدعم الفني</span>
        </div>
      </div>
    </footer>
  );
}
