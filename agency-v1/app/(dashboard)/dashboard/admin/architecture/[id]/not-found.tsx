import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <h2 className="text-2xl font-bold">Objeto no encontrado</h2>
            <p className="text-muted-foreground">
                El objeto personalizado que buscas no existe o fue eliminado.
            </p>
            <Link
                href="/dashboard/admin/architecture"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
                Volver a Arquitectura
            </Link>
        </div>
    );
}
