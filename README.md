# Resolv

SaaS de ticketing IT multi-tenant.

## Prérequis

- Node.js >= 20
- Docker & Docker Compose
- npm >= 10

## Installation

```bash
# Cloner et installer les dépendances
npm install

# Démarrer PostgreSQL
docker compose up -d

# Configurer les variables d'environnement
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Générer le client Prisma et appliquer les migrations
npm run db:generate
npm run db:migrate
```

## Développement

```bash
# Lancer tous les services en mode dev
npm run dev

# Ou lancer individuellement
npm run dev --workspace=@resolv/api
npm run dev --workspace=@resolv/web
```

## Services

| Service | URL |
|---------|-----|
| API (NestJS) | http://localhost:3001 |
| Web (Next.js) | http://localhost:3000 |
| pgAdmin | http://localhost:5050 |

## Structure

```
resolv/
├── apps/
│   ├── api/          # Backend NestJS
│   └── web/          # Frontend Next.js
├── packages/
│   └── shared/       # Types et constantes partagés
└── docker-compose.yml
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance API + Web en dev |
| `npm run build` | Build tous les packages |
| `npm run lint` | Lint tous les packages |
| `npm run format` | Formate le code |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:studio` | Ouvre Prisma Studio |
