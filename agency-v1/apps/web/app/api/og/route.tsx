import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "LegacyMark · Growth & Performance Marketing";
    const description =
      searchParams.get("description") ||
      "Plataforma de Operaciones de Marketing, CRM, Facturación DIAN y Automatización con IA.";
    const badge = searchParams.get("badge") || "ENTERPRISE MARKETING & AI";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            backgroundColor: "#020617",
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(13, 148, 136, 0.25), transparent 70%), radial-gradient(circle at 100% 100%, rgba(15, 23, 42, 1), #020617)",
            padding: "80px",
            fontFamily: "sans-serif",
            color: "#f8fafc",
            border: "1px solid rgba(30, 41, 59, 0.8)",
          }}
        >
          {/* Header with Badge and Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "rgba(13, 148, 136, 0.15)",
                border: "1px solid rgba(13, 148, 136, 0.4)",
                padding: "8px 20px",
                borderRadius: "9999px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: "#14b8a6",
                }}
              />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#2dd4bf",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {badge}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.03em" }}>
                Legacy<span style={{ color: "#14b8a6" }}>Mark</span>
              </span>
            </div>
          </div>

          {/* Body content: Dynamic Title and Description */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "950px" }}>
            <h1
              style={{
                fontSize: 54,
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: "-0.04em",
                color: "#ffffff",
                margin: 0,
                textShadow: "0 4px 20px rgba(0,0,0,0.5)",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 22,
                color: "#94a3b8",
                lineHeight: 1.4,
                margin: 0,
                fontWeight: 400,
              }}
            >
              {description}
            </p>
          </div>

          {/* Footer Credentials & Domains */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              borderTop: "1px solid rgba(51, 65, 85, 0.6)",
              paddingTop: "28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "#64748b", fontSize: 16 }}>
              <span>🚀 Performance Marketing</span>
              <span>•</span>
              <span>📄 Facturación DIAN</span>
              <span>•</span>
              <span>🤖 Agentes IA</span>
            </div>
            <span style={{ fontSize: 16, color: "#2dd4bf", fontWeight: 600 }}>
              legacymarksas.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error("[OG_IMAGE_GENERATOR_ERROR]", e);
    return new Response(`Failed to generate the image: ${e.message}`, {
      status: 500,
    });
  }
}
