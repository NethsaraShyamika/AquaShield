# AquaShield — Full-Stack Application

**Module:** SE3040 – Application Frameworks (Year 3, 2026)  
**Programme:** BSc (Hons) in Information Technology — Software Engineering  

AquaShield is a group project for **illegal fishing monitoring**, **protected marine species management**, and **incident report/case handling**. It consists of a **Secure RESTful API Backend** built with Express.js (Node.js) and MongoDB, and a **React Frontend Application** styled with Tailwind CSS.

---

## 1. Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **MongoDB Atlas** (or local MongoDB) connection string
- Accounts for third-party integrations: Cloudinary (image uploads), OpenCage (geocoding), Nodemailer (email)

### Step-by-Step Guide

#### A. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd AquaShield/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   MONGO_URI_TEST=your_mongodb_test_connection_string
   JWT_SECRET=your_jwt_secret
   SESSION_SECRET=your_session_secret
   CLIENT_ORIGINS=http://localhost:5173

   # Nodemailer (Gmail example)
   EMAIL_USER=your_email_address
   EMAIL_PASS=your_app_password

   # Cloudinary (report evidence uploads)
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...

   # OpenCage (reverse geocoding)
   OPENCAGE_API_KEY=...
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will be running at `http://localhost:5000`.*

#### B. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd AquaShield/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend will be running at `http://localhost:5173`.*

---

## 2. API Endpoint Documentation

**Base API URL:** `/api`  
**Authentication:** Protected routes require a JWT token passed in the header: `Authorization: Bearer <token>`

### User Management (`/api/users`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/users/` | No | Register a new user |
| POST | `/api/users/login` | No | Authenticate user & get JWT |
| GET | `/api/users/me` | Yes | Get the logged-in user profile |
| GET | `/api/users/` | Yes (Admin) | List all registered users |

**Example: User Registration (POST `/api/users`)**
*Request Body:*
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```
*Response (201 Created):*
```json
{
  "message": "User registered successfully",
  "user": { "id": "123", "email": "john@example.com", "role": "user" }
}
```

**Example: User Login (POST `/api/users/login`)**
*Request Body:*
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```
*Response (200 OK):*
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Species Management (`/api/species`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/species/` | No | List all marine species |
| POST | `/api/species/` | Yes (Admin) | Add a new species |
| PUT | `/api/species/:id` | Yes (Admin) | Update species details |
| DELETE | `/api/species/:id` | Yes (Admin) | Delete a species |

**Example: Add Species (POST `/api/species`)**
*Request Body:*
```json
{
  "name": "Blue Whale",
  "scientificName": "Balaenoptera musculus",
  "protectionStatus": "Endangered"
}
```
*Response (201 Created):*
```json
{
  "message": "Species created successfully",
  "data": { "id": "456", "name": "Blue Whale" }
}
```

### Report Management (`/api/reports`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/reports/` | Yes | Submit an incident report |
| GET | `/api/reports/my` | Yes | View user's own reports |
| GET | `/api/reports/` | Yes (Admin) | List all incident reports |
| PATCH | `/api/reports/:id/status` | Yes (Admin) | Update report status |

**Example: Submit Report (POST `/api/reports`)**
*(Uses `multipart/form-data` for image uploads)*
*Request Fields:*
- `incidentType`: "Illegal Fishing"
- `description`: "Spotted an unmarked vessel using trawling nets."
- `evidence`: (File upload)

*Response (201 Created):*
```json
{
  "message": "Report submitted successfully",
  "reportId": "789"
}
```

### Case Management (`/api/cases`)
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/cases/` | Yes (Admin) | Create a case from a report |
| GET | `/api/cases/` | Yes (Admin) | List all administrative cases |

---

## 3. Deployment Report

### Live URLs
- **Deployed Backend API:** [https://aquashield-fmy9.onrender.com](https://aquashield-fmy9.onrender.com)
- **Deployed Frontend Application:** [https://aqua-shield-five.vercel.app](https://aqua-shield-five.vercel.app)

### Screenshots / Evidence
*[Students to insert screenshots here showing successful Vercel and Render deployments, live UI, and API testing over the live URL]*

### Backend Deployment (Render)
1. Created a new **Web Service** on [Render](https://render.com).
2. Connected the GitHub repository and set the **root directory** to `backend`.
3. Configured the build settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start` (Mapped to `node index.js`)
4. Configured Environment Variables in Render Dashboard (see below).

### Frontend Deployment (Vercel)
1. Imported the project repository into [Vercel](https://vercel.com).
2. Set the **Framework Preset** to `Vite` and **root directory** to `frontend`.
3. Configured the build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Configured Environment Variables (see below).

### Environment Variables Used (Without Exposing Secrets)
**Backend (Render) Variables:**
- `PORT` (Provided by Render)
- `MONGO_URI` (MongoDB connection URI)
- `JWT_SECRET` (Secret key for token signing)
- `SESSION_SECRET` (Secret key for session management)
- `CLIENT_ORIGINS` = `https://aqua-shield-five.vercel.app` (CORS whitelisting)
- `CLOUDINARY_*` / `EMAIL_*` / `OPENCAGE_*` (Third-party integrations)

**Frontend (Vercel) Variables:**
- `VITE_API_BASE_URL` = `https://aquashield-fmy9.onrender.com/api`

---

## 4. Testing Instruction Report

### I. How to run Unit Tests
Unit tests validate the behavior of individual components and utility functions in isolation.
1. Navigate to the backend directory:
   ```bash
   cd AquaShield/backend
   ```
2. Run the Jest testing suite:
   ```bash
   npm test
   ```
*(Tests are located in the `backend/tests/` directory and include evaluations for utils, error handling, etc.)*

### II. Integration Testing Setup and Execution
Integration testing evaluates how different parts of the backend (Controllers, Routes, MongoDB) work together seamlessly.
1. **Setup:** Ensure you have a **secondary testing database**. In `backend/.env`, set the `MONGO_URI_TEST` variable to point to your test database.
2. **Execution:** The `npm test` command automatically executes integration tests alongside unit tests (`Supertest` is used to trigger API endpoints without starting the server on a port).
3. **What is tested:** API endpoints are evaluated for correct request handling, database updates, standard HTTP responses (e.g. 200 vs 404), and error scenarios.

### III. Performance Testing Setup and Execution
Performance testing ensures the backend can handle multiple concurrent requests without significant latency.
1. **Setup:** Install Artillery globally on your system:
   ```bash
   npm install -g artillery
   ```
2. **Execution:** Navigate to the `docs/artillery` folder and run the predefined test profile against your local or live API:
   ```bash
   artillery run probe.yml
   ```
3. Report statistics (Response metrics, latency, concurrent user handling) will be generated in the terminal.

### IV. Testing Environment Configuration Details
- **Test Runner:** Jest configured in `backend/jest.config.js`.
- **Database:** Dedicated Test DB (`MONGO_URI_TEST`) to prevent polluting real application data during integration tests.
- **Environment:** The test environment skips certain logging actions to keep test outputs clean (`NODE_ENV=test`).

---

## Classification
Classification: **Public-SLIIT**
