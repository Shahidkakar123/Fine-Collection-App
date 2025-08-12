# Fine Collection App

A full-stack REST API and frontend for managing employee fines, built with Node.js, Express, MongoDB, and Vue 3.

## Backend

- **Tech Stack**: Node.js, Express, MongoDB (Atlas), JWT, bcrypt, Swagger, Jest, Supertest
- **Setup**:
  1. Install dependencies: `cd backend && npm install`
  2. Create `.env` with `PORT`, `MONGODB_URI`, `JWT_SECRET`
  3. Run: `npm start`
  4. Access API docs: `http://localhost:3000/api-docs`
  5. Deploy to Heroku: `heroku create`, `git push heroku main`

## Frontend

- **Tech Stack**: Vue 3 (Composition API), Vite, Vue Router, Pinia, Axios, Tailwind CSS
- **Setup**:
  1. Install dependencies: `cd frontend && npm install`
  2. Create `.env` with `VITE_API_URL=http://localhost:3000` (update for Heroku in production)
  3. Run: `npm run dev`
  4. Access: `http://localhost:5173`
  5. Build for production: `npm run build`

## Deployment

- Backend: Deployed to Heroku with MongoDB Atlas.
- Frontend: Can be deployed to Vercel or Netlify. Update `VITE_API_URL` to Heroku backend URL.

## Features

- User authentication (register/login)
- CRUD operations for fines (employee name, description, category, value)
- Dashboard with fine statistics
- Responsive UI with Tailwind CSS
