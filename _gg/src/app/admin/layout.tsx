import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة التحكم — ألعاب الغريب",
  description: "لوحة تحكم إدارة منصة ألعاب الغريب",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950" dir="rtl">
      {children}
    </div>
  );
}
