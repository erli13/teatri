# Teatri - Theatre POS & Booking System

Sistem i plote per menaxhimin e biletave dhe rezervimeve per teatro, i lokalizuar per Shqiperine (monedha ALL, qyteti Elbasan).

## Struktura

```
theatreSystem/
├── web-app/          # Next.js 16 — admin panel, agjente shitjesh, booking publik
├── scanner-app/      # React Native / Expo 54 — skanim biletash me QR
├── docker-compose.yml  # Ngre gjithe sistemin (postgres + web-app)
└── .github/workflows/  # CI/CD me GitHub Actions (self-hosted runner)
```

## Tech Stack

| Shtresa       | Teknologjia                          |
|---------------|--------------------------------------|
| Frontend      | Next.js 16, React 19, Tailwind CSS 4 |
| Backend/API   | Next.js Route Handlers               |
| Database      | PostgreSQL 16, Prisma 7              |
| Auth          | JWT + Cookie (jose, bcryptjs)        |
| Mobile        | Expo 54, React Native 0.81           |
| Infra         | Docker Compose, GitHub Actions       |

## Modelet e te dhenave

- **User** — admin, staff, customer (role-based access)
- **Venue** — salla teatrale me zona vendesh (SeatingZone -> Seat)
- **Show** — shfaqje me data, cmime per zone (ShowPrice)
- **Ticket** — bilete me status (RESERVED -> PAID -> USED), QR code unik

## Deploy me Docker (Production)

### 1. Konfiguro secrets ne GitHub

Shko te **Settings > Secrets and variables > Actions** dhe shto:

| Secret              | Pershkrimi                      |
|---------------------|---------------------------------|
| `POSTGRES_USER`     | Username per PostgreSQL         |
| `POSTGRES_PASSWORD` | Password per PostgreSQL         |
| `POSTGRES_DB`       | Emri i databazes                |
| `WEB_PORT`          | Porti (default: 3000)           |
| `SESSION_SECRET`    | 32+ byte random secret per JWT  |
| `SCANNER_API_KEY`   | API key per scanner app         |
| `MASTER_BYPASS_CODE`| Kodi bypass per testim          |

### 2. Deploy automatik

Cdo push ne `main` ben automatikisht:
1. Checkout kodin ne self-hosted runner (AWS VM)
2. Krijon `.env` nga GitHub Secrets
3. Build Docker images
4. Ngre kontejnerat me `docker compose up -d`

### 3. Deploy manual

```bash
cp .env.example .env
# Edito .env me vlerat e produksionit

docker compose build
docker compose up -d
```

## Zhvillim Lokal

### Web App

```bash
cd web-app
npm install
```

Krijo `web-app/.env`:
```
DATABASE_URL="postgresql://admin:password123@localhost:5432/theatre_db"
SESSION_SECRET="dev-only-secret-replace-me-with-32-bytes-of-real-random-data"
SCANNER_API_KEY="dev-scanner-key-replace-me"
MASTER_BYPASS_CODE="MASTER-BYPASS-CHANGE-ME-9f3c1a7e8b2d4c6f"
```

```bash
# Ngri postgres lokalisht
docker compose up postgres -d

# Migro dhe mbill databazen
npx prisma migrate deploy
npx prisma db seed

# Nise dev serverin
npm run dev -- --webpack
```

### Scanner App (mobile)

```bash
cd scanner-app
npm install
npm start
```

## Rolet

| Rol      | Akses                                                    |
|----------|----------------------------------------------------------|
| ADMIN    | `/admin` — menaxhon salla, shfaqje, cmime, agjente      |
| STAFF    | `/agent` — shet bileta, printon QR                       |
| CUSTOMER | Faqja publike — shikon shfaqje                           |

## License

Private
