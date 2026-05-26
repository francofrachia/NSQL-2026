const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

// ─── Parser para el JSON especial (objetos concatenados sin array) ──────────
function parseAirportsJSON(raw) {
  const airports = [];
  const regex = /\{[^{}]*\}/gs;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    try {
      const obj = JSON.parse(match[0]);
      airports.push(obj);
    } catch (e) {
      // ignorar objetos malformados
    }
  }
  return airports;
}

/**
 * Ejecuta el seed usando la conexión de Mongoose ya abierta por server.js.
 * NO abre ni cierra conexión propia.
 * @param {import('ioredis').Redis} redisGeo
 * @param {import('ioredis').Redis} redisPop
 */
async function seed(redisGeo, redisPop) {
  const Airport = require("./models/Airport");

  const count = await Airport.countDocuments();
  if (count > 0) {
    console.log(
      `[SEED] La colección ya tiene ${count} aeropuertos. Saltando seed.`
    );
    return;
  }

  // Buscar el archivo de datos
  const dataPath = path.join(__dirname, "data_trasport.json");
  console.log(`[SEED] Leyendo datos desde ${dataPath}...`);
  const raw = fs.readFileSync(dataPath, "utf-8");

  const airports = parseAirportsJSON(raw);
  console.log(`[SEED] Encontrados ${airports.length} aeropuertos.`);

  let geoAdded = 0;
  const batch = [];

  for (const ap of airports) {
    const code = ap.iata_faa || ap.icao;
    if (!code) continue;

    const doc = {
      name: ap.name || "",
      city: ap.city || "",
      iata_code: ap.iata_faa || null,
      icao: ap.icao || null,
      lat: parseFloat(ap.lat),
      lng: parseFloat(ap.lng),
      alt: ap.alt || 0,
      tz: ap.tz || "",
    };

    if (isNaN(doc.lat) || isNaN(doc.lng)) continue;

    batch.push(doc);

    // Agregar a Redis GEO
    try {
      await redisGeo.geoadd("airports-geo", doc.lng, doc.lat, code);
      geoAdded++;
    } catch (e) {
      console.warn(`[SEED] GEO error para ${code}: ${e.message}`);
    }
  }

  // Insertar en MongoDB en bulk
  if (batch.length > 0) {
    await Airport.insertMany(batch, { ordered: false });
    console.log(`[SEED] ${batch.length} aeropuertos insertados en MongoDB.`);
    console.log(`[SEED] ${geoAdded} aeropuertos agregados a Redis GEO.`);
  }

  // Inicializar ZSET de popularidad con TTL de 1 día
  const exists = await redisPop.exists("airport_popularity");
  if (!exists) {
    await redisPop.zadd("airport_popularity", 0, "__init__");
    await redisPop.expire("airport_popularity", 86400);
    console.log("[SEED] ZSET de popularidad inicializado con TTL de 1 día.");
  }

  console.log("[SEED] ¡Seed completado exitosamente!");
}

module.exports = seed;
