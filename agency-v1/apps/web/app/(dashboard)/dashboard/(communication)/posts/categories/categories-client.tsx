"use client";

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/cms";
import { toast } from "react-hot-toast";

type CategoryWithCount = { id: string; name: string; slug: string; _count: { posts: number } };

const IS: React.CSSProperties = { background: "rgba(15,23,42,0.8)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "9px", padding: "8px 12px", fontSize: "13px", color: "#cbd5e1", width: "100%", outline: "none" };

export function CategoriesClient({ initialCategories }: { initialCategories: CategoryWithCount[] }) {
    const [categories, setCategories] = useState(initialCategories);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
    const [formData, setFormData] = useState({ name: "", slug: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleOpenModal = (category: CategoryWithCount | null = null) => {
        if (category) { setEditingCategory(category); setFormData({ name: category.name, slug: category.slug }); }
        else { setEditingCategory(null); setFormData({ name: "", slug: "" }); }
        setIsModalOpen(true);
    };
    const handleCloseModal = () => { setIsModalOpen(false); setEditingCategory(null); setFormData({ name: "", slug: "" }); };
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        setFormData({ name, slug });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setIsLoading(true);
        try {
            if (editingCategory) {
                const res = await updateCategory(editingCategory.id, formData);
                if (res.success) { toast.success("Categoría actualizada"); setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c)); handleCloseModal(); }
                else toast.error(res.error || "Error");
            } else {
                const res = await createCategory(formData);
                if (res.success) { toast.success("Categoría creada"); window.location.reload(); }
                else toast.error(res.error || "Error");
            }
        } finally { setIsLoading(false); }
    };

    const handleDelete = async (id: string, postCount: number) => {
        if (postCount > 0) { toast.error("No puedes eliminar una categoría con posts."); return; }
        if (confirm("¿Eliminar esta categoría?")) {
            const res = await deleteCategory(id);
            if (res.success) { toast.success("Categoría eliminada"); setCategories(categories.filter(c => c.id !== id)); }
            else toast.error(res.error || "Error");
        }
    };

    return (
        <div style={{ background: "rgba(11,15,25,0.7)", border: "1px solid rgba(30,41,59,0.8)", borderRadius: "14px", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(30,41,59,0.8)", display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => handleOpenModal()}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", fontSize: "12px", fontWeight: 800, borderRadius: "9px", border: "none", cursor: "pointer" }}>
                    <Plus size={13} /> Nueva Categoría
                </button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ background: "rgba(15,23,42,0.9)", borderBottom: "1px solid rgba(30,41,59,0.9)" }}>
                        {["Nombre", "Slug", "Posts", "Acciones"].map((h, i) => (
                            <th key={h} style={{ padding: "10px 18px", textAlign: i === 3 ? "right" : "left", fontSize: "10px", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {categories.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: "48px", textAlign: "center", fontSize: "12px", color: "#334155", fontFamily: "monospace" }}>— Sin categorías —</td></tr>
                    ) : categories.map((cat, i) => (
                        <tr key={cat.id} style={{ background: i % 2 === 0 ? "rgba(15,20,35,0.5)" : "rgba(11,15,25,0.3)", borderBottom: "1px solid rgba(30,41,59,0.4)" }}>
                            <td style={{ padding: "12px 18px", fontSize: "13px", fontWeight: 700, color: "#e2e8f0" }}>{cat.name}</td>
                            <td style={{ padding: "12px 18px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>{cat.slug}</td>
                            <td style={{ padding: "12px 18px", fontSize: "12px", color: "#475569" }}>{cat._count.posts}</td>
                            <td style={{ padding: "12px 18px", textAlign: "right" }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                    <button onClick={() => handleOpenModal(cat)}
                                        style={{ padding: "5px", borderRadius: "7px", background: "rgba(30,41,59,0.7)", border: "1px solid rgba(30,41,59,0.9)", color: "#64748b", cursor: "pointer", display: "flex" }}>
                                        <Edit size={13} />
                                    </button>
                                    <button onClick={() => handleDelete(cat.id, cat._count.posts)}
                                        style={{ padding: "5px", borderRadius: "7px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", cursor: "pointer", display: "flex" }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
                    onClick={(e) => e.target === e.currentTarget && handleCloseModal()}>
                    <div style={{ background: "rgba(11,15,25,0.98)", border: "1px solid rgba(30,41,59,0.9)", borderRadius: "18px", padding: "0", width: "100%", maxWidth: "440px", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
                        <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(30,41,59,0.8)" }}>
                            <h2 style={{ fontSize: "16px", fontWeight: 900, color: "#f1f5f9", margin: 0, fontFamily: "monospace" }}>
                                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} style={{ padding: "18px 22px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", fontFamily: "monospace" }}>Nombre *</label>
                                <input type="text" required value={formData.name} onChange={handleNameChange} style={IS} placeholder="Marketing" />
                            </div>
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "6px", fontFamily: "monospace" }}>Slug</label>
                                <input type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} style={{ ...IS, color: "#2dd4bf" }} placeholder="marketing" />
                            </div>
                            <div style={{ display: "flex", gap: "10px", paddingTop: "6px" }}>
                                <button type="button" onClick={handleCloseModal}
                                    style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "1px solid rgba(30,41,59,0.9)", background: "transparent", color: "#64748b", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>Cancelar</button>
                                <button type="submit" disabled={isLoading}
                                    style={{ flex: 1, padding: "10px", borderRadius: "9px", background: "linear-gradient(135deg,#0d9488,#0f766e)", color: "#fff", fontWeight: 800, fontSize: "13px", border: "none", cursor: "pointer", opacity: isLoading ? 0.5 : 1 }}>
                                    {isLoading ? "Guardando…" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
