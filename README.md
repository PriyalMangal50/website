# MERN Blog Website

A full-stack blog platform built with MongoDB, Express, React, and Node.js. Features admin and user authentication, blog CRUD, media upload, and user interactions.

## Features

- **Admin Panel:**
  - Login with secure credentials (no signup for admin)
  - Create, edit, and delete blogs with title, description, and media (image, gif, video, or URL)
  - Manage users: view, update roles, delete
- **User Panel:**
  - Signup and login
  - View all blogs with rich media
  - Like, comment, and share blogs
  - Delete own comments
- **Media Upload:**
  - Admin can upload images, gifs, videos, or URLs
  - Media is stored and served by backend
- **Backend:**
  - JWT authentication
  - Role-based access control
  - RESTful APIs
  - MongoDB for data storage

## Getting Started

### Prerequisites
- Node.js
- MongoDB Atlas or local MongoDB

### Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/PriyalMangal50/website.git
   ```
2. Install backend dependencies:
   ```sh
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```sh
   cd ../project
   npm install
   ```
4. Set up environment variables:
   - `backend/.env` for MongoDB URI, JWT secret, admin credentials, etc.
   - `project/.env` for API URL (e.g., `VITE_API_URL=http://localhost:5000`)

### Running Locally
- Start backend:
  ```sh
  cd backend
  npm start
  ```
- Start frontend:
  ```sh
  cd ../project
  npm run dev
  ```
- Visit `http://localhost:5173` in your browser.

### Deployment
- Backend: Deploy to Render (set root directory to `backend`)
- Frontend: Deploy to Vercel (set root directory to `project`)

## Admin Credentials
- Email: `admin@gmail.com`
- Password: `12345678`

## License
MIT
