# Guía de Configuración: WhatsApp Business API

Sigue estos pasos **exactos** para obtener las credenciales necesarias. No te saltes ninguno.

## 1. Preparar la App en Meta (Si aún no lo has hecho)
1.  Ve a [developers.facebook.com/apps](https://developers.facebook.com/apps/).
2.  Selecciona tu App actual (la que usamos para Facebook Login).
3.  En el menú lateral izquierdo, busca la sección **"WhatsApp"**.
    *   *Si no aparece:* Haz clic en "Añadir producto" (Add Product) en el menú y selecciona "WhatsApp".

## 2. Obtener el Phone Number ID (ID del Número de Teléfono)
1.  En el menú lateral, despliega **WhatsApp** y haz clic en **API Setup** (Configuración de API).
2.  Verás una sección llamada **"Step 1: Select phone numbers"**.
3.  Allí verás un número de prueba (Test Number).
    *   **Para Pruebas:** Puedes usar los datos de ese número de prueba.
    *   **Para Producción (Tu número real):** Haz clic en el botón azul **"Add phone number"** al final de esa sección y sigue los pasos para verificar tu número real vía SMS.
4.  Copia el valor que dice **Phone Number ID** (Ej: `36263649692...`).
    *   📍 *Pégalo en el Dashboard en el campo "Phone Number ID".*

## 3. Generar el Token Permanente (CRÍTICO)
⚠️ **NO USES** el "Temporary Access Token" que aparece en la pantalla de API Setup (ese caduca en 24 horas). Sigue estos pasos para obtener uno eterno:

1.  Ve a la **Configuración del Negocio (Business Settings)** de Meta: [business.facebook.com/settings](https://business.facebook.com/settings).
2.  En el menú lateral, ve a **Usuarios (Users)** > **Usuarios del sistema (System Users)**.
3.  Haz clic en **"Añadir" (Add)**:
    *   Nombre: `WhatsappBot` (o lo que quieras).
    *   Rol: **Administrador (Admin)**.
4.  Una vez creado, haz clic en **"Añadir activos" (Add Assets)**:
    *   Selecciona **Apps**.
    *   Selecciona tu App.
    *   Activa el interruptor **"Control total" (Full Control / Manage App)**.
    *   Guarda los cambios.
5.  Ahora, haz clic en el botón **"Generar nuevo token" (Generate New Token)**:
    *   Selecciona tu App.
    *   **Caducidad del token:** Selecciona **"Nunca" (Never)**.
    *   **Permisos (IMPORTANTE):** Selecciona EXPLICITAMENTE estos dos:
        *   `whatsapp_business_messaging`
        *   `whatsapp_business_management`
    *   Haz clic en Generar Token.
6.  Copia el token largo que empieza por `EAA...`.
    *   📍 *Pégalo en el Dashboard en el campo "Permanent Access Token".*

## 4. Configurar el Webhook (Para recibir mensajes)
Necesitas esto para que cuando alguien te escriba, el mensaje llegue a tu sistema.

1.  En [developers.facebook.com](https://developers.facebook.com/apps/), ve a **WhatsApp** > **Configuration**.
2.  Busca la sección **Webhook** y haz clic en **Edit**.
3.  **Callback URL:** Escribe `https://legacymarksas.com/api/integrations/whatsapp/webhook`
4.  **Verify Token:** Inventa una palabra clave (ej: `legacymark_secret_123`).
    *   📍 *Escríbela también en el Dashboard en el campo "Verify Token".*
5.  Haz clic en **Verify and Save**. (Esto fallará si no has configurado el dashboard primero, así que guarda primero en tu Dashboard y luego dale a Verify en Facebook).
6.  Una vez verificado, haz clic en **"Manage"** (Gestiornar) campos del Webhook.
7.  Suscríbete a: `messages`.

## 5. App Secret (Seguridad)
1.  En Meta Developers, ve a **App settings** > **Basic**.
2.  Haz clic en "Show" en el campo **App secret**.
3.  Copia ese código.
    *   📍 *Pégalo en el Dashboard en el campo "App Secret".*

---

### Resumen: ¿Qué va dónde?

| Campo en Dashboard | Dónde lo consigo |
| :--- | :--- |
| **Phone Number ID** | WhatsApp > API Setup |
| **Access Token** | Business Settings > System Users (Token Permanente) |
| **App Secret** | App settings > Basic |
| **Verify Token** | Lo inventas tú (ej: `hola123`) y lo pones en ambos lados |
