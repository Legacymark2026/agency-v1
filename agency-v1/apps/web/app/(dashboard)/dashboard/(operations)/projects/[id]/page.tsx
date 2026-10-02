import { ProjectForm } from "@/components/cms/project-form";
import { getProject } from "@/actions/projects";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
        notFound();
    }

    return <ProjectForm project={project} />;
}
