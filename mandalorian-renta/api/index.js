const express = require("express");
const { createClient } = require("redis");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ── Conexión a Redis ──────────────────────────────────────────────
const redis = createClient({ url: "redis://127.0.0.1:6379" });
redis.on("error", (err) => console.error("Redis error:", err));

// ── Capítulos de The Mandalorian ──────────────────────────────────
const CHAPTERS = [
  // Temporada 1
  { id: "ch01", season: 1, number: 1, title: "El mandaloriano", titleEn: "The Mandalorian" },
  { id: "ch02", season: 1, number: 2, title: "El niño", titleEn: "The Child" },
  { id: "ch03", season: 1, number: 3, title: "El pecado", titleEn: "The Sin" },
  { id: "ch04", season: 1, number: 4, title: "Santuario", titleEn: "Sanctuary" },
  { id: "ch05", season: 1, number: 5, title: "El pistolero", titleEn: "The Gunslinger" },
  { id: "ch06", season: 1, number: 6, title: "El prisionero", titleEn: "The Prisoner" },
  { id: "ch07", season: 1, number: 7, title: "El ajuste de cuentas", titleEn: "The Reckoning" },
  { id: "ch08", season: 1, number: 8, title: "Redención", titleEn: "Redemption" },
  // Temporada 2
  { id: "ch09", season: 2, number: 9, title: "El mariscal", titleEn: "The Marshal" },
  { id: "ch10", season: 2, number: 10, title: "La pasajera", titleEn: "The Passenger" },
  { id: "ch11", season: 2, number: 11, title: "La heredera", titleEn: "The Heiress" },
  { id: "ch12", season: 2, number: 12, title: "El asedio", titleEn: "The Siege" },
  { id: "ch13", season: 2, number: 13, title: "La Jedi", titleEn: "The Jedi" },
  { id: "ch14", season: 2, number: 14, title: "La tragedia", titleEn: "The Tragedy" },
  { id: "ch15", season: 2, number: 15, title: "El creyente", titleEn: "The Believer" },
  { id: "ch16", season: 2, number: 16, title: "El rescate", titleEn: "The Rescue" },
  // Temporada 3
  { id: "ch17", season: 3, number: 17, title: "El apóstata", titleEn: "The Apostate" },
  { id: "ch18", season: 3, number: 18, title: "Las minas de Mandalore", titleEn: "The Mines of Mandalore" },
  { id: "ch19", season: 3, number: 19, title: "El converso", titleEn: "The Convert" },
  { id: "ch20", season: 3, number: 20, title: "El huérfano", titleEn: "The Foundling" },
  { id: "ch21", season: 3, number: 21, title: "El pirata", titleEn: "The Pirate" },
  { id: "ch22", season: 3, number: 22, title: "Pistoleros a sueldo", titleEn: "Guns for Hire" },
  { id: "ch23", season: 3, number: 23, title: "Los espías", titleEn: "The Spies" },
  { id: "ch24", season: 3, number: 24, title: "El regreso", titleEn: "The Return" },
];

// ── Seed: carga los capítulos en Redis si no existen ─────────────
async function seedChapters() {
  for (const ch of CHAPTERS) {
    const exists = await redis.exists(`chapter:${ch.id}`);
    if (!exists) {
      await redis.hSet(`chapter:${ch.id}`, {
        id: ch.id,
        season: ch.season,
        number: ch.number,
        title: ch.title,
        titleEn: ch.titleEn,
      });
    }
  }
  console.log("✅ Capítulos cargados en Redis");
}

// ── Helper: obtener estado de un capítulo ────────────────────────
// Estados posibles: "disponible" | "reservado" | "alquilado"
async function getChapterStatus(id) {
  const rented = await redis.exists(`rented:${id}`);
  if (rented) return "alquilado";
  const reserved = await redis.exists(`reserved:${id}`);
  if (reserved) return "reservado";
  return "disponible";
}

// ════════════════════════════════════════════════════════════════
// RUTAS
// ════════════════════════════════════════════════════════════════

// ── GET /chapters ── Listar todos los capítulos con su estado ────
app.get("/chapters", async (req, res) => {
  try {
    const result = [];

    for (const ch of CHAPTERS) {
      const status = await getChapterStatus(ch.id);

      // Si está reservado, calcular tiempo restante
      let ttl = null;
      if (status === "reservado") {
        ttl = await redis.ttl(`reserved:${ch.id}`);
      }
      if (status === "alquilado") {
        ttl = await redis.ttl(`rented:${ch.id}`);
      }

      result.push({ ...ch, status, ttl });
    }

    // Agrupar por temporada
    const seasons = {};
    for (const ch of result) {
      if (!seasons[ch.season]) seasons[ch.season] = [];
      seasons[ch.season].push(ch);
    }

    res.json({ seasons });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /chapters/:id ── Ver un capítulo específico ──────────────
app.get("/chapters/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ch = await redis.hGetAll(`chapter:${id}`);
    if (!ch || !ch.id) return res.status(404).json({ error: "Capítulo no encontrado" });

    const status = await getChapterStatus(id);
    let ttl = null;
    if (status !== "disponible") {
      const key = status === "reservado" ? `reserved:${id}` : `rented:${id}`;
      ttl = await redis.ttl(key);
    }

    res.json({ ...ch, status, ttl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /chapters/:id/rent ── Alquilar (reservar por 4 minutos) ─
//
// Lógica Redis:
//   - SET reserved:{id} ... NX EX 240
//   - NX = solo si no existe → garantiza 1 persona a la vez
//   - EX 240 = expira en 4 minutos automáticamente
//
app.post("/chapters/:id/rent", async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el capítulo existe
    const ch = await redis.hGetAll(`chapter:${id}`);
    if (!ch || !ch.id) return res.status(404).json({ error: "Capítulo no encontrado" });

    // Verificar si ya está alquilado (confirmado)
    const rented = await redis.exists(`rented:${id}`);
    if (rented) {
      return res.status(409).json({ error: "El capítulo ya está alquilado" });
    }

    // Intentar reservar: NX garantiza que solo 1 persona lo puede reservar
    const reserved = await redis.set(`reserved:${id}`, "pending", { NX: true, EX: 240 });

    if (!reserved) {
      return res.status(409).json({ error: "El capítulo ya está reservado por otro usuario" });
    }

    res.json({
      message: `Capítulo "${ch.title}" reservado. Tiene 4 minutos para confirmar el pago.`,
      chapterId: id,
      expiresInSeconds: 240,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /chapters/:id/confirm ── Confirmar pago ─────────────────
//
// Lógica Redis:
//   - Verifica que exista reserved:{id}
//   - Elimina la reserva temporal
//   - Crea rented:{id} con EX 86400 (24 horas)
//
app.post("/chapters/:id/confirm", async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;

    if (!price || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({ error: "Debe indicar un precio válido" });
    }

    // Verificar que esté reservado
    const reserved = await redis.exists(`reserved:${id}`);
    if (!reserved) {
      return res.status(409).json({
        error: "El capítulo no está reservado o la reserva expiró. Intente alquilarlo nuevamente.",
      });
    }

    const ch = await redis.hGetAll(`chapter:${id}`);

    // Eliminar reserva temporal y crear alquiler por 24 horas
    await redis.del(`reserved:${id}`);
    await redis.set(`rented:${id}`, JSON.stringify({ price, rentedAt: new Date().toISOString() }), { EX: 86400 });

    res.json({
      message: `Pago confirmado. Disfrute "${ch.title}". El alquiler vence en 24 horas.`,
      chapterId: id,
      price: Number(price),
      expiresInHours: 24,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /chapters/:id/cancel ── Cancelar reserva manualmente ──
app.delete("/chapters/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await redis.del(`reserved:${id}`);
    if (!deleted) return res.status(404).json({ error: "No hay reserva activa para este capítulo" });
    res.json({ message: "Reserva cancelada. El capítulo vuelve a estar disponible." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════
// INICIO
// ════════════════════════════════════════════════════════════════
const PORT = 3000;

(async () => {
  await redis.connect();
  await seedChapters();
  app.listen(PORT, () => {
    console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    console.log(`📺 GET  http://localhost:${PORT}/chapters`);
    console.log(`🔒 POST http://localhost:${PORT}/chapters/:id/rent`);
    console.log(`✅ POST http://localhost:${PORT}/chapters/:id/confirm`);
  });
})();
