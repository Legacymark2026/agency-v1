import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Operations Command Center | LegacyMark",
  description: "Enterprise Operational Management Dashboard",
};

export default function OperationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex-1 bg-slate-950 text-slate-50 min-h-screen">
      {children}
    </div>
  );
}
