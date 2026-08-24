.PHONY: install run dev stop logs test lint clean

install:
	pnpm install --frozen-lockfile

run:
	docker compose up --build

dev:
	docker compose up -d postgres
	pnpm run dev

stop:
	docker compose down

logs:
	docker compose logs -f app

test:
	pnpm test

lint:
	pnpm run lint

clean:
	docker compose down --volumes
