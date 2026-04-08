# 🎬 The Mandalorian - Sistema de Alquiler

API REST con Node.js + Express + Redis para alquilar capítulos de The Mandalorian.

## Requisitos

- Node.js
- Docker (para Redis)

## Instalación

### 1. Levantar Redis con Docker

```bash
docker start redis-db
# o si no existe el contenedor:
docker run -d --name redis-db -p 6379:6379 redis
```

### 2. Instalar dependencias

```bash
cd api
npm install
```

### 3. Iniciar la API

```bash
npm start
# o para desarrollo con recarga automática:
npm run dev
```

La API corre en `http://localhost:3000`

---

## Rutas disponibles

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/chapters` | Lista todos los capítulos con su estado |
| GET | `/chapters/:id` | Ver un capítulo específico |
| POST | `/chapters/:id/rent` | Alquilar (reserva por 4 minutos) |
| POST | `/chapters/:id/confirm` | Confirmar pago (alquiler por 24 hs) |
| DELETE | `/chapters/:id/cancel` | Cancelar reserva manualmente |

---

## Ejemplos de uso

### Listar capítulos
```bash
curl http://localhost:3000/chapters
```

### Alquilar un capítulo
```bash
curl -X POST http://localhost:3000/chapters/ch01/rent
```

### Confirmar el pago
```bash
curl -X POST http://localhost:3000/chapters/ch01/confirm \
  -H "Content-Type: application/json" \
  -d '{"price": 500}'
```

### Cancelar una reserva
```bash
curl -X DELETE http://localhost:3000/chapters/ch01/cancel
```

---

## Lógica de estados (manejada por Redis)

| Estado | Descripción | Clave Redis |
|--------|-------------|-------------|
| `disponible` | Libre para alquilar | — |
| `reservado` | Pendiente de pago (4 min) | `reserved:{id}` con TTL 240s |
| `alquilado` | Pago confirmado (24 hs) | `rented:{id}` con TTL 86400s |

### Claves utilizadas en Redis

- `chapter:{id}` → Hash con los datos del capítulo
- `reserved:{id}` → String con TTL de 240 segundos (4 minutos). Se usa `SET NX` para garantizar que solo una persona pueda reservar a la vez.
- `rented:{id}` → String con TTL de 86400 segundos (24 horas). Contiene precio y fecha del alquiler.

### ¿Por qué SET NX?
El comando `SET reserved:{id} "pending" NX EX 240` garantiza que:
- Solo se crea la clave si **no existe** (NX = Not eXists)
- Expira automáticamente en 4 minutos (EX 240)
- Si el pago no se confirma, Redis libera el capítulo solo

Esto elimina la necesidad de lógica compleja en la aplicación: **la base de datos resuelve la concurrencia y la expiración**.
