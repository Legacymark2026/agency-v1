import { redirect } from "next/navigation";

// This page has been superseded by the new Gestión Operativa module.
// Redirect to the enhanced Kanban board.
export default function KanbanRedirectPage() {
  redirect("/dashboard/admin/operations/kanban");
}
