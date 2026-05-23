# Teatri - Theatre POS & Booking System

Sistem i plotë për menaxhimin e biletave dhe rezervimeve për teatro, i lokalizuar për Shqipërinë (monedha ALL, qyteti Elbasan).

## Struktura

```
theatreSystem/
├── web-app/        # Next.js 16 — admin panel, agjentë shitjesh, booking publik
├── scanner-app/    # React Native / Expo 54 — skanim biletash me QR
└── database/       # Docker Compose — PostgreSQL 16
```

## Tech Stack

| Shtresa       | Teknologjia                          |
|---------------|--------------------------------------|
| Frontend      | Next.js 16, React 19, Tailwind CSS 4 |
| Backend/API   | Next.js Route Handlers               |
| Database      | PostgreSQL 16, Prisma 7              |
| Auth          | JWT + Cookie (jose, bcryptjs)        |
| Mobile        | Expo 54, React Native 0.81           |
| Infra         | Docker Compose                       |

## Modelet e të dhënave

- **User** — admin, staff, customer (role-based access)
- **Venue** — salla teatrale me zona vendesh (SeatingZone → Seat)
- **Show** — shfaqje me data, çmime për zonë (ShowPrice)
- **Ticket** — biletë me status (RESERVED → PAID → USED), QR code unik

## Instalimi

### 1. Database

```bash
cd database
docker compose up -d
```

### 2. Web App

```bash
cd web-app
npm install
```

Krijo `.env` me:
```
DATABASE_URL="postgresql://admin:password123@localhost:5432/theatre_db"
JWT_SECRET="nje-sekret-i-forte"
SCANNER_API_KEY="nje-celes-api"
```

Migro dhe mbill databazën:
```bash
npx prisma migrate deploy
npx prisma db seed
```

Nise serverin:
```bash
npm run dev -- --webpack
```

### 3. Scanner App (mobile)

```bash
cd scanner-app
npm install
npm start
```

## Rolet

| Rol      | Akses                                                    |
|----------|----------------------------------------------------------|
| ADMIN    | `/admin` — menaxhon salla, shfaqje, çmime, agjentë      |
| STAFF    | `/agent` — shet bileta, printon QR                       |
| CUSTOMER | Faqja publike — shikon shfaqje                           |

## License

Private
