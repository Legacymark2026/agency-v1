import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSettings, updateUserAppearance } from "@/actions/settings";
import { z } from "zod";

const AppearancePatchSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  accent: z.enum(["teal", "violet", "blue", "amber", "rose", "emerald"]).optional(),
  density: z.enum(["compact", "normal", "comfortable"]).optional(),
  font: z.enum(["inter", "roboto", "jetbrains", "geist"]).optional(),
  bgTheme: z.enum(["slate", "amoled", "zinc", "indigo", "forest"]).optional(),
  borderRadius: z.enum(["sharp", "rounded", "pill"]).optional(),
  glassmorphism: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  soundEffects: z.boolean().optional(),
  sidebarCollapsed: z.boolean().optional(),
  animationsEnabled: z.boolean().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const settings = await getSettings();
    if (!settings) {
      return NextResponse.json({ success: false, error: "Configuración no encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        theme: settings.theme,
        accent: settings.accent,
        density: settings.density,
        font: settings.font,
        bgTheme: settings.bgTheme,
        borderRadius: settings.borderRadius,
        glassmorphism: settings.glassmorphism,
        highContrast: settings.highContrast,
        soundEffects: settings.soundEffects,
        sidebarCollapsed: settings.sidebarCollapsed,
        animationsEnabled: settings.animationsEnabled,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = AppearancePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validación fallida",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await updateUserAppearance(parsed.data);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Preferencias de apariencia actualizadas exitosamente",
      data: parsed.data,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
