const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Redis = require("ioredis");
const seed = require("./seed");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Configuración ───────────────────────────────────────────────────────────
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/airport_db";
const REDIS_GEO_HOST = process.env.REDIS_GEO_HOST || "localhost";
const REDIS_GEO_PORT = parseInt(process.env.REDIS_GEO_PORT || "6379");
const REDIS_POP_HOST = process.env.REDIS_POP_HOST || "localhost";
const REDIS_POP_PORT = parseInt(process.env.REDIS_POP_PORT || "6379");

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Conexión y arranque ─────────────────────────────────────────────────────
async function start() {
  // Conectar a MongoDB con reintentos
  let retries = 10;
  while (retries > 0) {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("[SERVER] Conectado a MongoDB ✓");
      break;
    } catch (err) {
      retries--;
      console.warn(
        `[SERVER] MongoDB no disponible. Reintentando... (${retries} intentos restantes)`
      );
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (mongoose.connection.readyState !== 1) {
    console.error("[SERVER] No se pudo conectar a MongoDB. Abortando.");
    process.exit(1);
  }

  // Conectar a Redis GEO
  const redisGeo = new Redis({
    host: REDIS_GEO_HOST,
    port: REDIS_GEO_PORT,
    retryStrategy: (times) => Math.min(times * 500, 3000),
  });
  redisGeo.on("connect", () => console.log("[SERVER] Conectado a Redis GEO ✓"));
  redisGeo.on("error", (e) => console.error("[Redis GEO]", e.message));

  // Conectar a Redis Popularidad
  const redisPop = new Redis({
    host: REDIS_POP_HOST,
    port: REDIS_POP_PORT,
    retryStrategy: (times) => Math.min(times * 500, 3000),
  });
  redisPop.on("connect", () =>
    console.log("[SERVER] Conectado a Redis Popularidad ✓")
  );
  redisPop.on("error", (e) => console.error("[Redis Pop]", e.message));

  // Esperar a que Redis esté listo
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Exponer Redis en app.locals para los routers
  app.locals.redisGeo = redisGeo;
  app.locals.redisPop = redisPop;

  // Ejecutar seed automático si la BD está vacía
  console.log("[SERVER] Verificando si se necesita seed...");
  await seed(redisGeo, redisPop);

  // Montar rutas
  const airportsRouter = require("./routes/airports");
  app.use("/airports", airportsRouter);

  // Arrancar servidor
  app.listen(PORT, () => {
    console.log(`[SERVER] API escuchando en http://0.0.0.0:${PORT}`);
    console.log(`[SERVER] Endpoints disponibles:`);
    console.log(`  GET    /airports`);
    console.log(`  GET    /airports/popular`);
    console.log(`  GET    /airports/nearby?lat=..&lng=..&radius=km`);
    console.log(`  GET    /airports/:iata`);
    console.log(`  POST   /airports`);
    console.log(`  PUT    /airports/:iata`);
    console.log(`  DELETE /airports/:iata`);
  });
}

start().catch((err) => {
  console.error("[SERVER] Error fatal:", err);
  process.exit(1);
});
