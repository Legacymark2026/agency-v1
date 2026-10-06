import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const KMS_MASTER_KEY = process.env.KMS_MASTER_KEY || "a2b4c6d8e0f1234567890abcdef1234567890abcdef1234567890abcdef12345";

function getCipherKey() {
  return Buffer.from(KMS_MASTER_KEY.substring(0, 32), "utf-8");
}

function encryptValue(plainText: string): { cipherText: string; iv: string; authTag: string } {
  if (!plainText) return { cipherText: "", iv: "", authTag: "" };
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getCipherKey(), iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return { cipherText: encrypted, iv: iv.toString("hex"), authTag };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const configs = await prisma.paymentGatewayConfig.findMany({
      where: { companyId: session.user.companyId },
    });

    const safeConfigs = configs.map((c) => ({
      provider: c.provider,
      publicKey: c.publicKey || "",
      secretKey: c.encryptedSecretKey ? "••••••••••••••••" : "",
      eventsSecret: c.encryptedEventsKey ? "••••••••••••••••" : "",
      isActive: c.isActive,
      isTestMode: c.isTestMode,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ success: true, gateways: safeConfigs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.companyId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { provider, publicKey, secretKey, eventsSecret, isActive, isTestMode } = body;

    if (!provider) {
      return NextResponse.json({ success: false, error: "Provider es requerido" }, { status: 400 });
    }

    const companyId = session.user.companyId;

    const current = await prisma.paymentGatewayConfig.findUnique({
      where: { companyId_provider: { companyId, provider } },
    });

    let encryptedSecret = current?.encryptedSecretKey;
    let encryptedEvents = current?.encryptedEventsKey;
    let iv = current?.iv;
    let authTag = current?.authTag;

    // Solo re-encriptar si viene clave real y no máscara de bullets
    if (secretKey && !secretKey.includes("•") && !secretKey.includes("*")) {
      const encrypted = encryptValue(secretKey);
      encryptedSecret = encrypted.cipherText;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    }

    if (eventsSecret && !eventsSecret.includes("•") && !eventsSecret.includes("*")) {
      const encrypted = encryptValue(eventsSecret);
      encryptedEvents = encrypted.cipherText;
    }

    await prisma.paymentGatewayConfig.upsert({
      where: { companyId_provider: { companyId, provider } },
      update: {
        publicKey: publicKey !== undefined ? publicKey : current?.publicKey,
        encryptedSecretKey: encryptedSecret,
        encryptedEventsKey: encryptedEvents,
        iv,
        authTag,
        isActive: Boolean(isActive),
        isTestMode: Boolean(isTestMode),
        updatedAt: new Date(),
      },
      create: {
        companyId,
        provider,
        publicKey: publicKey || "",
        encryptedSecretKey: encryptedSecret || null,
        encryptedEventsKey: encryptedEvents || null,
        iv: iv || null,
        authTag: authTag || null,
        isActive: Boolean(isActive),
        isTestMode: Boolean(isTestMode),
      },
    });

    return NextResponse.json({ success: true, message: "Pasarela configurada exitosamente" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
