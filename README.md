# Crypto-trading-sim

A full-stack cryptocurrency trading simulator with a React frontend and a Spring Boot backend.

This project is designed for simulated trading, wallet management, and market visualization using public market data (with fallback simulation mode).

## Repository structure

- `frontend/` React + Vite client application
- `backend/` Spring Boot API service

## Tech stack

- Frontend: React 19, React Router 7, Vite 7
- Backend: Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA
- Database: MySQL

## Prerequisites

- Node.js 18+
- npm 9+
- Java 21
- Maven 3.9+ (or use backend Maven wrapper)
- MySQL instance

## Quick start

### 1) Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with real values:

- `MYSQL_URL`
- `MYSQL_USERNAME`
- `MYSQL_PASSWORD`

Run backend:

```bash
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`.

### 2) Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

Default API target is `http://localhost:8080` via `VITE_API_BASE_URL`.

## Running both services

Use two terminals:

Terminal A:

```bash
cd backend
./mvnw spring-boot:run
```

Terminal B:

```bash
cd frontend
npm install
npm run dev
```

## Environment configuration

### Backend (`backend/.env`)

Required:

- `MYSQL_URL`
- `MYSQL_USERNAME`
- `MYSQL_PASSWORD`

Optional:

- `AUTH_TOKEN_TTL_HOURS`
- `AUTH_ROLLING_REFRESH_MINUTES`
- `MARKET_PROVIDER` (`binance` or `simulated`)
- `BINANCE_BASE_URL`
- `MARKET_REQUEST_TIMEOUT_MS`

### Frontend (`frontend/.env`)

- `VITE_API_BASE_URL=http://localhost:8080`

## Build

### Backend

```bash
cd backend
./mvnw clean package
```

### Frontend

```bash
cd frontend
npm run build
```

## Docker (backend)

Build image:

```bash
cd backend
docker build -t crypto-trading-sim-backend .
```

Run container:

```bash
docker run --rm -p 8080:8080 --env-file .env crypto-trading-sim-backend
```

## Core API endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/demo`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

Wallet (authenticated):

- `GET /api/wallet/me`
- `POST /api/wallet/me/trade`
- `POST /api/wallet/me/deposit`
- `POST /api/wallet/me/withdraw`
- `POST /api/wallet/me/reset`

Market:

- `GET /api/market/{pair}?timeframe=...`

## Security notes

- Keep secrets in env files or runtime environment variables only.
- Never commit real credentials.
- Rotate credentials immediately if exposed.

## Additional docs

- Frontend details: `frontend/README.md`
- Backend details: `backend/README.md`
