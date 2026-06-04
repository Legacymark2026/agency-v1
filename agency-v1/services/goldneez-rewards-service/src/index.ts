import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Pool } from "pg";
import { z } from "zod";
import crypto from "crypto";

const app = express();
const PORT = parseInt(process.env.PORT || "4020", 10);
const GOLDNEEZ_DB_URL = process.env.GOLDNEEZ_DB_URL || "postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark?schema=goldneez&search_path=goldneez,public";

// Configurar el Pool de conexión a la base de datos
const pool = new Pool({
  connectionString: GOLDNEEZ_DB_URL,
  max: 20, // Pool de conexiones para soportar cargas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Establecer el esquema goldneez automáticamente en cada nueva conexión
pool.on("connect", (client) => {
  client.query("SET search_path TO goldneez, public;");
});

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());

// Catálogos iniciales para sembrar (Seeding)
const REWARDS_CATALOG = [
  { id: "rwd-001", title: "Bolsa de Café de Especialidad (250g)", cost: 1000, desc: "Canjea cualquier origen de nuestra carta en presentación de 250g." },
  { id: "rwd-002", title: "Mug de Cerámica Goldneez", cost: 800, desc: "Mug hecho a mano por artesanos locales con acabado dorado." },
  { id: "rwd-003", title: "Molino Manual Hario Slim", cost: 3000, desc: "Molino de muelas cerámicas portátil para una molienda fresca." },
  { id: "rwd-004", title: "Taller Privado de Barismo (1h)", cost: 5000, desc: "Clase uno a uno con nuestro Head Barista para perfeccionar tu filtrado." }
];

const MOCK_EVENTS = [
  { id: "evt-001", title: "Cata de Café: Orígenes de África", date: "15/06/2026", time: "18:00", capacity: 15, desc: "Explora la acidez frutal de Etiopía y Kenia en esta sesión guiada." },
  { id: "evt-002", title: "Taller: Arte Latte para Principiantes", date: "22/06/2026", time: "16:00", capacity: 8, desc: "Aprende a texturizar leche y realizar diseños básicos como el corazón y la roseta." },
  { id: "evt-003", title: "Curso de Barismo: Métodos de Filtro", date: "29/06/2026", time: "17:30", capacity: 12, desc: "Domina las extracciones en V60, Chemex y Prensa Francesa." }
];

const DEFAULT_STEPS = [
  { label: "Procesado", status: "completed", desc: "Tu pedido ha sido recibido y confirmado.", date: "1 hora" },
  { label: "Tostado", status: "completed", desc: "Granos tostados artesanalmente en pequeños lotes.", date: "2 horas" },
  { label: "Empacado", status: "current", desc: "Sellado al vacío con válvula desgasificadora.", date: "En proceso" },
  { label: "Enviado", status: "upcoming", desc: "En manos de la transportadora asociada.", date: "Por programar" },
  { label: "Entregado", status: "upcoming", desc: "Listo para crear recuerdos dorados en tu taza.", date: "Por programar" }
];

// Sembrar base de datos con catálogos reales si están vacíos
async function seedDatabase() {
  const client = await pool.connect();
  try {
    await client.query("SET search_path TO goldneez, public;");
    
    // Sembrar premios
    const rwdCheck = await client.query("SELECT id FROM tbl_goldneez_rewards LIMIT 1;");
    if (rwdCheck.rows.length === 0) {
      console.log("[Seeding] Insertando catálogo real de premios en tbl_goldneez_rewards...");
      for (const rwd of REWARDS_CATALOG) {
        await client.query(
          `INSERT INTO tbl_goldneez_rewards (id, title, cost, description, is_active, created_at)
           VALUES ($1, $2, $3, $4, true, NOW())`,
          [rwd.id, rwd.title, rwd.cost, rwd.desc]
        );
      }
    }

    // Sembrar eventos
    const evtCheck = await client.query("SELECT id FROM tbl_goldneez_events LIMIT 1;");
    if (evtCheck.rows.length === 0) {
      console.log("[Seeding] Insertando eventos reales de cata en tbl_goldneez_events...");
      for (const evt of MOCK_EVENTS) {
        await client.query(
          `INSERT INTO tbl_goldneez_events (id, title, description, date, time, capacity, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [evt.id, evt.title, evt.desc, evt.date, evt.time, evt.capacity]
        );
      }
    }
  } catch (err) {
    console.error("[Seeding] Error sembrando datos iniciales reales:", err);
  } finally {
    client.release();
  }
}

// ── Health Checks ───────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "goldneez-rewards-service",
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", async (_req, res) => {
  try {
    const result = await pool.query("SELECT 1 as ok");
    res.json({ status: "ready", db: "connected", check: result.rows[0] });
  } catch (err) {
    res.status(503).json({ status: "not_ready", db: "disconnected", error: String(err) });
  }
});

// Helper para extraer o inicializar los puntos del perfil
async function getUserPointsAndMetadata(userId: string) {
  const result = await pool.query(
    "SELECT id, metadata FROM tbl_user_profiles WHERE user_id = $1",
    [userId]
  );
  
  let points = 500;
  let registeredAt = new Date().toLocaleDateString();
  let city = "";

  if (result.rows.length > 0) {
    const metadataStr = result.rows[0].metadata;
    if (metadataStr) {
      try {
        const metadata = typeof metadataStr === "string" ? JSON.parse(metadataStr) : metadataStr;
        points = metadata.points ?? 500;
        registeredAt = metadata.registeredAt ?? registeredAt;
        city = metadata.city ?? "";
      } catch (e) {
        // Ignorar
      }
    }
  } else {
    // Si no existe perfil, crearlo
    const profileId = crypto.randomUUID();
    const initialMeta = { points, registeredAt, city };
    await pool.query(
      "INSERT INTO tbl_user_profiles (id, user_id, preferences, metadata) VALUES ($1, $2, $3, $4)",
      [profileId, userId, JSON.stringify({}), JSON.stringify(initialMeta)]
    );
  }

  return { points, registeredAt, city };
}

// Helper para guardar puntos en el perfil
async function updateUserPointsAndMetadata(userId: string, points: number, city: string, registeredAt: string) {
  const currentMeta = { points, registeredAt, city };
  await pool.query(
    "UPDATE tbl_user_profiles SET metadata = $1 WHERE user_id = $2",
    [JSON.stringify(currentMeta), userId]
  );
}

// ── 1. Perfil de Sabor Endpoints ─────────────────────────────────────────────
app.get("/api/goldneez-rewards/flavor-profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM tbl_goldneez_flavor_profiles WHERE user_id = $1",
      [userId]
    );
    res.json(result.rows[0] || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/flavor-profile", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      acidez: z.number().min(1).max(5),
      cuerpo: z.number().min(1).max(5),
      notas: z.string(),
      metodoPreferido: z.string(),
    });

    const { userId, acidez, cuerpo, notas, metodoPreferido } = schema.parse(req.body);

    // Calcular recomendaciones de café
    const recs: string[] = [];
    if (acidez >= 4 && cuerpo <= 3) {
      recs = ["ethiopia-yirgacheffe", "panama-geisha"];
    } else if (cuerpo >= 4) {
      recs = ["sumatra-mandheling", "brasil-cerrado", "kenya-aa"];
    } else {
      recs = ["colombia-huila", "signature-blend", "costa-rica"];
    }

    const recomendaciones = recs.join(",");

    // Upsert flavor profile
    await pool.query(
      `INSERT INTO tbl_goldneez_flavor_profiles (id, user_id, acidez, cuerpo, notas, metodo_preferido, recomendaciones, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE 
       SET acidez = EXCLUDED.acidez, cuerpo = EXCLUDED.cuerpo, notas = EXCLUDED.notas, 
           metodo_preferido = EXCLUDED.metodo_preferido, recomendaciones = EXCLUDED.recomendaciones, updated_at = NOW()`,
      [crypto.randomUUID(), userId, acidez, cuerpo, notas, metodoPreferido, recomendaciones]
    );

    res.json({ success: true, recommendations: recs });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── 2. Recompensas & Puntos Endpoints ────────────────────────────────────────
app.get("/api/goldneez-rewards/rewards", async (_req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, cost, description FROM tbl_goldneez_rewards WHERE is_active = true ORDER BY cost ASC"
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/goldneez-rewards/points/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { points } = await getUserPointsAndMetadata(userId);

    // Obtener historial
    const historyResult = await pool.query(
      "SELECT * FROM tbl_goldneez_points_history WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    let tier = "Silver";
    if (points >= 3000) {
      tier = "Platinum";
    } else if (points >= 1000) {
      tier = "Gold";
    }

    res.json({
      points,
      tier,
      history: historyResult.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/points/add", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      puntos: z.number().positive(),
      concepto: z.string(),
    });

    const { userId, puntos, concepto } = schema.parse(req.body);
    const { points: currentPoints, city, registeredAt } = await getUserPointsAndMetadata(userId);

    const newPoints = currentPoints + puntos;

    // Actualizar perfil
    await updateUserPointsAndMetadata(userId, newPoints, city, registeredAt);

    // Insertar en historial
    await pool.query(
      "INSERT INTO tbl_goldneez_points_history (id, user_id, puntos, tipo, concepto, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [crypto.randomUUID(), userId, puntos, "earned", concepto]
    );

    res.json({ success: true, points: newPoints });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/points/redeem", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      puntosRequeridos: z.number().positive(),
      concepto: z.string(),
    });

    const { userId, puntosRequeridos, concepto } = schema.parse(req.body);
    const { points: currentPoints, city, registeredAt } = await getUserPointsAndMetadata(userId);

    if (currentPoints < puntosRequeridos) {
      return res.status(400).json({ error: "Puntos insuficientes." });
    }

    const newPoints = currentPoints - puntosRequeridos;

    // Actualizar perfil
    await updateUserPointsAndMetadata(userId, newPoints, city, registeredAt);

    // Insertar en historial
    await pool.query(
      "INSERT INTO tbl_goldneez_points_history (id, user_id, puntos, tipo, concepto, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [crypto.randomUUID(), userId, -puntosRequeridos, "redeemed", concepto]
    );

    res.json({ success: true, points: newPoints });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── 3. Referidos Endpoints ───────────────────────────────────────────────────
app.get("/api/goldneez-rewards/referrals/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Obtener código de referido
    let referralResult = await pool.query(
      "SELECT codigo FROM tbl_goldneez_referrals WHERE referrer_id = $1 LIMIT 1",
      [userId]
    );

    let codigo = "";
    if (referralResult.rows.length > 0) {
      codigo = referralResult.rows[0].codigo;
    } else {
      codigo = `GOLD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await pool.query(
        "INSERT INTO tbl_goldneez_referrals (id, referrer_id, codigo, estado, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())",
        [crypto.randomUUID(), userId, codigo, "pending"]
      );
    }

    // Calcular estadísticas reales
    const statsResult = await pool.query(
      "SELECT COUNT(*) as count FROM tbl_goldneez_referrals WHERE referrer_id = $1 AND estado = 'completed'",
      [userId]
    );

    const count = parseInt(statsResult.rows[0].count, 10);
    const pointsEarned = count * 200;

    res.json({
      codigo,
      referredCount: count,
      pointsEarned,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/referrals/apply", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      codigo: z.string().trim(),
    });

    const { userId, codigo } = schema.parse(req.body);

    // Validar código existente
    const referralResult = await pool.query(
      "SELECT referrer_id, id FROM tbl_goldneez_referrals WHERE codigo = $1 LIMIT 1",
      [codigo]
    );

    if (referralResult.rows.length === 0) {
      return res.status(404).json({ error: "Código de referido inválido." });
    }

    const { referrer_id: referrerId } = referralResult.rows[0];

    if (referrerId === userId) {
      return res.status(400).json({ error: "No puedes aplicar tu propio código." });
    }

    // Verificar que no haya sido referido previamente
    const alreadyReferred = await pool.query(
      "SELECT id FROM tbl_goldneez_referrals WHERE referred_id = $1 LIMIT 1",
      [userId]
    );

    if (alreadyReferred.rows.length > 0) {
      return res.status(400).json({ error: "Ya has aplicado un código de referido anteriormente." });
    }

    // Registrar la aplicación completada
    const newRefId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO tbl_goldneez_referrals (id, referrer_id, referred_id, codigo, estado, puntos_referente, puntos_referido, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())",
      [newRefId, referrerId, userId, codigo, "completed", 200, 100]
    );

    // Otorgar puntos
    const { points: refPoints, city: refCity, registeredAt: refReg } = await getUserPointsAndMetadata(userId);
    await updateUserPointsAndMetadata(userId, refPoints + 100, refCity, refReg);
    await pool.query(
      "INSERT INTO tbl_goldneez_points_history (id, user_id, puntos, tipo, concepto, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [crypto.randomUUID(), userId, 100, "earned", `Código de referido aplicado (${codigo})`]
    );

    const { points: referrerPoints, city: referrerCity, registeredAt: referrerReg } = await getUserPointsAndMetadata(referrerId);
    await updateUserPointsAndMetadata(referrerId, referrerPoints + 200, referrerCity, referrerReg);
    await pool.query(
      "INSERT INTO tbl_goldneez_points_history (id, user_id, puntos, tipo, concepto, created_at) VALUES ($1, $2, $3, $4, $5, NOW())",
      [crypto.randomUUID(), referrerId, 200, "earned", `Amigo referido se ha registrado (${codigo})`]
    );

    res.json({ success: true, pointsEarned: 100 });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── 4. Catas & Eventos Endpoints ─────────────────────────────────────────────
app.get("/api/goldneez-rewards/events", async (_req, res) => {
  try {
    // Consultar eventos reales de la BD
    const eventsResult = await pool.query(
      "SELECT id, title, description, date, time, capacity FROM tbl_goldneez_events ORDER BY created_at ASC"
    );

    // Obtener reservas activas
    const bookings = await pool.query(
      "SELECT event_id, COUNT(*) as count FROM tbl_goldneez_event_bookings WHERE estado = 'booked' GROUP BY event_id"
    );

    const counts = bookings.rows.reduce((acc: any, row: any) => {
      acc[row.event_id] = parseInt(row.count, 10);
      return acc;
    }, {});

    const eventsList = eventsResult.rows.map((evt) => {
      const bookedCount = counts[evt.id] || 0;
      return {
        id: evt.id,
        title: evt.title,
        desc: evt.description,
        date: evt.date,
        time: evt.time,
        capacity: evt.capacity,
        spotsLeft: Math.max(0, evt.capacity - bookedCount),
      };
    });

    res.json(eventsList);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/goldneez-rewards/events/bookings/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM tbl_goldneez_event_bookings WHERE user_id = $1 AND estado = 'booked' ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/events/book", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      eventId: z.string(),
      eventTitle: z.string(),
      eventDate: z.string(),
    });

    const { userId, eventId, eventTitle, eventDate } = schema.parse(req.body);

    const checkBooking = await pool.query(
      "SELECT id FROM tbl_goldneez_event_bookings WHERE user_id = $1 AND event_id = $2 AND estado = 'booked'",
      [userId, eventId]
    );

    if (checkBooking.rows.length > 0) {
      return res.status(400).json({ error: "Ya tienes una reserva para este evento." });
    }

    const bookingId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO tbl_goldneez_event_bookings (id, user_id, event_id, event_title, event_date, estado, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())",
      [bookingId, userId, eventId, eventTitle, eventDate, "booked"]
    );

    res.json({ success: true, bookingId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/events/cancel", async (req, res) => {
  try {
    const schema = z.object({
      bookingId: z.string().uuid(),
    });

    const { bookingId } = schema.parse(req.body);

    await pool.query(
      "UPDATE tbl_goldneez_event_bookings SET estado = 'cancelled', updated_at = NOW() WHERE id = $1",
      [bookingId]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── 5. Seguimiento de Envíos (Persistente y Real en BD, dinámico por tiempo) ──
app.get("/api/goldneez-rewards/shipping-tracking/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Obtener la fecha de creación real del negocio (Deal) en tbl_deals
    let createdAt = new Date();
    try {
      const shortId = orderId.replace("GDN-", "").toLowerCase();
      const dealResult = await pool.query(
        "SELECT created_at FROM tbl_deals WHERE id::text LIKE $1 LIMIT 1",
        [`${shortId}%`]
      );
      if (dealResult.rows.length > 0) {
        createdAt = new Date(dealResult.rows[0].created_at);
      }
    } catch (e) {
      console.warn(`[Tracking] Error consultando tbl_deals para ${orderId}:`, e);
    }

    const timeDiffMs = Date.now() - createdAt.getTime();

    const stepsConfig = [
      { label: "Procesado", desc: "Tu pedido ha sido recibido y confirmado.", minMs: 0, currentMaxMs: 5 * 60 * 1000 },
      { label: "Tostado", desc: "Granos tostados artesanalmente en pequeños lotes.", minMs: 5 * 60 * 1000, currentMaxMs: 30 * 60 * 1000 },
      { label: "Empacado", desc: "Sellado al vacío con válvula desgasificadora.", minMs: 30 * 60 * 1000, currentMaxMs: 2 * 60 * 60 * 1000 },
      { label: "Enviado", desc: "En manos de la transportadora asociada.", minMs: 2 * 60 * 60 * 1000, currentMaxMs: 12 * 60 * 60 * 1000 },
      { label: "Entregado", desc: "Listo para crear recuerdos dorados en tu taza.", minMs: 12 * 60 * 60 * 1000, currentMaxMs: 24 * 60 * 60 * 1000 }
    ];

    const computedSteps = stepsConfig.map((config, idx) => {
      let status = "upcoming";
      let date = "Por programar";

      if (timeDiffMs > config.currentMaxMs) {
        status = "completed";
        const completionTime = new Date(createdAt.getTime() + config.currentMaxMs);
        date = completionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + completionTime.toLocaleDateString();
      } else if (timeDiffMs >= config.minMs && timeDiffMs <= config.currentMaxMs) {
        status = "current";
        date = "En proceso";
      }

      return {
        stepIndex: idx,
        label: config.label,
        status,
        desc: config.desc,
        date
      };
    });

    // Guardar/Actualizar en la base de datos (upsert)
    for (const step of computedSteps) {
      await pool.query(
        `INSERT INTO tbl_goldneez_shipping_steps (id, order_id, step_index, label, status, desc, date, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (order_id, step_index) DO UPDATE
         SET status = EXCLUDED.status, date = EXCLUDED.date`,
        [crypto.randomUUID(), orderId, step.stepIndex, step.label, step.status, step.desc, step.date]
      );
    }

    res.json({ orderId, steps: computedSteps });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 6. Reseñas de Producto Endpoints ─────────────────────────────────────────
app.get("/api/goldneez-rewards/reviews/:coffeeId", async (req, res) => {
  try {
    const { coffeeId } = req.params;
    const result = await pool.query(
      "SELECT * FROM tbl_goldneez_product_reviews WHERE coffee_id = $1 ORDER BY created_at DESC",
      [coffeeId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/reviews", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      orderId: z.string(),
      coffeeId: z.string(),
      coffeeName: z.string(),
      calificacion: z.number().min(1).max(5),
      comentario: z.string().optional(),
    });

    const { userId, orderId, coffeeId, coffeeName, calificacion, comentario } = schema.parse(req.body);

    const reviewId = crypto.randomUUID();
    await pool.query(
      "INSERT INTO tbl_goldneez_product_reviews (id, user_id, order_id, coffee_id, coffee_name, calificacion, comentario, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())",
      [reviewId, userId, orderId, coffeeId, coffeeName, calificacion, comentario || null]
    );

    res.json({ success: true, reviewId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── 7. Preferencias de Notificaciones Endpoints ──────────────────────────────
app.get("/api/goldneez-rewards/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM tbl_goldneez_notification_preferences WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    if (result.rows.length === 0) {
      const defaultPrefs = {
        promociones: true,
        pedidos: true,
        clubPuntos: true,
        boletines: true
      };
      return res.json(defaultPrefs);
    }

    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/notifications", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      promociones: z.boolean(),
      pedidos: z.boolean(),
      clubPuntos: z.boolean(),
      boletines: z.boolean(),
    });

    const { userId, promociones, pedidos, clubPuntos, boletines } = schema.parse(req.body);

    await pool.query(
      `INSERT INTO tbl_goldneez_notification_preferences (id, user_id, promociones, pedidos, club_puntos, boletines, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE 
       SET promociones = EXCLUDED.promociones, pedidos = EXCLUDED.pedidos, club_puntos = EXCLUDED.club_puntos, 
           boletines = EXCLUDED.boletines, updated_at = NOW()`,
      [crypto.randomUUID(), userId, promociones, pedidos, clubPuntos, boletines]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── 8. Métodos de Pago Endpoints ─────────────────────────────────────────────
app.get("/api/goldneez-rewards/payment-methods/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM tbl_goldneez_payment_methods WHERE user_id = $1 ORDER BY es_predeterminada DESC, created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/payment-methods", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      marca: z.string(),
      ultimosCuatro: z.string().length(4),
      nombreTarjeta: z.string(),
    });

    const { userId, marca, ultimosCuatro, nombreTarjeta } = schema.parse(req.body);
    const methodId = crypto.randomUUID();

    const checkFirst = await pool.query(
      "SELECT id FROM tbl_goldneez_payment_methods WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    const esPredeterminada = checkFirst.rows.length === 0;

    await pool.query(
      "INSERT INTO tbl_goldneez_payment_methods (id, user_id, marca, ultimos_cuatro, nombre_tarjeta, token, es_predeterminada, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())",
      [methodId, userId, marca, ultimosCuatro, nombreTarjeta, `tok_${Math.random().toString(36).substring(7)}`, esPredeterminada]
    );

    res.json({ success: true, methodId });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/goldneez-rewards/payment-methods/:userId/:methodId", async (req, res) => {
  try {
    const { userId, methodId } = req.params;

    await pool.query(
      "DELETE FROM tbl_goldneez_payment_methods WHERE id = $1 AND user_id = $2",
      [methodId, userId]
    );

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 9. Consumo Mensual REAL (Calculado de compras reales en la base de datos) ──
app.get("/api/goldneez-rewards/consumption/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Consultar logs de compras reales del usuario
    const result = await pool.query(
      "SELECT details, created_at FROM tbl_user_activity_logs WHERE user_id = $1 AND action = 'CHECKOUT_SUCCESS' ORDER BY created_at ASC",
      [userId]
    );

    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const consumptionMap: Record<string, number> = months.reduce((acc, m) => {
      acc[m] = 0;
      return acc;
    }, {} as Record<string, number>);

    for (const row of result.rows) {
      try {
        const details = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
        const date = new Date(row.created_at);
        const monthName = months[date.getMonth()];

        if (details && details.items) {
          for (const item of details.items) {
            const match = String(item.size || "").match(/\d+/);
            if (match) {
              const grams = parseInt(match[0], 10);
              const qty = parseInt(item.quantity || "1", 10);
              consumptionMap[monthName] += grams * qty;
            }
          }
        }
      } catch (e) {
        // Ignorar errores de análisis de JSON
      }
    }

    const response = months.map((m) => ({
      month: m,
      grams: consumptionMap[m],
    }));

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 10. Suscripciones Reales en Perfil ─────────────────────────────────────────
app.get("/api/goldneez-rewards/subscription/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT preferences FROM tbl_user_profiles WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length > 0) {
      const prefsStr = result.rows[0].preferences;
      if (prefsStr) {
        const prefs = typeof prefsStr === "string" ? JSON.parse(prefsStr) : prefsStr;
        if (prefs.subscription) {
          return res.json(prefs.subscription);
        }
      }
    }

    // Default
    const defaultSub = {
      beans: "signature-blend",
      frequency: "30",
      status: "active",
      nextDelivery: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
    res.json(defaultSub);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/goldneez-rewards/subscription", async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      beans: z.string(),
      frequency: z.string(),
      status: z.string(),
      nextDelivery: z.string(),
    });

    const { userId, beans, frequency, status, nextDelivery } = schema.parse(req.body);

    const result = await pool.query(
      "SELECT id, preferences FROM tbl_user_profiles WHERE user_id = $1",
      [userId]
    );

    let currentPrefs: any = {};
    if (result.rows.length > 0) {
      const prefsStr = result.rows[0].preferences;
      if (prefsStr) {
        currentPrefs = typeof prefsStr === "string" ? JSON.parse(prefsStr) : prefsStr;
      }
    }

    const updatedPrefs = {
      ...currentPrefs,
      subscription: { beans, frequency, status, nextDelivery }
    };

    if (result.rows.length > 0) {
      await pool.query(
        "UPDATE tbl_user_profiles SET preferences = $1 WHERE user_id = $2",
        [JSON.stringify(updatedPrefs), userId]
      );
    } else {
      const profileId = crypto.randomUUID();
      await pool.query(
        "INSERT INTO tbl_user_profiles (id, user_id, preferences, metadata) VALUES ($1, $2, $3, $4)",
        [profileId, userId, JSON.stringify(updatedPrefs), JSON.stringify({})]
      );
    }

    res.json({ success: true, subscription: { beans, frequency, status, nextDelivery } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`☕ Goldneez Rewards & Business Logic Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Ready:  http://localhost:${PORT}/ready`);
  
  // Sembrar catálogos en el arranque
  seedDatabase();
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[goldneez-rewards-service] SIGTERM received. Shutting down...");
  await pool.end();
  process.exit(0);
});

export default app;
