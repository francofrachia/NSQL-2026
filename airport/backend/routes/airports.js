const express = require("express");
const router = express.Router();
const Airport = require("../models/Airport");

// ─── Helpers ────────────────────────────────────────────────────────────────
// Obtener las instancias Redis inyectadas desde server.js
function getRedis(req) {
  return {
    geo: req.app.locals.redisGeo,
    pop: req.app.locals.redisPop,
  };
}

// ─── GET /airports/popular ──────────────────────────────────────────────────
// IMPORTANTE: debe ir antes de /:iata para evitar conflictos de routing
router.get("/popular", async (req, res) => {
  try {
    const { pop } = getRedis(req);
    const limit = parseInt(req.query.limit) || 10;

    // ZRANGE ... REV WITHSCORES (Redis 6.2+) equivalente a ZREVRANGE
    const raw = await pop.zrevrange("airport_popularity", 0, limit - 1, "WITHSCORES");

    // raw = [member, score, member, score, ...]
    const results = [];
    for (let i = 0; i < raw.length; i += 2) {
      const code = raw[i];
      const score = parseInt(raw[i + 1]);
      if (code === "__init__") continue;

      // Buscar datos completos en MongoDB
      const airport = await Airport.findOne({
        $or: [{ iata_code: code }, { icao: code }],
      }).lean();

      results.push({
        iata_code: code,
        visits: score,
        airport: airport || null,
      });
    }

    res.json({ popular: results });
  } catch (err) {
    console.error("[popular]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /airports/nearby ───────────────────────────────────────────────────
router.get("/nearby", async (req, res) => {
  try {
    const { geo } = getRedis(req);
    const { lat, lng, radius = 100 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Se requieren lat y lng" });
    }

    const radiusKm = parseFloat(radius);

    // GEOSEARCH: disponible desde Redis 6.2
    // Fallback a GEORADIUS si es necesario
    let members;
    try {
      members = await geo.call(
        "GEOSEARCH",
        "airports-geo",
        "FROMLONLAT",
        parseFloat(lng),
        parseFloat(lat),
        "BYRADIUS",
        radiusKm,
        "km",
        "ASC",
        "WITHCOORD",
        "WITHDIST",
        "COUNT",
        100
      );
    } catch {
      // fallback Redis < 6.2
      members = await geo.georadius(
        "airports-geo",
        parseFloat(lng),
        parseFloat(lat),
        radiusKm,
        "km",
        "ASC",
        "WITHCOORD",
        "WITHDIST",
        "COUNT",
        100
      );
    }

    // Enriquecer con datos de MongoDB
    const results = await Promise.all(
      members.map(async (m) => {
        const code = Array.isArray(m) ? m[0] : m;
        const dist = Array.isArray(m) ? parseFloat(m[1]) : null;
        const coord = Array.isArray(m) ? m[2] : null;

        const airport = await Airport.findOne({
          $or: [{ iata_code: code }, { icao: code }],
        }).lean();

        return {
          iata_code: code,
          distance_km: dist,
          coord,
          airport: airport || null,
        };
      })
    );

    res.json({ nearby: results, count: results.length });
  } catch (err) {
    console.error("[nearby]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /airports ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 100, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { iata_code: { $regex: search, $options: "i" } },
      ];
    }

    const [airports, total] = await Promise.all([
      Airport.find(query).skip(skip).limit(parseInt(limit)).lean(),
      Airport.countDocuments(query),
    ]);

    res.json({ airports, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error("[GET /airports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /airports ─────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { geo } = getRedis(req);
    const { name, city, iata_code, icao, lat, lng, alt, tz } = req.body;

    if (!name || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "name, lat y lng son requeridos" });
    }

    const airport = new Airport({ name, city, iata_code, icao, lat, lng, alt, tz });
    await airport.save();

    // Agregar a Redis GEO
    const code = iata_code || icao;
    if (code) {
      await geo.geoadd("airports-geo", lng, lat, code);
    }

    res.status(201).json({ message: "Aeropuerto creado", airport });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "El código IATA ya existe" });
    }
    console.error("[POST /airports]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /airports/:iata ─────────────────────────────────────────────────────
router.get("/:iata", async (req, res) => {
  try {
    const { pop } = getRedis(req);
    const code = req.params.iata.toUpperCase();

    const airport = await Airport.findOne({
      $or: [{ iata_code: code }, { icao: code }],
    }).lean();

    if (!airport) {
      return res.status(404).json({ error: "Aeropuerto no encontrado" });
    }

    // Sumar +1 en Redis Popularidad
    await pop.zincrby("airport_popularity", 1, code);

    // Renovar TTL cada vez que se accede (o dejarlo fijo, depende del criterio)
    // Verificamos si el TTL está activo
    const ttl = await pop.ttl("airport_popularity");
    if (ttl < 0) {
      await pop.expire("airport_popularity", 86400);
    }

    res.json({ airport });
  } catch (err) {
    console.error("[GET /airports/:iata]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /airports/:iata ─────────────────────────────────────────────────────
router.put("/:iata", async (req, res) => {
  try {
    const { geo } = getRedis(req);
    const code = req.params.iata.toUpperCase();

    const airport = await Airport.findOneAndUpdate(
      { $or: [{ iata_code: code }, { icao: code }] },
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    if (!airport) {
      return res.status(404).json({ error: "Aeropuerto no encontrado" });
    }

    // Si cambiaron coordenadas, actualizar Redis GEO
    if (req.body.lat !== undefined || req.body.lng !== undefined) {
      const newLat = req.body.lat ?? airport.lat;
      const newLng = req.body.lng ?? airport.lng;
      await geo.geoadd("airports-geo", newLng, newLat, code);
    }

    res.json({ message: "Aeropuerto actualizado", airport });
  } catch (err) {
    console.error("[PUT /airports/:iata]", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /airports/:iata ───────────────────────────────────────────────────
router.delete("/:iata", async (req, res) => {
  try {
    const { geo, pop } = getRedis(req);
    const code = req.params.iata.toUpperCase();

    const airport = await Airport.findOneAndDelete({
      $or: [{ iata_code: code }, { icao: code }],
    });

    if (!airport) {
      return res.status(404).json({ error: "Aeropuerto no encontrado" });
    }

    // Eliminar de Redis GEO
    await geo.zrem("airports-geo", code);

    // Eliminar de Redis Popularidad
    await pop.zrem("airport_popularity", code);

    res.json({ message: "Aeropuerto eliminado", iata_code: code });
  } catch (err) {
    console.error("[DELETE /airports/:iata]", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
