import { Metadata } from "next";
import CatalogClient from "./catalog-client";

export const metadata: Metadata = {
    title: "Módulo de Catálogo & Productos | LegacyMark POS",
    description: "Módulo independiente de administración de catálogo sincronizado en tiempo real con el sistema POS.",
};

export default function CatalogPage() {
    return <CatalogClient />;
}
