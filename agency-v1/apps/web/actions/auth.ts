"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/auth";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { randomBytes } from "crypto";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
    firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export async function registerUser(formData: z.infer<typeof registerSchema>) {
    // Rate limit: máx 5 registros por IP/email por hora
    const isAllowed = await rateLimit(`register:${formData.email}`, 5, 60 * 60 * 1000);
    if (!isAllowed) {
        return { error: "Demasiados intentos de registro. Espera 1 hora e inténtalo de nuevo." };
    }

    const validatedFields = registerSchema.safeParse(formData);

    if (!validatedFields.success) {
        return { error: "Datos inválidos" };
    }

    const { email, password, firstName, lastName } = validatedFields.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        return { error: "Este email ya está registrado" };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    try {
        await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                name: `${firstName} ${lastName}`,
                // GUEST = sin acceso — el SuperAdmin debe asignar un rol para activar
                role: UserRole.GUEST,
            },
        });

        return { success: "Cuenta creada. El administrador te otorgará acceso pronto." };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Error al crear el usuario" };
    }

}

export async function loginUser(prevState: string | undefined, formData: FormData) {
    const email = formData.get("email") as string;

    // Rate limit: máx 10 intentos de login por email en 5 minutos
    const isAllowed = await rateLimit(`login:${email}`, 10, 5 * 60 * 1000);
    if (!isAllowed) {
        return "Demasiados intentos de acceso. Espera 5 minutos e inténtalo de nuevo.";
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        const redirectTo = user?.role === UserRole.EXTERNAL_CLIENT ? '/dashboard/client' : '/dashboard';

        await signIn('credentials', {
            ...Object.fromEntries(formData),
            redirectTo: redirectTo
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Credenciales inválidas.';
                default:
                    return 'Algo salió mal.';
            }
        }
        throw error;
    }
}

export async function loginWithOAuth(provider: string) {
    await signIn(provider, { redirectTo: '/dashboard' });
}

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────

const requestResetSchema = z.object({
    email: z.string().email("Email inválido"),
});

/**
 * Generates a secure one-time token and sends a password reset email.
 * Always returns success to prevent email enumeration attacks.
 */
export async function requestPasswordReset(
    prevState: { success?: boolean; error?: string } | undefined,
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
    if (!parsed.success) return { error: "Por favor ingresa un email válido." };

    const { email } = parsed.data;

    // Rate limit: máx 3 solicitudes de reset por email por hora
    const isAllowed = await rateLimit(`password_reset:${email}`, 3, 60 * 60 * 1000);
    if (!isAllowed) {
        // Devolvemos success=true para no revelar que el email existe (anti-enumeration)
        return { success: true };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        // Always return success — prevents email enumeration
        if (!user) {
            return { success: true };
        }

        // Invalidate any existing tokens for this email
        await prisma.passwordResetToken.updateMany({
            where: { email, used: false },
            data: { used: true },
        });

        // Generate a cryptographically secure token
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
            data: { email, token, expiresAt },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/nueva-contrasena?token=${token}`;

        await sendEmail({
            to: email,
            subject: "Recupera tu contraseña — LegacyMark",
            html: getPasswordResetEmailHtml({
                name: user.name || user.firstName || "Usuario",
                resetUrl,
            }),
        });

        return { success: true };
    } catch (error) {
        console.error("[PASSWORD RESET] Error:", error);
        return { error: "Error interno. Por favor intenta de nuevo." };
    }
}

const resetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string().min(8),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

/**
 * Validates the reset token and updates the user's password.
 */
export async function resetPassword(
    prevState: { success?: boolean; error?: string } | undefined,
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    const parsed = resetPasswordSchema.safeParse({
        token: formData.get("token"),
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message;
        return { error: firstError || "Datos inválidos." };
    }

    const { token, password } = parsed.data;

    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken) {
            return { error: "El enlace de recuperación no es válido." };
        }

        if (resetToken.used) {
            return { error: "Este enlace ya fue utilizado. Solicita uno nuevo." };
        }

        if (resetToken.expiresAt < new Date()) {
            return { error: "El enlace ha expirado. Solicita uno nuevo." };
        }

        const user = await prisma.user.findUnique({
            where: { email: resetToken.email },
        });

        if (!user) {
            return { error: "Usuario no encontrado." };
        }

        const passwordHash = await bcrypt.hash(password, 12);

        // Update password and mark token as used in a transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { passwordHash },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);

        return { success: true };
    } catch (error) {
        console.error("[RESET PASSWORD] Error:", error);
        return { error: "Error interno. Por favor intenta de nuevo." };
    }
}

// ─── EMAIL TEMPLATE ───────────────────────────────────────────────────────────

function getPasswordResetEmailHtml({ name, resetUrl }: { name: string; resetUrl: string }) {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recupera tu contraseña</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">LEGACY<span style="color:#14b8a6;">MARK</span></h1>
              <p style="color:#94a3b8;margin:8px 0 0;font-size:13px;letter-spacing:0.05em;">AGENCIA DE MARKETING DIGITAL</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:48px 40px 32px;">
              <p style="color:#64748b;font-size:14px;margin:0 0 8px;">Hola, <strong style="color:#0f172a;">${name}</strong></p>
              <h2 style="color:#0f172a;font-size:28px;font-weight:800;margin:0 0 16px;line-height:1.2;">Recupera tu contraseña</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 32px;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace es válido por <strong>1 hora</strong>.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.02em;">
                      Restablecer Contraseña →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Security Note -->
              <div style="margin-top:40px;padding:20px;background:#f1f5f9;border-radius:8px;border-left:4px solid #14b8a6;">
                <p style="color:#475569;font-size:13px;margin:0;line-height:1.5;">
                  🔒 <strong>¿No solicitaste esto?</strong> Puedes ignorar este email de forma segura. Tu contraseña no cambiará hasta que hagas clic en el enlace de arriba.
                </p>
              </div>
              <!-- Fallback URL -->
              <p style="color:#94a3b8;font-size:12px;margin:24px 0 0;line-height:1.5;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
                <a href="${resetUrl}" style="color:#14b8a6;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">
                © ${new Date().getFullYear()} LegacyMark. Todos los derechos reservados.<br/>
                Este email fue enviado porque se solicitó un restablecimiento de contraseña.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── CHANGE PASSWORD (authenticated) ─────────────────────────────────────────

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Ingresa tu contraseña actual"),
        newPassword: z
            .string()
            .min(8, "Mínimo 8 caracteres")
            .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
            .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
            .regex(/[0-9]/, "Debe contener al menos un número"),
        confirmPassword: z.string().min(1, "Confirma tu nueva contraseña"),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

/**
 * Allows an authenticated user to change their own password.
 * Verifies current password before updating to prevent unauthorized changes.
 */
export async function changePassword(
    prevState: { success?: boolean; error?: string } | undefined,
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    const { auth } = await import("@/lib/auth");
    const session = await auth();

    if (!session?.user?.email) {
        return { error: "Sesión no válida. Por favor inicia sesión de nuevo." };
    }

    const parsed = changePasswordSchema.safeParse({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || "Datos inválidos." };
    }

    const { currentPassword, newPassword } = parsed.data;

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, passwordHash: true },
        });

        if (!user) return { error: "Usuario no encontrado." };

        if (!user.passwordHash) {
            return {
                error: "Tu cuenta usa Google/Facebook. Usa 'Recuperar contraseña' en el login para establecer una contraseña.",
            };
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isCurrentValid) return { error: "La contraseña actual es incorrecta." };

        const isSame = await bcrypt.compare(newPassword, user.passwordHash);
        if (isSame) return { error: "La nueva contraseña debe ser diferente a la actual." };

        const newHash = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newHash },
        });

        return { success: true };
    } catch (error) {
        console.error("[CHANGE PASSWORD] Error:", error);
        return { error: "Error interno. Por favor intenta de nuevo." };
    }
}
