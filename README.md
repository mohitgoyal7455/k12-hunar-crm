# K12 Hunar — EdTech CRM & Inquiry System

Hi! This project is a small inquiry-management system for an education organisation. Parents, students and schools can send an enquiry through a public form. Staff can then sign in to a private dashboard, review each enquiry and keep its status up to date.

The project is split into a React frontend, an Express API and a PostgreSQL database hosted on Supabase.

## Project links

Add your real links here once deployment is complete. I have left these as clear placeholders rather than guessing URLs.

| Resource | Link |
|---|---|
| Live application (Vercel) | `ADD_YOUR_VERCEL_URL` |
| Backend API (Render) | `ADD_YOUR_RENDER_API_URL` |
| API health check | `ADD_YOUR_RENDER_API_URL/api/health` |
| GitHub repository | `ADD_YOUR_GITHUB_REPOSITORY_URL` |

**Deployment note:** The repository includes configuration for Vercel and Render, but the presence of those files does not mean the services have already been deployed. Replace every placeholder above after deployment and test the live links before submitting the assessment.

## What the application can do

### For parents, students and schools

- Submit an enquiry by choosing a user type and a category: scholarship, concert, admission or general query.
- Enter contact details and a message. The form gives immediate feedback when something needs fixing.
- Use common Indian mobile number formats. The server cleans the number and stores it as ten digits.
- Receive a reference number after the enquiry has been saved.
- Benefit from basic bot protection through a hidden honeypot field and a limit of five submissions from one IP address in ten minutes.

### For staff and administrators

- Sign in through a private admin login. There is no public sign-up page.
- View enquiries in a dashboard and filter by category, user type or status.
- Search by a person's name or phone number, sort the results and move between pages.
- Open an enquiry to read its full message, update its status or delete it.
- See summary counts and download the currently filtered results as a CSV file.
- Use the dashboard on smaller screens; the enquiry list changes to a card layout on mobile.

The dashboard keeps its filters in the URL, so refreshing the page or using the browser's back button does not unexpectedly clear the current view.

## A few implementation details

- **Validation happens in three places.** The browser provides quick feedback, the API validates incoming requests again, and PostgreSQL constraints protect the stored data.
- **Passwords are not stored as plain text.** Admin passwords are hashed with bcrypt.
- **Protected API routes use JWTs.** The API checks the token signature and expiry, and also checks that the admin account still exists and is active. Disabling an account therefore revokes access without waiting for the token to expire.
- **SQL values are parameterised.** User input is passed as query parameters instead of being concatenated into SQL statements.
- **The CSV export handles spreadsheet formulas safely.** This helps prevent cells beginning with formula characters from being executed when the file is opened in spreadsheet software.
- **The API does not send password hashes or stack traces to the browser.** It also uses Helmet, a restricted CORS origin, request-size limits and rate limiting.

## Technology used

| Part | Technologies |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod |
| Backend | Node.js, Express, TypeScript, Zod, `pg`, bcryptjs, jsonwebtoken, Helmet, express-rate-limit |
| Database | Supabase PostgreSQL |
| Tests | Vitest and Supertest |
| Deployment configuration | Vercel for the frontend and Render for the API |

## Project layout

```text
k12-hunar-crm/
├── schema.sql             # Database tables, constraints, indexes and sample data
├── render.yaml            # Render service configuration
├── .nvmrc                 # Recommended Node.js version
├── client/                # React application
│   ├── .env.example
│   ├── vercel.json         # SPA routing for direct links and page refreshes
│   └── src/
└── server/                # Express API
    ├── .env.example
    ├── scripts/            # Database setup and admin creation helpers
    ├── tests/              # API and authentication tests
    └── src/                # Routes, middleware, services and database access
```

## Run it on your computer

### Before you start

Install Node.js `22.12.0` or newer and npm. You will also need a PostgreSQL database. The project is set up to work with Supabase, but a compatible PostgreSQL instance can be used for local development.

The `.nvmrc` file records the recommended Node version. If you use `nvm`, run:

```bash
nvm install
nvm use
```

### 1. Set up the database

Create a Supabase project, open its SQL Editor and run the contents of `schema.sql`.

The schema creates the `admins` and `inquiries` tables, adds validation constraints and indexes, and inserts one demo admin with sample enquiries. It is designed to be safe to run again.

You can also apply the schema from the server directory after configuring its environment:

```bash
cd server
npm run db:schema
```

### 2. Configure and start the API

From the project root:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and add your database connection string and a strong JWT secret. For Supabase, use the **Session pooler** connection string from the project's Connect panel. Keep this file private; it should never be committed to GitHub.

Then install dependencies and start the API:

```bash
npm install
npm run dev
```

The API starts at `http://localhost:4000` by default.

### 3. Configure and start the frontend

Open a second terminal from the project root:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

For local development, `VITE_API_URL` should be `http://localhost:4000/api`. Open `http://localhost:5173` to use the public form. The staff login is at `http://localhost:5173/admin/login`.

## Environment variables

### Server (`server/.env`)

| Variable | Required | What it is for |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. For Supabase deployments, use the Session pooler. |
| `JWT_SECRET` | Yes | A long, random secret used to sign tokens. Use at least 32 random characters. |
| `JWT_EXPIRES_IN` | No | Token lifetime. Defaults to `8h`. |
| `CLIENT_ORIGIN` | No | Allowed frontend origin(s), separated by commas. Set this to the exact deployed Vercel origin in production. |
| `DB_SSL` | No | Enables SSL for the database connection. Keep `true` for Supabase. |
| `PORT` | No | API port. Defaults to `4000`; Render supplies this automatically. |
| `NODE_ENV` | No | Use `production` for deployment. |

To generate a JWT secret, run:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Frontend (`client/.env`)

| Variable | Required | What it is for |
|---|---|---|
| `VITE_API_URL` | Yes | API base URL, including `/api`. Locally: `http://localhost:4000/api`. |

## Admin account

There is no public registration. The SQL schema creates a demo account for assessment purposes:

| Email | Password |
|---|---|
| `admin@k12hunar.com` | `Admin@123` |

This is a shared demo credential, not a password to use for a real organisation or real customer data. For a real deployment, create a new administrator with a unique password and deactivate the demo account. From the `server` directory, run:

```bash
npm run create-admin -- "Full Name" name@example.com "Use-A-Unique-Password"
```

Do not put real passwords, database credentials or JWT secrets in this repository.

## Run the checks

From the `server` directory:

```bash
npm ci
npm test
npm run typecheck
npm run build
```

The tests use a mocked database, so a running PostgreSQL instance is not needed for the automated test suite.

From the `client` directory, run:

```bash
npm ci
npm run build
```

The automated tests cover key areas such as login, token verification (including disabled accounts), inquiry validation, phone number normalisation, filtering and safe CSV generation. Run the commands above on your machine and check that they pass; this README does not claim a test result until you have run them.

## API overview

All API routes are prefixed with `/api`. Admin-only routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/health` | Public | Check API and database availability |
| `POST` | `/auth/login` | Public | Sign in and receive a JWT |
| `GET` | `/auth/me` | Admin | Get the signed-in admin's details |
| `POST` | `/inquiries` | Public | Submit a new enquiry |
| `GET` | `/inquiries` | Admin | List enquiries with filters, search, sorting and pagination |
| `GET` | `/inquiries/stats` | Admin | Get dashboard summary counts |
| `GET` | `/inquiries/export` | Admin | Download filtered enquiries as CSV |
| `GET` | `/inquiries/:id` | Admin | View one enquiry |
| `PATCH` | `/inquiries/:id/status` | Admin | Update an enquiry's status |
| `DELETE` | `/inquiries/:id` | Admin | Delete an enquiry |

Errors use a consistent response structure with an error code, a readable message and optional details.

## Deploy the application

The repository contains a Render Blueprint (`render.yaml`) and Vercel SPA routing configuration (`client/vercel.json`). You still need to connect your own accounts and supply the deployment environment variables.

### 1. Supabase database

1. Create a Supabase project.
2. Run `schema.sql` in the SQL Editor.
3. Copy the **Session pooler** connection string from the Connect panel. Replace its password placeholder with your database password.

### 2. Render API

You can create a Render web service from the Blueprint in this repository, or create a web service manually with `server` as its root directory.

For a manual service, use:

- Build command: `npm ci --include=dev && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`

Set these environment variables in Render's dashboard:

- `DATABASE_URL`: your Supabase Session pooler URL
- `JWT_SECRET`: a newly generated random secret
- `CLIENT_ORIGIN`: the exact Vercel site origin, without a trailing slash
- `NODE_ENV`: `production`
- `DB_SSL`: `true`

Do not paste secret values into `render.yaml` or commit them to Git.

### 3. Vercel frontend

Import the repository into Vercel and set the project root directory to `client`. Use the Vite framework preset and set this environment variable:

- `VITE_API_URL`: `https://YOUR-RENDER-SERVICE.onrender.com/api`

After the frontend is deployed, copy its exact origin into Render's `CLIENT_ORIGIN` setting and redeploy the API. Then test the public form and the admin dashboard on the live site.

## Before submitting the assessment

Use this short checklist to make sure the reviewer can open and test your work:

- [ ] The GitHub repository is accessible to the reviewer.
- [ ] `schema.sql`, both `.env.example` files and this README are included.
- [ ] The Vercel frontend URL opens successfully.
- [ ] The Render health endpoint reports that the database is connected.
- [ ] The frontend can submit an enquiry to the deployed API.
- [ ] Admin login, dashboard filters, status changes and CSV export work on the deployed app.
- [ ] Backend tests, typecheck and build pass; frontend build passes.
- [ ] The README's project links have been replaced with the real URLs.
- [ ] No `.env` files, credentials, secrets or real user data are committed.

**One last reminder:** this ZIP is the source code package. It cannot create deployments or publish a GitHub repository from your accounts. Add the real links after you complete those steps, then include them in your assessment email.
