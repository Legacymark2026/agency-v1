"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import BlogEditorSuite, { BlogPostFormData } from "@/components/admin/BlogEditorSuite";

export default function AdminEditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [initialData, setInitialData] = useState<Partial<BlogPostFormData> | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/admin/posts/${id}`);
        if (!res.ok) {
          setError("No se pudo cargar el artículo");
          return;
        }
        const data = await res.json();
        if (data.post) {
          setInitialData({
            title: data.post.title,
            slug: data.post.slug,
            category: data.post.category,
            authorName: data.post.authorName,
            authorRole: data.post.authorRole,
            imageUrl: data.post.imageUrl,
            readTime: data.post.readTime,
            excerpt: data.post.excerpt,
            content: data.post.content,
            published: data.post.published,
          });
        }
      } catch {
        setError("Error de conexión");
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleSubmit = async (formData: BlogPostFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al actualizar el artículo");
        setLoading(false);
        return;
      }

      router.push("/admin/blog");
      router.refresh();
    } catch {
      setError("Error de comunicación con el servidor");
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-[#B08A1A]" />
        <span>Cargando artículo...</span>
      </div>
    );
  }

  return (
    <BlogEditorSuite
      initialData={initialData || {}}
      isEditing={true}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      backHref="/admin/blog"
    />
  );
}
