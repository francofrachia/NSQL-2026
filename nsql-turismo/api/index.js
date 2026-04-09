const express = require("express");
const { createClient } = require("redis");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: '*' }));

const GROUPS = ["cervecerias", "universidades", "farmacias", "emergencias", "supermercados"];

// Conecta a Redis usando la variable de entorno del docker-compose
const redis = createClient({ url: process.env.REDIS_URL || "redis://127.0.0.1:6379" });
redis.on("error", (err) => console.error("Redis error:", err));

// Middleware: verifica que el grupo de la URL sea válido
function validGroup(req, res, next) {
    if (!GROUPS.includes(req.params.group)) {
        return res.status(400).json({ error: `Grupo inválido. Opciones: ${GROUPS.join(", ")}` });
    }
    next();
}

// ── GET /places/:group ──────────────────────────────────────────
// Lista todos los lugares de un grupo
app.get("/places/:group", validGroup, async (req, res) => {
    try {
        // ZRANGE devuelve todos los miembros del conjunto geoespacial
        const places = await redis.zRange(`geo:${req.params.group}`, 0, -1);
        res.json({ group: req.params.group, places });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── POST /places/:group ─────────────────────────────────────────
// Agrega un lugar a un grupo
// Body: { name, latitude, longitude }
app.post("/places/:group", validGroup, async (req, res) => {
    try {
        const { name, latitude, longitude } = req.body;
        if (!name || !latitude || !longitude) {
            return res.status(400).json({ error: "Faltan datos: name, latitude, longitude" });
        }
        // GEOADD guarda las coordenadas en Redis
        // La clave es geo:{grupo} para tener todo organizado
        await redis.geoAdd(`geo:${req.params.group}`, {
            longitude: parseFloat(longitude),
            latitude: parseFloat(latitude),
            member: name
        });
        res.json({ message: `"${name}" agregado a ${req.params.group}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /places/:group/nearby ───────────────────────────────────
// Devuelve lugares dentro de 5km del usuario
// Query params: ?lat=-32.48&lng=-58.23
app.get("/places/:group/nearby", validGroup, async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ error: "Faltan query params: lat, lng" });
        }

        const key = `geo:${req.params.group}`;
        const tempMember = `__user_${Date.now()}`;

        // Agregar ubicación del usuario temporalmente
        await redis.geoAdd(key, {
            longitude: parseFloat(lng),
            latitude: parseFloat(lat),
            member: tempMember
        });

        // Buscar lugares cercanos
        const results = await redis.geoSearch(
            key,
            { longitude: parseFloat(lng), latitude: parseFloat(lat) },
            { radius: 5, unit: "km" },
            { SORT: "ASC" }
        );

        // Calcular distancia para cada uno y filtrar el punto temporal
        const nearby = [];
        for (const member of results) {
            if (member === tempMember) continue;
            const dist = await redis.geoDist(key, tempMember, member, "km");
            nearby.push({ member, distance: parseFloat(dist).toFixed(2) });
        }

        // Borrar punto temporal
        await redis.zRem(key, tempMember);

        res.json({ group: req.params.group, nearby });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /places/:group/distance ─────────────────────────────────
// Devuelve la distancia entre el usuario y un lugar específico
// Query params: ?lat=-32.48&lng=-58.23&place=Drakkar
app.get("/places/:group/distance", validGroup, async (req, res) => {
    try {
        const { lat, lng, place } = req.query;
        if (!lat || !lng || !place) {
            return res.status(400).json({ error: "Faltan query params: lat, lng, place" });
        }
        // Primero obtenemos las coordenadas del lugar desde Redis
        const coords = await redis.geoPos(`geo:${req.params.group}`, place);
        if (!coords || !coords[0]) {
            return res.status(404).json({ error: `"${place}" no encontrado en ${req.params.group}` });
        }
        // Luego calculamos la distancia con GEODIST usando un punto temporal
        // Como GEODIST solo funciona entre dos miembros del conjunto,
        // agregamos la ubicación del usuario temporalmente
        const tempKey = `geo:${req.params.group}`;
        const tempMember = `__user_temp_${Date.now()}`;
        await redis.geoAdd(tempKey, {
            longitude: parseFloat(lng),
            latitude: parseFloat(lat),
            member: tempMember
        });
        const distKm = await redis.geoDist(tempKey, tempMember, place, "km");
        const distM = await redis.geoDist(tempKey, tempMember, place, "m");
        // Borramos el punto temporal del usuario
        await redis.zRem(tempKey, tempMember);

        res.json({
            place,
            distanceKm: parseFloat(distKm).toFixed(2),
            distanceM: Math.round(distM)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /groups ─────────────────────────────────────────────────
// Lista todos los grupos disponibles (útil para el frontend)
app.get("/groups", (req, res) => {
    res.json({ groups: GROUPS });
});

// ── Inicio ──────────────────────────────────────────────────────
const PORT = 3000;
(async () => {
    await redis.connect();
    console.log("✅ Conectado a Redis");
    app.listen(PORT, () => {
        console.log(`🚀 API corriendo en http://localhost:${PORT}`);
    });
})();