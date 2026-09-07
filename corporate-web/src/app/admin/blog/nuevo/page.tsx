"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BlogEditorSuite, { BlogPostFormData } from "@/components/admin/BlogEditorSuite";

export default function AdminNewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: BlogPostFormData) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear el artículo");
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

  return (
    <BlogEditorSuite
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      backHref="/admin/blog"
    />
  );
}
