# CBU Anti-Fraud Engine - cbu-fraud-engine.vercel.app

Real-time, explainable card-transaction fraud scoring for the CBU Coding Hackathon 2026. The service accepts live transactions, produces a 0–100 risk score, replays CSV datasets chronologically, exposes analyst/customer APIs, and generates the required submission file.

## Stack

- TypeScript, Node.js 22, NestJS 11, Fastify
- PostgreSQL 17 and Drizzle ORM
- Zod validation and Docker Compose

## Run

Place `clients.csv`, `cards.csv`, `merchants.csv`, and `transactions.csv` in `data/`, then run:

```bash
docker compose up --build
```

The image starts as root only long enough to make the bind-mounted `natija/` directory writable, then drops to the unprivileged `node` user before starting NestJS.

Or locally:

```bash
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm build
pnpm start
```

- Swagger: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/openapi.json`
- Health: `http://localhost:3000/health`

Migrations run automatically during startup.

## Replay and required result

```bash
curl -X POST http://localhost:3000/api/v1/admin/replay-jobs
curl http://localhost:3000/api/v1/admin/replay-jobs/{jobId}
```

When replay completes, it automatically writes `natija/fraud_signallari.csv` with `tx_id,risk_ball,sabab`. Only `BLOCK` decisions are included. `POST /api/v1/admin/exports/fraud-signals` can regenerate the same file without replaying. For a hidden dataset, replace the four CSVs and use a clean PostgreSQL database/volume so overlapping source IDs cannot mix runs.

## Important APIs

- `POST /api/v1/internal/transactions` — synchronous scoring
- `GET /api/v1/operator/transactions` — filterable transactions
- `GET /api/v1/operator/alerts` — analyst alert queue
- `GET /api/v1/operator/metrics/summary` — dashboard and latency metrics
- `GET /api/v1/customer/cards` — authenticated customer's cards
- `GET /api/v1/customer/transactions` — authenticated customer's transactions
- `GET /api/v1/customer/security-challenges` — step-up requests
- `POST /api/v1/customer/security-challenges/:id/responses` — confirm/deny
- `GET /api/v1/admin/evaluation` — offline sample-key evaluation
- `POST /api/v1/admin/exports/fraud-signals` — submission CSV

Customer routes temporarily use `x-authenticated-client-id` as trusted-gateway identity. A challenge is created automatically only when live scoring returns `STEP_UP`; replay does not create customer prompts. Labels are read only by the admin evaluation module and never by the runtime risk engine.

## Documentation

- [Algorithm and architecture decisions](DECISIONS.md)
- [Database schema](DATABASE.md)

## Verify

```bash
pnpm test
pnpm build
```

The included replay contains 58,863 transactions. `GET /api/v1/admin/evaluation` returns precision, recall, F1, confusion counts, samples, and per-pattern recall.
