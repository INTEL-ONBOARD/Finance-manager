# Finwise Backend Service

The standalone realtime backend that serves both the web app and the existing
desktop app. It is the only component that connects to MongoDB. Clients reach it
over HTTPS (REST) and a single WebSocket (live multi-device sync + chat).

- **Framework:** Fastify 5 (REST) + Socket.IO 4 (realtime) on one port
- **Data:** MongoDB Atlas (same `finwise` db), Redis for socket fan-out / presence
- **Auth:** JWT — httpOnly cookie (web) or `Authorization: Bearer` (desktop).
  Identity is always derived from the token server-side, never from the client.
- **Password hashing** is byte-compatible with the desktop app (`scrypt`,
  16-byte hex salt, 64-byte hex hash), so existing accounts log in unchanged.

## Layout

```
src/
  config.ts            env + validation
  db.ts                Mongo connection, col() helper, indexes
  auth/                scrypt password, JWT tokens, register/login/changePassword
  realtime/io.ts       Socket.IO: JWT socket auth, user/conversation rooms, presence
  middleware/          authGuard (token -> req.userId)
  routes/              auth, resource CRUD factory, settings, sessions, chat, health
  app.ts / server.ts   Fastify app + bootstrap (attaches Socket.IO, graceful shutdown)
Dockerfile             multi-stage build
docker-compose.yml     api + redis + caddy (auto-TLS reverse proxy)
deploy/deploy.sh       one-command SSH deploy to a VPS
```

## API surface (maps 1:1 to the old IPC channels)

| Old IPC | New endpoint |
| --- | --- |
| `auth:register / login` | `POST /api/auth/register`, `POST /api/auth/login` |
| `auth:changePassword` | `POST /api/auth/change-password` |
| `db:<x>:getAll/add/update/delete` | `GET/POST/PATCH/DELETE /api/<x>` |
| `db:bills:togglePaid` | `POST /api/bills/:id/toggle-paid` |
| `db:notifications:markRead/markAllRead` | `POST /api/notifications/:id/read`, `/read-all` |
| `db:settings:get/save` | `GET/PUT /api/settings` |
| `db:sessions:list/revoke` | `GET /api/sessions`, `DELETE /api/sessions/:id` |
| `chat:*` | `GET/POST /api/chat/*` |
| change streams (`chat:message:new`, `presence:update`) | Socket.IO events |

**Realtime events** (Socket.IO): every write emits `<resource>:created|updated|deleted`
to the user's room (all their devices); chat emits `chat:message` to the
conversation room; `presence:update` on the `presence` channel.

## Run locally

```bash
cp .env.example .env          # fill MONGO_URI + JWT_SECRET (openssl rand -hex 48)
npm install
npm run dev                   # tsx watch, no Redis needed (single instance)
curl localhost:8080/health
```

With the full stack (api + redis + caddy):

```bash
cp .env.example .env
SITE_ADDRESS=:80 docker compose up --build
```

## Deploy to the VPS

1. On the server: create `/opt/finwise/.env` from `.env.example` with the real
   `MONGO_URI`, a strong `JWT_SECRET`, and `SITE_ADDRESS`
   (a domain for auto-HTTPS, or `:80` for a first HTTP-only test).
2. From this repo:

   ```bash
   SSH_HOST=root@84.247.139.75 COMPOSE_FILE=docker-compose.behind-proxy.yml ./deploy/deploy.sh
   ```

The script installs Docker if missing, rsyncs the `server/` folder (never the
`.env`), and runs `docker compose up -d --build --wait`, then verifies the
`api` container is actually healthy before reporting success.

> For a production finance app, use a domain so Caddy can issue a real
> certificate. Bare-IP `:80` is for a first connectivity test only; set
> `COOKIE_SECURE=false` in that case or cookies will not be sent.

## Production

- **Live domain:** `https://finmate.com.lk` (and `www.`) — a host-level Caddy
  on the VPS (shared with other sites, not this repo's own `docker-compose`)
  serves the web frontend at the domain root from `/opt/finwise-web-root` and
  proxies `/finwise/*` to this backend on `127.0.0.1:4200`.
- This backend is deployed independently of the frontend. Redeploying the
  backend (above) does **not** update the web frontend — that's a separate
  step from the repo root: `VITE_BASE=/ npm run build:web` then rsync
  `dist-web/` to `/opt/finwise-web-root/` on the VPS.
- The API is also reachable (but the static frontend is *not* served) at
  `https://84.247.139.75/finwise/*` and `https://84-247-139-75.sslip.io/finwise/*`
  — kept only because desktop-backend-mode builds (`VITE_API_BASE` in
  `package.json`) point at the sslip.io host. Don't repurpose these for
  frontend hosting again; `finmate.com.lk` is the one production frontend.
