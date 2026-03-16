# Backend

This is the Spring Boot backend for the crypto-trading-sim.

## Stack

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- MySQL

## Requirements

- Java 21
- Maven 3.9+ (or use `./mvnw`)
- MySQL instance reachable from this service

## Environment

Create local environment config:

```bash
cp .env.example .env
```

Required values in `.env`:

- `MYSQL_URL`
- `MYSQL_USERNAME`
- `MYSQL_PASSWORD`

Security note:

- Keep real credentials only in `.env` or runtime environment variables.
- Do not commit `.env` or any secret values to version control.
- If any credential was shared by mistake, rotate it immediately.

Optional values:

- `AUTH_TOKEN_TTL_HOURS`
- `AUTH_ROLLING_REFRESH_MINUTES`
- `MARKET_PROVIDER` (`binance` or `simulated`)
- `BINANCE_BASE_URL`
- `MARKET_REQUEST_TIMEOUT_MS`

`application.properties` loads `.env` automatically using:
`spring.config.import=optional:file:.env[.properties]`

## Run locally

```bash
./mvnw spring-boot:run
```

App URL: `http://localhost:8080`

## Build and test

```bash
./mvnw test
./mvnw package
```

## Docker

Build image:

```bash
docker build -t crypto-trading-sim-backend .
```

Run container with env file:

```bash
docker run --rm -p 8080:8080 --env-file .env crypto-trading-sim-backend
```

## API overview

Main auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/demo`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Main wallet endpoints (authenticated):

- `GET /api/wallet/me`
- `POST /api/wallet/me/trade`
- `POST /api/wallet/me/deposit`
- `POST /api/wallet/me/withdraw`
- `POST /api/wallet/me/reset`

Market endpoint:

- `GET /api/market/{pair}?timeframe=...`

Use `Authorization: Bearer <token>` for protected endpoints.
