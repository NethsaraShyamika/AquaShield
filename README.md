# AquaShield (Full‑Stack)

Group academic project to monitor illegal fishing activities, manage protected marine species, and streamline case handling.

## Tech Stack

- **Backend**: Node.js + Express (REST API), MongoDB (Mongoose), JWT + Session, Multer uploads, Nodemailer, third‑party APIs (GBIF + Geocoding)
- **Frontend**: React (Vite), React Router, Axios, Tailwind CSS
- **Deployment**: Backend on Render, Frontend on Vercel

## Repository Structure

- `AquaShield/backend`: Express REST API
- `AquaShield/frontend`: React app (Vite)

## Setup Instructions (Local)

### Prerequisites

- Node.js 18+ (recommended)
- MongoDB Atlas connection string (or local MongoDB)

### 1) Backend

```bash
cd AquaShield/backend
npm install
```

Create `AquaShield/backend/.env`:

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
MONGO_URI_TEST=your_mongodb_test_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
CLIENT_ORIGIN=http://localhost:5173

# email (Nodemailer)
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_app_password

# (if used) Cloudinary uploads
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# geocoding API key (OpenCage)
OPENCAGE_API_KEY=...
```

Run:

```bash
npm run dev
```

Backend base URL (local): `http://localhost:5000`

### 2) Frontend

```bash
cd AquaShield/frontend
npm install
```

Create `AquaShield/frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

Run:

```bash
npm run dev
```

Frontend URL (local): `http://localhost:5173`

## API Endpoint Documentation (REST)

Base URL: `/api`

### Auth / Users (`/api/users`)

- **POST** `/` — register user
- **POST** `/login` — login (returns JWT, creates session)
- **POST** `/logout` — logout (requires auth)
- **PUT** `/me` — update own profile (requires auth; supports `multipart/form-data` with `image`)
- **DELETE** `/me` — delete own account (requires auth)
- **POST** `/forgot-password` — request OTP
- **POST** `/reset-password` — reset password with OTP
- **GET** `/` — list all users (**admin only**)
- **GET** `/search?query=...` — search users (**admin only**)
- **PUT** `/block/:id` — block user (**admin only**, uses `uid`)
- **PUT** `/unblock/:id` — unblock user (**admin only**, uses `uid`)

### Species (`/api/species`)

- **GET** `/` — list species
- **GET** `/:id` — get species by `id`
- **POST** `/` — create species (**admin only**)
- **PUT** `/:id` — update species (**admin only**)
- **DELETE** `/:id` — delete species (**admin only**)
- **GET** `/find?...` — filter by `bodyShape`, `tailShape`, `finType`, `colorPattern`

#### Third‑Party API (GBIF)

- **GET** `/gbif/search?q=...` — search GBIF taxa
- **GET** `/gbif/:gbifKey` — GBIF enriched info (details/media/occurrences)
- **GET** `/:id/enrich` — merges local species + GBIF enrichment

### Reports (`/api/reports`)

User endpoints:

- **POST** `/` — create report (requires auth; `multipart/form-data` `evidence[]`)
- **GET** `/my` — list my reports (requires auth)
- **GET** `/my/:id` — get my report by id (requires auth)
- **PUT** `/my/:id` — update my pending report (requires auth)
- **DELETE** `/my/:id` — delete my pending report (requires auth)

Admin endpoints:

- **GET** `/` — list all reports (requires auth + admin; supports `status`, `page`, `limit`)
- **GET** `/:id` — get report by id (requires auth + admin)
- **PATCH** `/:id/status` — update report status (requires auth + admin)

### Cases (`/api/cases`) (Protected)

All case routes require authentication.

- **POST** `/` — create case (**admin only**)
- **GET** `/` — list all cases (**admin only**)
- **GET** `/:id` — get case (admin OR report owner)
- **PUT** `/:id` — update case (**admin only**)
- **DELETE** `/:id` — delete case (**admin only**)

## Validation & Error Handling

- **Input validation**: `express-validator` (users)
- **HTTP status codes**: 200/201/400/401/403/404/500 used across controllers

## Deployment (as required)

### Backend Deployment (Render)

- **Platform**: Render (Web Service)
- **Root directory**: `AquaShield/backend`
- **Build command**: `npm install`
- **Start command**: `npm start`

Set these environment variables in Render (do not commit secrets):

- **`MONGO_URI`**
- **`JWT_SECRET`**
- **`SESSION_SECRET`**
- **`CLIENT_ORIGIN`**: your Vercel URL, e.g. `https://your-app.vercel.app`
- **`NODE_ENV`**: `production`
- **Email / other keys**: `EMAIL_USER`, `EMAIL_PASS`, (optional) `CLOUDINARY_*`, (optional) `OPENCAGE_API_KEY`

After deploy, verify:

- `GET /` returns `{ "message": "AquaShield backend is running." }`

Live backend URL:

- **Backend API**: `https://<your-render-service>.onrender.com`

### Frontend Deployment (Vercel)

- **Platform**: Vercel
- **Root directory**: `AquaShield/frontend`

Set environment variables in Vercel:

- **`VITE_API_BASE_URL`**: your Render backend URL (e.g. `https://<your-render-service>.onrender.com`)

Build/Output:

- **Build command**: `npm run build`
- **Output**: `dist`

Live frontend URL:

- **Frontend App**: `https://<your-vercel-project>.vercel.app`

### Deployment Evidence (add before submission)

- **Screenshots**: Render service “Live”, Vercel deployment “Ready”, and working app screenshots
- **URLs**: paste the two live URLs above

## Testing Instructions (as required)

> Frontend automated tests are not included in this repository at the moment.

### Unit Testing

#### Backend (Jest)

Unit tests live in `AquaShield/backend/tests/`.

```bash
cd AquaShield/backend
npm test
```

Covered examples:

- `tests/utils.test.js` (utility function test)
- `tests/utils/calculateStatus.test.js` (utility function test)

### Integration Testing

#### Backend API (Supertest + MongoDB)

Integration tests run against a **test database**. Ensure `MONGO_URI_TEST` is set in `AquaShield/backend/.env` (never commit real credentials).

```bash
cd AquaShield/backend
npm test
```

Covered examples:

- `tests/report.test.js` (API test via Supertest)

> Note: `tests/report.test.js` imports `../app.js`. Ensure your backend exposes an Express `app` instance at `AquaShield/backend/app.js` (recommended) so tests can run without binding a port.

### Performance Testing

Not yet added in this repository. Suggested tool: Artillery.io.

## API Documentation (Swagger/Postman)

### Postman

- **Collection**: `AquaShield/docs/postman/AquaShield.postman_collection.json`
- Set `baseUrl` to your local/Render URL and login once to auto-store `token` (collection variable).

### Swagger

Not yet added in this repository.

