import { Metadata } from "next";
import PromotionsClient from "./promotions-client";

export const metadata: Metadata = {
    title: "Gestión de Promociones & Cupones | LegacyMark",
    description: "Módulo independiente para crear y gestionar reglas de descuentos, cupones y promociones automáticas.",
};

export default function PromotionsPage() {
    return <PromotionsClient />;
}
