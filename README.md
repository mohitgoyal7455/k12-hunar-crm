# K12 Hunar – EdTech CRM & Inquiry Management System

A full-stack EdTech CRM application designed to help educational institutions manage student and parent inquiries efficiently.

## 🚀 Live Demo

- **Frontend:** https://k12-hunar-crm-gamma.vercel.app
- **Backend API:** https://k12-hunar-crm-api-jlg1.onrender.com
- **API Health Check:** https://k12-hunar-crm-api-jlg1.onrender.com/api/health
- **GitHub Repository:** https://github.com/mohitgoyal7455/k12-hunar-crm

## 📌 Project Overview

K12 Hunar CRM is a web-based inquiry management system that allows parents or prospective students to submit inquiries through a public form. Administrators can securely log in to manage, track, search, filter, and update inquiries through a centralized dashboard.

The application provides a simple and organized workflow for handling educational inquiries.

## ✨ Key Features

### Public Inquiry Form
- Submit parent and student inquiries.
- Capture contact information and inquiry details.
- Select inquiry categories.
- Generate a unique inquiry reference ID.
- Validate form inputs.

### Admin Dashboard
- Secure admin authentication using JWT.
- View all submitted inquiries.
- Dashboard statistics and inquiry summaries.
- Search inquiries.
- Filter by category and status.
- Pagination for inquiry records.
- Update inquiry status.
- Export inquiry records to CSV.

### Security
- Password hashing.
- JWT-based authentication.
- Protected admin routes.
- Input validation.
- Environment-based configuration.
- Database-backed admin account validation.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | Supabase PostgreSQL |
| Authentication | JWT |
| Styling | CSS |
| Testing | Vitest / project test suite |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## 📁 Project Structure

```text
k12-hunar-crm/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   └── package.json
│
├── server/
│   ├── src/
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── schema.sql
├── render.yaml
├── README.md
└── .gitignore
```

## ⚙️ Local Installation

### Prerequisites

- Node.js 22.12.0 or newer
- npm
- Supabase account
- Git

### 1. Clone the repository

```bash
git clone https://github.com/mohitgoyal7455/k12-hunar-crm.git

cd k12-hunar-crm
```

### 2. Configure the database

1. Create a Supabase project.
2. Open the SQL Editor.
3. Execute the contents of `schema.sql`.
4. Copy your PostgreSQL Session Pooler connection string.

### 3. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file using `.env.example` and configure:

```env
PORT=4000
NODE_ENV=development
DATABASE_URL=your_supabase_connection_string
DB_SSL=true
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=8h
CLIENT_ORIGIN=http://localhost:5173
```

Start the backend:

```bash
npm run dev
```

Backend runs at:

`http://localhost:4000`

### 4. Configure the frontend

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:4000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at:

`http://localhost:5173`

## 🔐 Demo Admin Login

Use the following demo credentials if the seeded demo admin account is enabled:

- **Email:** admin@k12hunar.com
- **Password:** Admin@123

For production use, replace the demo password with a strong private password.

## 🧪 Testing

Run backend tests:

```bash
cd server
npm test
```

Run backend type checking:

```bash
npm run typecheck
```

Build the frontend:

```bash
cd client
npm run build
```

## ☁️ Deployment

### Frontend – Vercel

- Connect the GitHub repository.
- Set the root directory to `client`.
- Framework preset: Vite.
- Build command: `npm run build`.
- Output directory: `dist`.
- Configure the environment variable:

```env
VITE_API_URL=https://k12-hunar-crm-api-jlg1.onrender.com/api
```

### Backend – Render

- Connect the GitHub repository.
- Set the root directory to `server`.
- Build command: `npm ci --include=dev && npm run build`.
- Start command: `npm start`.
- Configure the required database, JWT, and CORS environment variables.

## 🔒 Environment Variables

Never commit actual `.env` files, database passwords, JWT secrets, or other credentials to GitHub.

Use the provided `.env.example` files as configuration templates.

## 🎯 Future Improvements

- Role-based access control.
- Email notifications for new inquiries.
- Inquiry assignment to individual counselors.
- Advanced analytics and reporting.
- Follow-up reminders.
- Audit logs for administrative actions.

## 👨‍💻 Developer

**Mohit Goyal**

GitHub: https://github.com/mohitgoyal7455

---

*Built as a full-stack EdTech CRM and Inquiry Management System.*
