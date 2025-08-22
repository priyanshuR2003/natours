# Natours

Natours is a full-featured travel booking web application for exploring and booking exciting tours around the world. Built with Node.js, Express, MongoDB, and Pug, it offers a modern, responsive user experience for both travelers and tour operators.

## Features

- Browse a variety of tours with detailed information and images
- User authentication and account management
- Book tours and manage your bookings
- Leave reviews and ratings for tours
- Secure payment integration
- Admin dashboard for managing tours, users, and reviews

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose ODM)
- **Frontend:** Pug templates, CSS, JavaScript
- **Authentication:** JWT, cookies
- **Email:** Nodemailer for transactional emails
- **Payment:** Stripe integration

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd natours
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Copy `config.env.example` to `config.env` and fill in your credentials (MongoDB URI, JWT secret, Stripe keys, etc).
4. **Run the app:**
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000` by default.

## Folder Structure

- `controllers/` – Route handlers for business logic
- `models/` – Mongoose models for MongoDB collections
- `routes/` – API and view routes
- `views/` – Pug templates for server-rendered pages
- `public/` – Static assets (CSS, JS, images)
- `utils/` – Utility functions and helpers


