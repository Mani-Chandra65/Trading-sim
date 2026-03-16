# Frontend

This is the React + Vite frontend for the crypto-trading-sim.

## Stack

- React 19
- React Router 7
- Vite 7

## Requirements

- Node.js 18+
- npm 9+
- Backend API running on `http://localhost:8080` (or set a custom API URL)

## Environment

Create a local env file:

```bash
cp .env.example .env
```

Example `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

If `VITE_API_BASE_URL` is not provided, the app defaults to `http://localhost:8080`.

## Run locally

```bash
npm install
npm run dev
```

Default dev URL: `http://localhost:5173`

## Build

```bash
npm run build
npm run preview
```

## Notes

- Authentication uses bearer token headers from local storage.
- On `401` responses, local session data is cleared automatically.
- The dashboard supports real market mode (Binance API) and simulated fallback, depending on backend configuration.
