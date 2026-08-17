# Northline Roofing & Exteriors Estimator

This project provides a configuration-driven roofing estimator and owner admin panel for Northline Roofing & Exteriors.

## Live demo

- Frontend: TBD
- API: TBD

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB (MongoDB Atlas or local MongoDB)
- Auth: session-style Basic Auth for the owner admin panel

## Local setup

1. Clone the repo.
2. Install root dependencies:
   npm install
3. Install app dependencies:
   npm install --workspace client
   npm install --workspace server
4. Create environment files:
   cp server/.env.example server/.env
5. Start MongoDB locally or provide a MongoDB connection string.
6. Run the app:
   npm run dev
7. Open the frontend at http://localhost:5173
8. API runs on http://localhost:4000

## Environment variables

- `PORT` — API port
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — signing secret for tokens
- `ADMIN_USERNAME` — admin username
- `ADMIN_PASSWORD` — admin password
- `CLIENT_URL` — frontend origin

## Admin login

- Username: admin
- Password: roofing2026!

## Notes

- The estimator fetches its questions and pricing config from the backend API instead of hardcoding CRM values in the browser.
- The owner panel requires authentication before editing configuration or viewing leads.
