# Technical Decisions

## Architecture

The modular monolith uses DDD-style boundaries: `domain` contains pure rules/value objects, `application` contains use cases and ports, `infrastructure` contains Drizzle/CSV/state adapters, `database` contains schemas/migrations, and `modules` contains NestJS HTTP orchestration. Fastify and bounded in-memory scoring comfortably target the required 200 ms while keeping delivery fast.

## Mandatory algorithm 1: sliding-window velocity

The state store retains recent transactions per card. The rule counts attempts in the inclusive ten-minute window and signals at five or more, increasing severity for declines and merchant diversity. It suppresses five to eight small payments at one merchant because the brief identifies split bills as legitimate noise.

- Time: `O(w)` per transaction for bounded window size `w`.
- Space: `O(c × w)` for active cards.
- Pattern: Strategy (`RiskRule`) plus rolling-window state.
- Edge cases: exact boundary included; current event counted once; future events excluded; same-merchant small split bills suppressed.

## Mandatory algorithm 2: Haversine impossible travel

The engine compares the current physical transaction with the client's previous physical transaction. Haversine gives great-circle distance; distance divided by elapsed time signals travel of at least 100 km requiring at least 500 km/h. ECOM does not establish physical presence.

- Time and extra space: `O(1)` per transaction/client.
- Pattern: Strategy (`RiskRule`).
- Edge cases: invalid coordinates rejected; nearby locations and non-positive time differences ignored; ECOM excluded; extreme speeds receive higher scores.

## Risk aggregation

Each rule returns a code, score, explanation, and evidence. Final risk is the strongest signal plus 40% of secondary signals, capped at 100: `0–39 APPROVE`, `40–69 STEP_UP`, `70–100 BLOCK`. The rule version is persisted for reproducible audit/rescoring.

## Ordering and baseline

CSV rows are streamed in batches of 500. Transactions are replayed by keyset pagination ordered by `(occurred_at, id)` and scored sequentially. State updates only after scoring so an event cannot contaminate its own baseline.

Successful replay automatically regenerates `natija/fraud_signallari.csv`; the job is marked complete only after that export succeeds. The separate export endpoint supports deterministic regeneration without replay.

## Persistence, audit, and idempotency

Transactions, decisions, alerts, cases, and events are separate. PostgreSQL rejects decision updates/deletes with an append-only trigger. Decisions are unique by `(transaction_id, rule_version)`, alerts by decision, and challenge responses by challenge/idempotency key.

## Evaluation safety

`_javob_kaliti/fraud_labels.csv` is used only by the admin evaluation adapter. It is never available to replay or live scoring. Evaluation reports precision, recall, F1, confusion counts, and per-pattern recall.

## Known limitations

- In-memory rolling baselines require replay after restart.
- Replay jobs are in-process rather than durable-queue jobs.
- Trusted client header is temporary; real auth/RBAC is deferred.
- Push/callback delivery for step-up is deferred.
- Sample F1 still needs threshold/rule tuning.
