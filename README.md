# CBU Anti-Fraud Engine

NestJS/Fastify and PostgreSQL backend for real-time explainable transaction scoring, analyst alert
investigation, and customer mobile verification.

## Local API

```bash
pnpm install --frozen-lockfile
docker compose up -d postgres
pnpm build
pnpm start
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/openapi.json`
- Health: `http://localhost:3000/health`

Database migrations run automatically on application startup.

## Client integration

- Web fraud-analyst clients use `/api/v1/operator/*`.
- Mobile customer clients use `/api/v1/customer/security-challenges/*`.
- Payment infrastructure uses `/api/v1/internal/transactions`.
- Demo/judge controls use `/api/v1/admin/replay-jobs`.

The complete contracts, examples, UI mapping, and secret-dataset flow are in
[docs/API.md](docs/API.md).

For local mobile wiring, `x-authenticated-client-id` represents identity already verified by a
trusted gateway. This is **not a production authentication mechanism** and the API must not be publicly
exposed with arbitrary callers allowed to set it.
