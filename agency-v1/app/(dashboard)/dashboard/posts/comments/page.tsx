import { getAllComments } from "@/actions/blog";
import { auth } from "@/lib/auth";
import { CommentsAdmin } from "@/components/blog/comments-admin-client";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function BlogCommentsPage({ searchParams }: PageProps) {
  const session = await auth();
  const companyId = session?.user?.companyId || '';
  
  const params = await searchParams;
  const page = parseInt(params.page || '1');
  const status = (params.status || 'all') as 'all' | 'approved' | 'pending' | 'deleted';
  const search = params.search || undefined;

  const data = await getAllComments(companyId, {
    status,
    search,
    page,
    limit: 20
  });

  return (
    <div className="min-h-screen p-6">
      <CommentsAdmin
        initialComments={data.comments}
        total={data.total}
        currentPage={data.currentPage}
        totalPages={data.pages}
      />
    </div>
  );
}