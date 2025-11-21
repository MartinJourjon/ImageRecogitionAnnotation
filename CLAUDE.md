# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Image Recognition Annotation is a full-stack gamified annotation platform for image labeling. The application allows users to annotate images with demographic data (age, ethnicity, etc.) and various rating scales, while earning XP and points through a gamification system.

**Architecture**: Monorepo with separate frontend (Vue 3) and backend (Express + PostgreSQL) applications.

## Development Commands

### Frontend (Vue 3 + Vite)

```bash
cd frontend
npm run dev      # Start development server (Vite)
npm run build    # Build for production
npm run preview  # Preview production build
```

Frontend runs on Vite's default port (typically 5173).

### Backend (Express + PostgreSQL)

```bash
cd backend
npm start        # Start Express server on port 3000
```

Backend runs on port 3000 by default (configurable via `PORT` environment variable).

**Important**: Ensure PostgreSQL is running and the database is configured before starting the backend.

## Environment Setup

### Frontend Environment Variables

Create `frontend/.env` with:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Backend Environment Variables

Create `backend/.env` with:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=image_annotation
DB_USER=postgres
DB_PASSWORD=your_password_here

JWT_SECRET=your_jwt_secret_here_change_this_in_production
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Architecture

### Frontend Structure

**Framework**: Vue 3 with Composition API (`<script setup>`)
**UI Framework**: Vuetify 3 (Material Design components)
**State Management**: Pinia
**Routing**: Vue Router with authentication guards
**HTTP Client**: Custom fetch-based API client with JWT authentication

Key directories:
- `frontend/src/pages/` - Top-level route pages (Login, Signup, Dashboard, Profile)
- `frontend/src/components/` - Reusable Vue components including:
  - `AnnotationForm.vue` - Main annotation interface with demographic/rating fields
  - `AnnotationPage.vue` - Container for annotation workflow with locking mechanism
  - `GuideLines.vue` - Annotation instructions
  - `AnnotatorList.vue` - Leaderboard/annotator tracking
  - `gamification/` - Gamification UI components (XpBar, LevelBadge, UserCard, RankingTable)
- `frontend/src/stores/` - Pinia stores:
  - `user.js` - Central user state including auth, XP, level, points, role
- `frontend/src/services/` - Service layer for HTTP API calls:
  - `auth.js` - Authentication service (signin, signup, getCurrentUser)
  - `annotations.js` - Annotation CRUD operations
  - `annotators.js` - Annotator profile and gamification operations
- `frontend/src/lib/` - Shared utilities:
  - `api.js` - HTTP client with JWT token management

### Backend Structure

**Framework**: Express.js (classic CommonJS structure)
**Database**: PostgreSQL with `pg` library
**Authentication**: JWT-based token authentication with bcrypt password hashing

Key directories:
- `backend/routes/` - API route handlers:
  - `auth.js` - Authentication endpoints (signup, signin, /me)
  - `annotations.js` - Annotation CRUD and locking endpoints
  - `annotators.js` - Annotator profile, stats, and leaderboard endpoints
- `backend/middleware/` - Express middleware:
  - `auth.js` - JWT token generation and verification
- `backend/config/` - Configuration modules:
  - `database.js` - PostgreSQL connection pool

### Authentication & Authorization

**Backend Authentication**:
- JWT-based token system with bcrypt password hashing
- Tokens stored in localStorage on frontend
- `Authorization: Bearer <token>` header for all authenticated requests
- Token verification middleware protects all API routes except auth endpoints

**Frontend Authentication**:
The user store (`frontend/src/stores/user.js`) manages:
- Sign in/up/out operations via HTTP API
- Profile fetching with JWT token
- XP, level, and points tracking
- Role-based access

**Router guards**: `frontend/src/router.js` includes a global `beforeEach` guard that:
1. Initializes API client with stored JWT token
2. Fetches user profile if token exists
3. Redirects unauthenticated users to `/login` for protected routes
4. All routes except `/login` and `/signup` require authentication (`meta.requiresAuth: true`)

### Gamification System

The gamification system tracks user engagement through:
- **XP (Experience Points)**: 50 XP earned per completed annotation
- **Level**: Calculated as `Math.floor(xp / 500) + 1` (500 XP per level)
- **Points**: 10 points earned per completed annotation for leaderboard ranking
- **Total Annotations**: Count of completed annotations

**Implementation**: Gamification logic runs in the backend:
- When annotation status changes to 'done', backend automatically awards XP and points
- Transaction-based updates ensure atomicity
- Frontend can manually trigger rewards via `useUserStore().addRewards({ xp, points, annotations })`
- Profile is re-fetched after rewards to sync state

### Database Schema (PostgreSQL)

Key tables:
- `users` - Authentication table:
  - `id` - Primary key (serial)
  - `email` - User email (unique)
  - `password_hash` - Bcrypt hashed password
  - `created_at` - Timestamp
- `annotations` - Image annotation records:
  - `img_id` - Image identifier (primary key)
  - `status` - Workflow status ('pending', 'in_progress', 'done', 'skipped')
  - `annotator_id` - ID of user who annotated (text)
  - Demographic data (age_category, gender, ethnicity, etc.)
  - Rating scales (0-10 integer values)
  - `annotation_timestamp` - When annotation was completed
- `annotators` - User profiles:
  - `user_id` - Foreign key to users.id
  - `nickname` - Display name
  - `role` - User role ('annotator', etc.)
  - `xp`, `total_points`, `total_annotations` - Gamification metrics
  - `created_at` - Timestamp

### Image Annotation Workflow

1. User navigates to AnnotationPage (`/`)
2. System loads next pending annotation via API (status='pending', ordered by img_id)
3. **Locking mechanism**: System attempts to atomically lock annotation by setting status to 'in_progress'
   - If lock fails (another user claimed it), retry with next annotation (max 5 attempts)
   - Lock is tracked locally and released on navigation or page unload
4. User fills out AnnotationForm with:
   - Age category (infant to senior)
   - Ethnicity (White, Black/African, Asian variants, etc.)
   - Various 0-10 rating scales
5. On save:
   - Frontend sends PUT request to `/api/annotations/:imgId` with status='done'
   - Backend updates annotation in database within transaction
   - Backend automatically awards 50 XP and 10 points to user
   - Transaction commits atomically
6. Next pending annotation loads automatically

### Important Implementation Details

- **API Client**: Custom fetch-based client in `frontend/src/lib/api.js` manages JWT tokens in localStorage
- **User Store Initialization**: Uses `_initialized` flag to prevent duplicate profile fetches
- **Vue Router**: Uses `createWebHistory()` for clean URLs (requires server config for SPA routing)
- **Vuetify**: Configured in `main.js` with Material Design Icons (`@mdi/font`)
- **Dark Mode**: Manual toggle via `document.documentElement.classList.toggle('dark')` (not Vuetify theme)
- **CORS**: Backend configured to accept requests from frontend origin (configurable via FRONTEND_URL env var)
- **Database Connection**: PostgreSQL connection pool configured in `backend/config/database.js`

### Branch Strategy

- **Main branch**: `main`
- **Current working branch**: `v2`

When creating PRs, target the `main` branch unless instructed otherwise.

## Code Conventions

- Vue components use Composition API with `<script setup>` syntax
- Async/await pattern for all asynchronous operations
- Error handling stores errors in component-level `ref()` or store state
- French comments and UI text (interface is in French)
- Services return `{ data, error }` objects; components handle error display
- Backend uses CommonJS (require/module.exports)
- All API routes except auth are protected with JWT verification middleware
- Database queries use parameterized queries to prevent SQL injection
