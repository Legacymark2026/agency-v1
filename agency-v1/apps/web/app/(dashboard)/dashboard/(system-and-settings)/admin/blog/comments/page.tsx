import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Moderación de Comentarios — Blog | LegacyMark",
  description: "Modera y gestiona los comentarios del blog de LegacyMark.",
};

export default async function BlogCommentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const cu = await prisma.companyUser.findFirst({
    where: { userId: session.user.id },
  });
  if (!cu) redirect("/auth/login");

  return (
    <main className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Comentarios del Blog</h1>
        <p className="text-slate-400 mt-1">
          Modera los comentarios publicados en el blog de la plataforma.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
        <p className="text-slate-500 text-sm">
          La moderación de comentarios estará disponible próximamente.
        </p>
      </div>
    </main>
  );
}
