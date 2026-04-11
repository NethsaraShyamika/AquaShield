# AquaShield — Full-Stack Application

**Module:** SE3040 – Application Frameworks (Year 3, 2026)  
**Programme:** BSc (Hons) in Information Technology — Software Engineering  

AquaShield is a group project for **illegal fishing monitoring**, **protected marine species management**, and **incident report / case handling**. It consists of an **Express.js REST API** (MongoDB) and a **React (Vite)** frontend styled with **Tailwind CSS**.

---

## How This Project Maps to the Assignment Specification

### Part 1 — Secure RESTful API (Express.js)

| Requirement | How AquaShield addresses it |
|-------------|----------------------------|
| **RESTful API** | Resources under `/api/users`, `/api/species`, `/api/reports`, `/api/cases` using standard HTTP verbs and status codes. |
| **≥ 4 components** | **User management**, **Species**, **Reports**, **Cases** — each with defined responsibilities and endpoints. |
| **CRUD + business logic** | Create/read/update/delete (where applicable) exposed via routes; controllers contain validation and rules (e.g. report status, admin-only actions). |
| **Third-party API** | **GBIF** (species search/enrichment), **OpenCage** (reverse geocoding for cases), **Nodemailer** (email), **Cloudinary** (evidence uploads). |
| **MongoDB** | **Mongoose** models and persistence for users, species, reports, cases. |
| **Protected routes & roles** | **JWT** (`Authorization: Bearer <token>`) and **express-session**; **admin** vs **user** enforced via middleware and controller checks. |
| **Validation & errors** | **express-validator** on user routes; consistent JSON error responses and HTTP codes (400, 401, 403, 404, 500, etc.). |
| **Clean structure** | Separation into `routes/`, `controllers/`, `models/`, `middlewares/`, `utils/`. |
| **API documentation** | **Postman** collection under `docs/postman/` (Swagger optional / not included). |

### Part 2 — React Frontend

| Requirement | How AquaShield addresses it |
|-------------|----------------------------|
| **Functional components & hooks** | Pages and components built with **function components** and **React Hooks** (`useState`, `useEffect`, `useCallback`, etc.). |
| **State management** | Primarily **local component state** and **React Router**; auth token/user data in **localStorage** where needed. *(Context API / Redux can be added for global state if you extend the project.)* |
| **API integration** | `fetch` / Axios-style usage against `/api/...` (dev proxy in Vite to backend). Admin/user flows: users, species CRUD, reports with **pagination/filter/search**, cases. |
| **UI/UX** | **Tailwind CSS** for layout, responsive admin dashboards and user pages. |
| **Session handling** | Backend **sessions** + **JWT**; frontend stores **JWT** after login and sends it on protected requests; CORS `credentials` where applicable. |
| **Deployment** | Backend intended for **Render**; frontend for **Vercel** (see [Deployment](#deployment-report)). |

---

## Functional Requirements by Component (≥ 4)

### 1. User management (`/api/users`)

- Register, login, logout; optional password reset via OTP email.
- Authenticated users: view/update own profile (`GET/PUT /me`), delete own account.
- Admins: list users, search users, block/unblock users.

### 2. Species catalogue (`/api/species`)

- Public read: list species, get by id, filter finder, GBIF search/enrichment endpoints.
- Admins: create, update, delete species records.

### 3. Incident reports (`/api/reports`)

- Users: submit reports (with optional evidence uploads), list/update/delete **own** reports (rules apply, e.g. only while **Pending**).
- Admins: list all reports with **pagination** and **status filter**, get any report by id, update **status** and **admin note**.

### 4. Cases (`/api/cases`)

- Admins: create case from a report, list all cases, update/delete cases; geocoded location name via third-party API.
- Users: view a case linked to **their** report (when permitted by backend logic).

---

## Repository Structure

```
AquaShield/
├── backend/          # Express API (Node.js)
├── frontend/         # React + Vite + Tailwind
├── docs/
│   └── postman/      # Postman collection
└── README.md         # This file
```

---

## Setup Instructions (Local)

### Prerequisites

- **Node.js** 18+ (recommended)
- **MongoDB Atlas** (or local MongoDB) connection string
- Optional: **Cloudinary**, **OpenCage**, **Gmail app password** for email — only if you use those features

### 1) Backend

```bash
cd AquaShield/backend
npm install
```

Create **`AquaShield/backend/.env`** (do **not** commit real secrets):

```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
MONGO_URI_TEST=your_mongodb_test_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
CLIENT_ORIGIN=http://localhost:5173

# Nodemailer (Gmail example)
EMAIL_USER=your_email_address
EMAIL_PASS=your_app_password

# Cloudinary (report evidence uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# OpenCage (reverse geocoding for cases)
OPENCAGE_API_KEY=...
```

Run:

```bash
npm run dev
```

- **Base URL (local):** `http://localhost:5000`
- **Health check:** `GET http://localhost:5000/` → `{ "message": "AquaShield backend is running." }`

### 2) Frontend

```bash
cd AquaShield/frontend
npm install
```

Create **`AquaShield/frontend/.env`** for production or explicit API host:

```bash
# Use full backend URL on Vercel; for local dev you can omit and rely on Vite proxy (see below)
VITE_API_BASE_URL=http://localhost:5000
```

Run:

```bash
npm run dev
```

- **App (local):** `http://localhost:5173`
- **Dev proxy:** `vite.config.js` proxies `/api` → `http://localhost:5000`, so relative `/api/...` calls work during development.

---

## Authentication

Most protected endpoints expect:

```http
Authorization: Bearer <JWT>
```

Login also establishes a **server session** (`express-session`). The frontend typically keeps the **JWT** in **localStorage** and attaches it to requests.

**Admin-only** routes additionally require `isAdmin: true` in the token payload (set when an admin user logs in).

---

## API Endpoint Documentation

**API base path:** `/api`  
Unless stated, request/response bodies are **JSON**.

### Users — `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users` | No | Register |
| POST | `/api/users/login` | No | Login → returns JWT + session |
| POST | `/api/users/logout` | Yes | Logout / destroy session |
| GET | `/api/users/me` | Yes | Current user profile |
| PUT | `/api/users/me` | Yes | Update profile (`multipart/form-data` optional field `image`) |
| DELETE | `/api/users/me` | Yes | Delete own account |
| POST | `/api/users/forgot-password` | No | Send OTP to email |
| POST | `/api/users/reset-password` | No | Reset password with OTP |
| GET | `/api/users` | Admin | List users |
| GET | `/api/users/search?query=...` | Admin | Search users |
| PUT | `/api/users/block/:id` | Admin | Block user (`id` = user `uid`) |
| PUT | `/api/users/unblock/:id` | Admin | Unblock user |
| GET | `/api/users/session-test` | No | Session debug (dev/demo) |

**Example — register**

```http
POST /api/users
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "firstName": "Ada",
  "lastName": "Lovelace",
  "password": "secret123"
}
```

**Example — login response (shape)**

```json
{
  "message": "Login successful",
  "token": "<jwt>"
}
```

**Validation errors (users):** `400` with `{ "errors": [ ... ] }` from `express-validator`.

---

### Species — `/api/species`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/species/gbif/search?q=...` | No | Search GBIF |
| GET | `/api/species/gbif/:gbifKey` | No | GBIF enriched payload |
| GET | `/api/species/find?...` | No | Filter (e.g. `bodyShape`, `tailShape`, `finType`, `colorPattern`) |
| GET | `/api/species` | No | List all |
| GET | `/api/species/:id` | No | Get by business `id` |
| GET | `/api/species/:id/enrich` | No | Local species + GBIF merge |
| POST | `/api/species` | Admin | Create |
| PUT | `/api/species/:id` | Admin | Update |
| DELETE | `/api/species/:id` | Admin | Delete |

**Example — create species (admin)**

```http
POST /api/species
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

```json
{
  "id": "species-001",
  "name": "Bluefin Tuna",
  "scientificName": "Thunnus thynnus",
  "protectionStatus": "Protected",
  "description": "..."
}
```

---

### Reports — `/api/reports`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/reports` | User | Create (`multipart/form-data`, optional `evidence` files) |
| GET | `/api/reports/my` | User | List my reports |
| GET | `/api/reports/my/:id` | User | Get my report |
| PUT | `/api/reports/my/:id` | User | Update my pending report |
| DELETE | `/api/reports/my/:id` | User | Delete my pending report |
| GET | `/api/reports` | Admin | List all — query: `status`, `page`, `limit` |
| GET | `/api/reports/:id` | Admin | Get any report |
| PATCH | `/api/reports/:id/status` | Admin | Update `status`, `adminNote` |

**Example — admin list (pagination + filter)**

```http
GET /api/reports?status=Pending&page=1&limit=10
Authorization: Bearer <admin_jwt>
```

**Example — admin status update**

```http
PATCH /api/reports/<reportId>/status
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

```json
{
  "status": "Under Review",
  "adminNote": "Assigned to field officer."
}
```

**Example — create report (multipart fields)**

- Text fields: `incidentType`, `description`, `latitude`, `longitude`, `incidentDate`, `speciesInvolved` (JSON string or array as implemented)
- Files: `evidence` (multiple, up to limit configured in backend)

---

### Cases — `/api/cases`

All routes require **authentication**.

| Method | Path | Role | Description |
|--------|------|------|-------------|
| POST | `/api/cases` | Admin | Create case (links to `reportId` in body) |
| GET | `/api/cases` | Admin | List cases |
| GET | `/api/cases/:id` | Admin or owner | Get case |
| PUT | `/api/cases/:id` | Admin | Update |
| DELETE | `/api/cases/:id` | Admin | Delete |

---

## Validation & Error Handling (Summary)

- **Users:** `express-validator` chains + centralized `validate` middleware.
- **Other modules:** Mongoose validation, controller checks, and explicit status codes.
- Typical codes: **200/201** success, **400** bad input, **401** not authenticated, **403** forbidden, **404** not found, **500** server error.

---

## API Documentation (Postman)

| Tool | Location / status |
|------|-------------------|
| **Postman** | Import `AquaShield/docs/postman/AquaShield.postman_collection.json`. Set collection variable `baseUrl` to `http://localhost:5000` or your deployed API. Login request can store `token` for authenticated calls. ||

---

## Deployment Report

### Backend — Render

1. Create a **Web Service** on [Render](https://render.com).
2. Connect your Git repository; set **root directory** to `AquaShield/backend`.
3. **Build command:** `npm install`  
4. **Start command:** `npm start`
5. Add environment variables in the Render dashboard (see table below).
6. After deploy, open the service URL and confirm `GET /` returns the running message.

**Deployed backend API (fill in after deploy):**  
`https://<your-service>.onrender.com`

### Frontend — Vercel

1. Import the project on [Vercel](https://vercel.com).
2. Set **root directory** to `AquaShield/frontend`.
3. **Build command:** `npm run build`  
4. **Output directory:** `dist`
5. Set **`VITE_API_BASE_URL`** to your **full Render API origin** (e.g. `https://<your-service>.onrender.com`) so the browser can call the API in production (the Vite dev proxy is not used on Vercel).

**Deployed frontend (fill in after deploy):**  
`https://<your-project>.vercel.app`

### Environment Variables (no secrets in Git)

| Variable | Where used | Description |
|----------|------------|-------------|
| `MONGO_URI` | Render / local | Production MongoDB connection |
| `JWT_SECRET` | Render / local | JWT signing secret |
| `SESSION_SECRET` | Render / local | Express session secret |
| `CLIENT_ORIGIN` | Render | Allowed CORS origin (your Vercel URL) |
| `NODE_ENV` | Render | Set to `production` |
| `EMAIL_USER`, `EMAIL_PASS` | Render / local | Nodemailer |
| `CLOUDINARY_*` | Render / local | Evidence uploads |
| `OPENCAGE_API_KEY` | Render / local | Reverse geocoding |
| `VITE_API_BASE_URL` | Vercel | Public API base URL for the React app |

### Deployment Evidence (for submission)

- Screenshot: Render service **Live** and environment variables screen (blur secrets).
- Screenshot: Vercel deployment **Ready** and domain settings.
- Screenshot: browser showing **live frontend** calling **live API** (e.g. login or list species).
- Paste **both live URLs** in this README before submission.

---

## Testing Instruction Report

### 1) Unit testing (backend)

- **Runner:** Jest (`AquaShield/backend`)
- **Command:**

```bash
cd AquaShield/backend
npm test
```

- **Examples:** `tests/utils.test.js`, `tests/utils/calculateStatus.test.js`

### 2) Integration testing (backend)

- **Tools:** Jest + Supertest + MongoDB (test DB)
- **Command:** same as above (`npm test` runs all tests).
- **Configuration:** set **`MONGO_URI_TEST`** in `backend/.env` to a **separate** database (never commit credentials).
- **Example file:** `tests/report.test.js` (hits HTTP layer).

**Note:** Integration tests expect an Express **`app`** export (e.g. `backend/app.js`) that mounts the same routes **without** calling `listen()`. If `app.js` is missing, add it and wire `index.js` to start the server using that app — otherwise Supertest cannot attach cleanly.

### 3) Performance testing (suggested — Artillery)

Not automated in-repo; typical approach:

1. Install Artillery: `npm install -g artillery`
2. Create a scenario file (e.g. `docs/artillery/probe.yml`) targeting your deployed or local base URL.
3. Example phases: warm-up, sustained load, spike.

Example **minimal** `artillery` flow (adjust URL and paths):

```yaml
config:
  target: "https://your-api.onrender.com"
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Health and public species"
    flow:
      - get:
          url: "/"
      - get:
          url: "/api/species"
```

Run: `artillery run docs/artillery/probe.yml`

### 4) Testing environment configuration

| Item | Detail |
|------|--------|
| Node version | Match local and CI (e.g. 18+) |
| `MONGO_URI_TEST` | Separate Atlas database or local Mongo for tests |
| Secrets | Never commit `.env`; use `.env.example` in repo if you add one |

---

## License / Classification

Course materials classification: **Public-SLIIT**. This README is written for coursework submission and demonstration purposes.
