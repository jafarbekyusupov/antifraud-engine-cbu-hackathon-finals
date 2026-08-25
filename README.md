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

When replay completes, it automatically writes `natija/fraud_signallari.csv` with `tx_id,risk_ball,sabab`. Only `BLOCK` decisions are included. `POST /api/v1/admin/exports/fraud-signals` regenerates the file without replaying and returns the same CSV as a download. For a hidden dataset, replace the four CSVs and use a clean PostgreSQL database/volume so overlapping source IDs cannot mix runs.

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
- `POST /api/v1/admin/exports/fraud-signals` — save and download submission CSV

Customer routes temporarily use `x-authenticated-client-id` as trusted-gateway identity. Live
scoring automatically creates a challenge for `STEP_UP`. Replay creates challenges only when
`CREATE_REPLAY_CHALLENGES=true`; this is intended for UI demonstrations, not normal historical
processing. Labels are read only by the admin evaluation module and never by the runtime risk
engine.

## Populate challenges during replay for a UI demo

On the demo server, set:

```dotenv
CREATE_REPLAY_CHALLENGES=true
SECURITY_CHALLENGE_TTL_SECONDS=0
```

`SECURITY_CHALLENGE_TTL_SECONDS=0` disables expiration by storing a PostgreSQL-compatible
far-future date. Then rebuild/restart the app and start replay normally. Rerunning replay also
backfills challenges for existing `STEP_UP` decisions, so the database does not need to be
cleared:

```bash
docker compose -f compose.vps.yaml up -d --build
curl -X POST http://127.0.0.1:3000/api/v1/admin/replay-jobs
```

Leave `CREATE_REPLAY_CHALLENGES=false` and use a positive TTL such as `300` outside demo mode.

## Demo a live customer challenge

After importing/replaying the dataset, create a real `STEP_UP` flow through the synchronous
scoring API:

```bash
bash ./scripts/demo-step-up.sh http://localhost:3000
```

The script requires `curl` and `python3`. The API URL is its optional first argument. Its defaults
can be overridden with `CLIENT_ID`, `CARD_ID`, `CITY`, `LATITUDE`, and `LONGITUDE` environment
variables so a customer confirmation can pass the device-location check at the pitch venue.

The script submits three small successful ECOM transactions for client `C00426` and card
`K000643` at three merchants. The card-testing rule makes the third transaction `STEP_UP`, and
the live scoring repository creates a five-minute customer challenge. Open or refresh the
customer UI as `C00426`, or verify the API directly:

```bash
curl -H "x-authenticated-client-id: C00426" \
  http://localhost:3000/api/v1/customer/security-challenges
```

Run the script immediately before the demo. If it no longer produces `STEP_UP`, restart only the
backend application to clear its recent in-memory card window, then run it again. Do not restart
or remove PostgreSQL: the imported reference data and previously created challenge records must
remain available.

## Documentation

- [Algorithm and architecture decisions](DECISIONS.md)
- [Database schema](DATABASE.md)

## Verify

```bash
pnpm test
pnpm build
```

The included replay contains 58,863 transactions. `GET /api/v1/admin/evaluation` returns precision, recall, F1, confusion counts, samples, and per-pattern recall.
