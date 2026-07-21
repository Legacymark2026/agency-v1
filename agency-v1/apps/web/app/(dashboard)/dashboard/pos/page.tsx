import PosTerminalClient from "./pos-client";

export const metadata = {
    title: "Terminal POS | Punto de Venta LegacyMark",
    description: "Sistema de ventas POS en caja registradora, control de inventarios, escáner de código de barras e impresión de tiquetes térmicos.",
};

export default function PosPage() {
    return <PosTerminalClient />;
}
