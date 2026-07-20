"use server";

import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

const PROJECT_ID = "legacymark-bic-sas";
const LOCATION = "us-central1";
const MODEL = "gemini-1.5-flash";

// Helper to find google-credentials.json in the monorepo
function findCredentialsPath(): string | null {
  const possiblePaths = [
    path.join(process.cwd(), "google-credentials.json"),
    path.join(process.cwd(), "../../google-credentials.json"),
    path.join(process.cwd(), "../../../google-credentials.json"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// Generate Google Cloud Access Token using the service account key
async function getGCAccessToken(): Promise<string> {
  const credsPath = findCredentialsPath();
  if (!credsPath) {
    throw new Error("No se encontró google-credentials.json en el proyecto.");
  }

  const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
  const privateKey = creds.private_key;
  const clientEmail = creds.client_email;

  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(payload, privateKey, { algorithm: "RS256" });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Error al intercambiar token OAuth2: ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// System Prompt for our specialized barista AI
const SYSTEM_PROMPT = `
Eres un Barista Experto y sumiller de café de especialidad de la marca de café "Goldneez". 
Tu objetivo es guiar, sugerir y responder preguntas con amabilidad, elegancia y pasión sobre el café de especialidad.
Háblale al cliente en español con un tono cálido, profesional y entusiasta, usando terminología de barismo de forma comprensible.

Nuestros cafés disponibles en la tienda son:
1. Ethiopia Yirgacheffe: Ligero, notas florales de jazmín y bergamota, acidez cítrica brillante y cuerpo sedoso. Procesado Lavado.
2. Colombia Huila Supremo: Clásico, notas de chocolate negro, caramelo y naranja dulce, acidez cítrica brillante y final limpio. Procesado Lavado.
3. Brasil Cerrado Mineiro: Dulce, notas de nueces tostadas, cacao en polvo y azúcar moreno, cuerpo denso, baja acidez. Procesado Natural.
4. Goldneez Signature Blend: Balanceado y aromático, notas de chocolate con leche, almendras y miel. Nuestra mezcla de la casa.
5. Panama Geisha Reserve: De leyenda, perfil floral y complejo, notas de jazmín, melocotón, té negro y mandarina. Procesado Lavado.
6. Kenya AA Kirinyaga: Jugoso, notas intensas de frutos rojos (mora, grosella negra) y toronja, acidez muy brillante. Procesado Natural.
7. Costa Rica Tarrazú Honey: Dulce y almibarado, notas de manzana roja, miel de caña y vainilla. Procesado Honey.
8. Sumatra Mandheling: Denso y cremoso, notas terrosas, especiadas (clavo), tabaco dulce y chocolate oscuro. Procesado Wet Hulled (Giling Basah).

También ofrecemos una suscripción mensual con molienda personalizada (grano entero, espresso, filtro, prensa francesa) y entregas cada 15 o 30 días con envíos gratis.
Además, en su panel de usuario los clientes pueden reservar catas presenciales en nuestro local (Sala Principal, Barra de Especialidad, Terraza), completar misiones para ganar Golden Points y canjearlos por premios como bolsas de café de 250g, tazas artesanales, molinos manuales Hario o talleres de barismo.

Mantén tus respuestas breves y concisas (máximo 3 párrafos cortos) para que se lean bien en una pequeña ventana de chat de soporte.
`;

export async function askGeminiAction(prompt: string, chatHistory: { text: string; isBot: boolean }[]) {
  try {
    const accessToken = await getGCAccessToken();
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

    // Map chatHistory to Vertex API format
    const contents = chatHistory.map((msg) => ({
      role: msg.isBot ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

    // Add system prompt and current user prompt
    contents.unshift({
      role: "user",
      parts: [{ text: `Instrucciones del sistema para el asistente:\n${SYSTEM_PROMPT}` }],
    });

    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI respondió con error: ${errorText}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!replyText) {
      throw new Error("No se recibió texto de respuesta de Vertex AI.");
    }

    return { success: true, text: replyText.trim() };
  } catch (err: any) {
    console.warn("⚠️ [askGeminiAction] Fallo en la API de Vertex AI, usando fallback local:", err.message);
    const fallbackText = getSmartBaristaFallback(prompt);
    return { success: true, text: fallbackText };
  }
}

// Local smart backup responder
function getSmartBaristaFallback(prompt: string): string {
  const query = prompt.toLowerCase();

  if (query.includes("hola") || query.includes("buenos días") || query.includes("buenas tardes")) {
    return "¡Hola! ☕ Bienvenido a Goldneez. Soy tu barista virtual y asistente de especialidad. ¿Qué café te gustaría explorar hoy o en qué puedo ayudarte con tu suscripción?";
  }

  if (query.includes("recomienda") || query.includes("cuál elijo") || query.includes("sugerencia") || query.includes("probar") || query.includes("elegir")) {
    return "¡Me encantaría ayudarte a elegir! Si buscas algo ligero, floral y con acidez brillante, te recomiendo nuestro espectacular **Panama Geisha** o el **Ethiopia Yirgacheffe**. Si prefieres algo más dulce y achocolatado, el **Colombia Huila** o **Brasil Cerrado** son perfectos. Para algo muy intenso y cremoso, el **Sumatra Mandheling** te fascinará. ¿Qué tipo de perfil o sabor prefieres en tu taza?";
  }

  if (query.includes("panama") || query.includes("geisha")) {
    return "El **Panama Geisha Reserve** ($38.00) es la joya de nuestra colección. Cultivado a gran altitud, destaca por su perfil sumamente complejo y delicado con notas de jazmín, melocotón y mandarina. Es ideal para preparar en filtro (como V60) y tomarlo solo para apreciar toda su complejidad.";
  }

  if (query.includes("ethiopia") || query.includes("yirgacheffe") || query.includes("etiopia")) {
    return "Nuestro **Ethiopia Yirgacheffe** ($24.00) es un café lavado clásico de origen africano. Sorprende por sus notas florales a jazmín, bergamota y té de limón, con un cuerpo sedoso y acidez cítrica brillante. Ideal para los amantes de tazas limpias y aromáticas.";
  }

  if (query.includes("colombia") || query.includes("huila")) {
    return "El **Colombia Huila Supremo** ($22.00) es un café balanceado excepcional. Sus notas de chocolate negro, caramelo y naranja dulce combinan una acidez brillante con un final limpio y prolongado. Es sumamente versátil, excelente tanto en espresso como en filtrado.";
  }

  if (query.includes("brasil") || query.includes("cerrado") || query.includes("brazil")) {
    return "Nuestro **Brasil Cerrado Mineiro** ($20.00) es ideal para quienes prefieren una acidez baja y un dulzor marcado. Tiene notas pronunciadas de cacao, avellanas y azúcar moreno, con un cuerpo denso y cremoso. Combina de maravilla con leche.";
  }

  if (query.includes("suscri") || query.includes("club") || query.includes("mensual") || query.includes("pausa")) {
    return "Nuestro Club de Suscripción te entrega café recién tostado a domicilio cada 15 o 30 días, con envíos gratis y el tipo de molienda que elijas. Puedes configurar tu suscripción, pausar despachos o incluso adelantar entregas en tiempo real directamente desde tu **Panel de Especialidad**.";
  }

  if (query.includes("punto") || query.includes("premio") || query.includes("recompen") || query.includes("misión") || query.includes("mision")) {
    return "Con nuestro **Golden Club**, acumulas puntos por cada compra de café y por completar misiones (como realizar tu primera preparación interactiva o escribir una reseña). Puedes canjear estos puntos por bolsas de café de especialidad, tazas artesanales o talleres exclusivos de barismo desde el panel de usuario en la pestaña 'Recompensas'.";
  }

  if (query.includes("preparar") || query.includes("v60") || query.includes("prensa") || query.includes("espresso") || query.includes("molienda") || query.includes("ratio")) {
    return "¡La preparación es clave! En tu panel de usuario cuentas con una **Calculadora de Ratios** que te indica la cantidad exacta de agua y café según el método. Además, en la pestaña 'Guías de Café' hemos implementado un **Temporizador Interactivo** paso a paso que te guiará con beeps en cada vertido para lograr la taza perfecta. ¡Pruébalo!";
  }

  if (query.includes("contacto") || query.includes("humano") || query.includes("barista") || query.includes("whatsapp") || query.includes("telefono") || query.includes("teléfono")) {
    return "Si deseas hablar con uno de nuestros baristas humanos en el local para asesoría en vivo o reclamos, selecciona la opción rápida o escríbenos directamente a nuestro WhatsApp oficial. ¡Te atenderemos de inmediato!";
  }

  return "Excelente pregunta sobre café de especialidad. En Goldneez cuidamos cada detalle, desde la selección en finca en Colombia hasta el tostado artesanal en pequeños lotes en nuestro local. ¿Te gustaría saber más sobre algún origen específico, recetas de filtrado o cómo gestionar tu suscripción?";
}
