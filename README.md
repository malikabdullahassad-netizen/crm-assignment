# CRM Lead Manager

A simple CRM lead management app with a React frontend and Express/MongoDB backend.

## Project structure

- `backend/` - Express API server
- `frontend/` - React + Vite user interface


## Backend setup

1. Copy or rename `backend/.env.example` to `backend/.env`
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```

### Backend environment variables

```env
MONGODB_URI=mongodb://127.0.0.1:27017/crm-lead-manager
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-jwt-refresh-secret
PORT=5000
NODE_ENV=development
```

## Frontend setup

1. Copy or rename `env.example` to `frontend/.env` if you want to override the API base URL
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Run locally:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

### Frontend environment variables

```env
VITE_API_URL=http://localhost:5000/api
```



## API routes

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/leads`
- `POST /api/leads`
- `PUT /api/leads/:id`
- `DELETE /api/leads/:id`
- `GET /api/leads/report`
- `GET /api/contact-persons`
- `POST /api/contact-persons`
- `DELETE /api/contact-persons/:id`


