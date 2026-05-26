/* ═══════════════════════════════════════════════════════════════
   AirportMap – app.js
   ═══════════════════════════════════════════════════════════════ */

// ── Config ──────────────────────────────────────────────────────
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const API_BASE = isLocal ? "http://localhost:3000" : "/api";

// ── Estado global ────────────────────────────────────────────────
let map;
let markerCluster;
let allMarkers = {};
let nearbyCircle = null;

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadAllAirports();
  loadPopular();
});

// ════════════════════════════════════════════════════════════════
// MAPA
// ════════════════════════════════════════════════════════════════

function initMap() {
  map = L.map("map", { center: [20, 0], zoom: 2, zoomControl: false });

  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }
  ).addTo(map);

  L.control.zoom({ position: "bottomright" }).addTo(map);

  markerCluster = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 60,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: createClusterIcon,
  });

  map.addLayer(markerCluster);
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const isLarge = count > 100;
  const isMedium = count > 20;
  const color = isLarge ? "#ef4444" : isMedium ? "#8b5cf6" : "#3b82f6";
  const dim = isLarge ? 48 : isMedium ? 40 : 34;
  return L.divIcon({
    html: `<div style="width:${dim}px;height:${dim}px;background:${color}22;border:2px solid ${color};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:${dim < 40 ? 11 : 13}px;font-weight:700;color:${color};font-family:Inter,sans-serif;backdrop-filter:blur(4px);">${count}</div>`,
    className: "",
    iconSize: [dim, dim],
    iconAnchor: [dim / 2, dim / 2],
  });
}

function makeAirportIcon(highlighted = false) {
  const c = highlighted ? "#f59e0b" : "#3b82f6";
  const b = highlighted ? "#fbbf24" : "#93c5fd";
  return L.divIcon({
    html: `<div style="width:10px;height:10px;background:${c};border:2px solid ${b};border-radius:50%;box-shadow:0 0 6px ${c}88;"></div>`,
    className: "",
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

// ════════════════════════════════════════════════════════════════
// CARGA INICIAL
// ════════════════════════════════════════════════════════════════

async function loadAllAirports() {
  showLoader(true);
  try {
    let page = 1;
    let total = 0;
    let loaded = 0;
    do {
      const res = await fetch(`${API_BASE}/airports?page=${page}&limit=500`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (page === 1) {
        total = data.total;
        document.getElementById("stat-total").textContent =
          `✈ ${total.toLocaleString("es-AR")} aeropuertos`;
      }
      data.airports.forEach(addMarker);
      loaded += data.airports.length;
      page++;
    } while (loaded < total && page <= 30);
  } catch (err) {
    console.error("Error cargando aeropuertos:", err);
    document.getElementById("stat-total").textContent = "⚠ Error al cargar";
  } finally {
    showLoader(false);
  }
}

function addMarker(ap) {
  if (ap.lat == null || ap.lng == null) return;
  const code = ap.iata_code || ap.icao;
  if (!code) return;

  const marker = L.marker([ap.lat, ap.lng], {
    icon: makeAirportIcon(false),
    title: ap.name,
  });

  marker.bindPopup(`
    <div style="font-family:Inter,sans-serif;min-width:150px">
      <div style="font-size:0.62rem;color:#3b82f6;font-weight:700;letter-spacing:1px;margin-bottom:3px">${code}</div>
      <div style="font-size:0.88rem;font-weight:700;margin-bottom:2px">${ap.name}</div>
      <div style="font-size:0.73rem;color:#94a3b8;margin-bottom:8px">${ap.city || ""}</div>
      <div style="font-size:0.7rem;color:#64748b">← Clic para detalles y sumar visita</div>
    </div>
  `);

  marker.on("click", () => fetchAirportDetail(code));
  marker._airportCode = code;
  markerCluster.addLayer(marker);
  allMarkers[code] = marker;
}

// ════════════════════════════════════════════════════════════════
// DETALLE DE AEROPUERTO (GET /:iata → suma +1 popularidad)
// ════════════════════════════════════════════════════════════════

async function fetchAirportDetail(code) {
  try {
    const res = await fetch(`${API_BASE}/airports/${code}`);
    if (!res.ok) throw new Error("No encontrado");
    const { airport } = await res.json();
    showModal(airport);
    // Actualizar ranking visible
    loadPopular();
  } catch (err) {
    console.error("fetchAirportDetail error:", err);
  }
}

function showModal(ap) {
  const code = ap.iata_code || ap.icao || "—";
  document.getElementById("modal-content").innerHTML = `
    <div class="modal-iata">✈ ${code}${ap.icao && ap.icao !== code ? " / " + ap.icao : ""}</div>
    <div class="modal-name">${ap.name}</div>
    <div class="modal-city">${ap.city || "Sin información de ciudad"}</div>
    <div class="modal-grid">
      <div class="modal-field">
        <div class="modal-field-label">Código IATA</div>
        <div class="modal-field-value">${ap.iata_code || "—"}</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">Código ICAO</div>
        <div class="modal-field-value">${ap.icao || "—"}</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">Altitud</div>
        <div class="modal-field-value">${ap.alt != null ? ap.alt + " ft" : "—"}</div>
      </div>
      <div class="modal-field">
        <div class="modal-field-label">Zona horaria</div>
        <div class="modal-field-value" style="font-size:0.72rem">${ap.tz || "—"}</div>
      </div>
      <div class="modal-field modal-coords">
        <div class="modal-field-label">Coordenadas</div>
        <div class="modal-field-value">${ap.lat?.toFixed(5) ?? "—"}, ${ap.lng?.toFixed(5) ?? "—"}</div>
      </div>
    </div>
  `;
  document.getElementById("modal-overlay").classList.add("active");
  if (ap.lat != null && ap.lng != null) {
    map.setView([ap.lat, ap.lng], Math.max(map.getZoom(), 6), { animate: true });
    const m = allMarkers[ap.iata_code || ap.icao];
    if (m) markerCluster.zoomToShowLayer(m, () => m.openPopup());
  }
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("active");
}

// ════════════════════════════════════════════════════════════════
// BÚSQUEDA DE TEXTO
// ════════════════════════════════════════════════════════════════

async function searchAirports() {
  const query = document.getElementById("input-search").value.trim();
  const box = document.getElementById("search-results");
  const btn = document.getElementById("btn-search");

  if (!query) {
    hideBox(box);
    return;
  }

  setLoading(btn, true);
  try {
    const res = await fetch(`${API_BASE}/airports?search=${encodeURIComponent(query)}&limit=50`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderSearchResults(data.airports, box);
  } catch (err) {
    console.error("searchAirports error:", err);
    renderError(box, "Error al conectar con la API.");
  } finally {
    setLoading(btn, false);
  }
}

function renderSearchResults(airports, box) {
  box.classList.remove("hidden");
  if (airports.length === 0) {
    box.innerHTML = `<div class="result-empty">No se encontraron aeropuertos.</div>`;
    return;
  }
  box.innerHTML = `
    <div class="result-header">
      Resultados
      <span class="result-count">${airports.length}</span>
    </div>
    ${airports.map(ap => {
      const code = ap.iata_code || ap.icao || "—";
      return `<div class="result-item" onclick="flyToAirport('${code}')">
        <div class="result-name">${ap.name}</div>
        <div class="result-meta">${code} · ${ap.city || "—"}</div>
      </div>`;
    }).join("")}
  `;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ════════════════════════════════════════════════════════════════
// AEROPUERTOS CERCANOS
// ════════════════════════════════════════════════════════════════

async function searchNearby() {
  const lat = parseFloat(document.getElementById("input-lat").value);
  const lng = parseFloat(document.getElementById("input-lng").value);
  const radius = parseFloat(document.getElementById("input-radius").value) || 500;
  const box = document.getElementById("nearby-results");
  const btn = document.getElementById("btn-nearby");

  if (isNaN(lat) || isNaN(lng)) {
    box.classList.remove("hidden");
    box.innerHTML = `<div class="result-empty">⚠ Ingresá latitud y longitud válidas.</div>`;
    return;
  }

  // Dibujar radio en el mapa
  if (nearbyCircle) map.removeLayer(nearbyCircle);
  nearbyCircle = L.circle([lat, lng], {
    radius: radius * 1000,
    color: "#8b5cf6",
    fillColor: "#8b5cf6",
    fillOpacity: 0.07,
    weight: 2,
    dashArray: "6 4",
  }).addTo(map);
  map.fitBounds(nearbyCircle.getBounds(), { padding: [30, 30] });

  setLoading(btn, true);
  try {
    const res = await fetch(
      `${API_BASE}/airports/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderNearbyResults(data.nearby || [], box);
  } catch (err) {
    console.error("searchNearby error:", err);
    renderError(box, "Error al buscar cercanos.");
  } finally {
    setLoading(btn, false);
  }
}

function renderNearbyResults(items, box) {
  box.classList.remove("hidden");
  const real = items.filter(i => i.airport);
  if (real.length === 0) {
    box.innerHTML = `<div class="result-empty">No hay aeropuertos en ese radio.</div>`;
    return;
  }
  box.innerHTML = `
    <div class="result-header">
      Cercanos encontrados
      <span class="result-count">${real.length}</span>
    </div>
    ${real.map(item => {
      const ap = item.airport;
      const code = ap.iata_code || ap.icao || "—";
      const dist = item.distance_km != null ? item.distance_km.toFixed(1) + " km" : "";
      return `<div class="result-item" onclick="flyToAirport('${code}')">
        <div class="result-name">${ap.name}</div>
        <div class="result-meta">${code} · ${ap.city || "—"}</div>
        ${dist ? `<div class="result-dist">📍 ${dist}</div>` : ""}
      </div>`;
    }).join("")}
  `;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function useMyLocation() {
  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById("input-lat").value = pos.coords.latitude.toFixed(6);
      document.getElementById("input-lng").value = pos.coords.longitude.toFixed(6);
    },
    () => {
      alert(
        "No se pudo obtener tu ubicación.\n\n" +
        "En escritorios sin GPS, el navegador estima la posición por IP y puede ser impreciso.\n" +
        "Usá el botón 'Clic en mapa' para seleccionar tu ubicación manualmente."
      );
    }
  );
}

// ── Map Picker (clic en mapa para setear coordenadas) ───────────────────────
let pickerActive = false;
let pickerHandler = null;

function toggleMapPicker() {
  const btn   = document.getElementById("btn-pick-map");
  const hint  = document.getElementById("map-picker-hint");
  const mapEl = document.getElementById("map");

  if (pickerActive) {
    // Desactivar
    pickerActive = false;
    if (pickerHandler) { map.off("click", pickerHandler); pickerHandler = null; }
    btn.textContent  = "🗺 Clic en mapa";
    btn.style.borderColor = "";
    hint.classList.add("hidden");
    mapEl.classList.remove("picker-mode");
  } else {
    // Activar
    pickerActive = true;
    btn.innerHTML = "✕ Cancelar selección";
    btn.style.borderColor = "#8b5cf6";
    hint.classList.remove("hidden");
    mapEl.classList.add("picker-mode");

    pickerHandler = (e) => {
      document.getElementById("input-lat").value = e.latlng.lat.toFixed(6);
      document.getElementById("input-lng").value = e.latlng.lng.toFixed(6);
      toggleMapPicker(); // auto-desactivar tras seleccionar
    };
    map.once("click", pickerHandler);
  }
}

// ════════════════════════════════════════════════════════════════
// POPULARIDAD
// ════════════════════════════════════════════════════════════════

async function loadPopular() {
  try {
    const res = await fetch(`${API_BASE}/airports/popular?limit=10`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderPopular(data.popular || []);
  } catch (err) {
    console.error("loadPopular error:", err);
  }
}

function renderPopular(items) {
  const list = document.getElementById("popular-list");
  const real = items.filter(i => i.iata_code !== "__init__" && i.visits > 0);

  if (real.length === 0) {
    list.innerHTML = `<p class="hint">Hacé clic en aeropuertos del mapa para generar el ranking.</p>`;
    return;
  }

  list.innerHTML = real.map((item, idx) => {
    const ap = item.airport;
    const code = item.iata_code;
    const rankClass = idx === 0 ? "gold" : idx === 1 ? "silver" : idx === 2 ? "bronze" : "";
    return `<div class="popular-item" onclick="flyToAirport('${code}')">
      <span class="popular-rank ${rankClass}">#${idx + 1}</span>
      <div class="popular-info">
        <div class="popular-name">${ap?.name || code}</div>
        <div class="popular-code">${code} · ${ap?.city || "—"}</div>
      </div>
      <span class="popular-score">👁 ${item.visits}</span>
    </div>`;
  }).join("");
}

// ════════════════════════════════════════════════════════════════
// AGREGAR AEROPUERTO (POST /airports)
// ════════════════════════════════════════════════════════════════

async function addAirport() {
  const btn     = document.getElementById("btn-add");
  const box     = document.getElementById("add-result");
  const nameVal = document.getElementById("new-name").value.trim();
  const latVal  = parseFloat(document.getElementById("new-lat").value);
  const lngVal  = parseFloat(document.getElementById("new-lng").value);

  if (!nameVal || isNaN(latVal) || isNaN(lngVal)) {
    box.classList.remove("hidden");
    box.innerHTML = `<div class="result-empty">⚠ Nombre, Latitud y Longitud son obligatorios.</div>`;
    return;
  }

  const payload = {
    name:      nameVal,
    city:      document.getElementById("new-city").value.trim(),
    iata_code: document.getElementById("new-iata").value.trim().toUpperCase() || null,
    icao:      document.getElementById("new-icao").value.trim().toUpperCase() || null,
    lat:       latVal,
    lng:       lngVal,
    alt:       parseInt(document.getElementById("new-alt").value) || 0,
    tz:        document.getElementById("new-tz").value.trim(),
  };

  setLoading(btn, true);
  try {
    const res = await fetch(`${API_BASE}/airports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    // Éxito: agregar marker al mapa y limpiar formulario
    addMarker(data.airport);
    ["new-name","new-city","new-iata","new-icao","new-lat","new-lng","new-alt","new-tz"]
      .forEach(id => { document.getElementById(id).value = ""; });

    box.classList.remove("hidden");
    box.innerHTML = `<div class="result-empty" style="color:#10b981">
      ✅ Aeropuerto <strong>${data.airport.name}</strong> creado correctamente.
      Aparece en el mapa.
    </div>`;

    // Volar al nuevo aeropuerto
    map.setView([latVal, lngVal], 10, { animate: true });

    // Actualizar contador
    const cur = parseInt(document.getElementById("stat-total").textContent.replace(/[^\d]/g, ""));
    document.getElementById("stat-total").textContent = `✈ ${(cur + 1).toLocaleString("es-AR")} aeropuertos`;

  } catch (err) {
    console.error("addAirport error:", err);
    box.classList.remove("hidden");
    box.innerHTML = `<div class="result-empty">⚠ Error: ${err.message}</div>`;
  } finally {
    setLoading(btn, false);
  }
}


/** Vuela al marcador y abre su popup + modal (cuenta visita) */
function flyToAirport(code) {
  const marker = allMarkers[code];
  if (marker) {
    markerCluster.zoomToShowLayer(marker, () => {
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 8), { animate: true });
      marker.openPopup();
    });
  }
  fetchAirportDetail(code);
}

function setLoading(btn, loading) {
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");
  btn.disabled = loading;
  if (text) text.classList.toggle("hidden", loading);
  if (spinner) spinner.classList.toggle("hidden", !loading);
}

function hideBox(box) {
  box.classList.add("hidden");
  box.innerHTML = "";
}

function renderError(box, msg) {
  box.classList.remove("hidden");
  box.innerHTML = `<div class="result-empty">⚠ ${msg}</div>`;
}

function showLoader(show) {
  document.getElementById("loader").classList.toggle("hidden", !show);
}
