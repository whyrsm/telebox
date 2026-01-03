# AGENT.md - AI Assistant Guidelines for Telebox

## Project Overview

**Telebox** is a privacy-focused cloud storage solution that uses Telegram as the storage backend. It provides a Google Drive-like interface for managing files stored in users' personal Telegram "Saved Messages".

**Key Value Propositions:**
- Unlimited storage (2GB per file, 4GB with Telegram Premium)
- Privacy-first: files never leave the user's Telegram account
- Zero storage costs
- Open source, community-driven, non-commercial

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   React SPA     │────▶│   NestJS API    │────▶│   Telegram   │
│   (Frontend)    │◀────│   (Backend)     │◀────│   MTProto    │
└─────────────────┘     └────────┬────────┘     └──────────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        └─────────────────┘
```

## Tech Stack

### Frontend (`/frontend`)
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4 (use shadcn/ui component patterns)
- **State Management:** Zustand (stores in `/frontend/src/stores`)
- **Data Fetching:** TanStack Query v5 (hooks in `/frontend/src/hooks`)
- **Routing:** React Router DOM v7
- **Icons:** Lucide React
- **Animations:** Framer Motion

### Backend (`/backend`)
- **Framework:** NestJS 11 with TypeScript
- **ORM:** Prisma 5 (schema in `/backend/prisma/schema.prisma`)
- **Database:** PostgreSQL 14+
- **Authentication:** JWT with Passport
- **Telegram Integration:** GramJS (telegram package)

## Project Structure

```
/
├── frontend/                   # React SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   └── modals/        # Modal components
│   │   ├── hooks/             # Custom React hooks (TanStack Query)
│   │   ├── lib/               # Utilities and API client
│   │   ├── pages/             # Page components
│   │   └── stores/            # Zustand state stores
│   └── index.html
│
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── files/             # File management
│   │   ├── folders/           # Virtual folder system
│   │   ├── import/            # Import from Telegram
│   │   ├── telegram/          # Telegram MTProto integration
│   │   ├── users/             # User management
│   │   ├── common/            # Shared utilities
│   │   └── prisma/            # Prisma service
│   └── prisma/
│       └── schema.prisma      # Database schema
│
├── docs/                       # Documentation (date-prefixed)
```

## Development Commands

```bash
# Root level - run both frontend and backend
npm run dev              # Start both in development mode
npm run build            # Build both for production
npm run install:all      # Install all dependencies

# Backend
cd backend
npm run start:dev        # Development with hot reload
npm run build            # Production build
npx prisma studio        # Open Prisma database GUI
npx prisma migrate dev   # Run database migrations

# Frontend
cd frontend
npm run dev              # Vite dev server
npm run build            # Production build
npm run lint             # ESLint
```

## Coding Conventions

### General
- Use TypeScript for all new code
- Prefer functional components with hooks
- Use async/await over raw Promises
- Keep files focused and single-purpose

### Frontend
- **Components:** Use functional components with TypeScript interfaces for props
- **Styling:** Use Tailwind CSS classes; avoid inline styles
- **State:** Use Zustand for global state, React Query for server state
- **Naming:** PascalCase for components, camelCase for utilities/hooks
- **File naming:** kebab-case for files (e.g., `move-to-modal.tsx`)

### Backend
- **Modules:** Follow NestJS module structure (controller, service, module, DTOs)
- **Validation:** Use class-validator decorators in DTOs
- **Database:** Use Prisma for all database operations
- **Error Handling:** Throw NestJS HttpExceptions with appropriate status codes

### Git & Commits
- Use conventional commit format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
- **Never commit automatically** - always wait for user approval
- Keep commits focused and atomic

## Important Patterns

### API Integration
Frontend API calls go through `/frontend/src/lib/api.ts`. Use React Query hooks for data fetching.

### Authentication Flow
1. User enters phone number
2. Backend sends Telegram verification code
3. User enters code (and 2FA password if enabled)
4. Backend creates JWT token
5. Frontend stores token and redirects to dashboard

### File Operations
Files are stored in Telegram "Saved Messages". The backend uses GramJS to interact with Telegram's MTProto API. Metadata (folders, favorites, trash status) is stored in PostgreSQL.

### Environment Variables
- Backend: `/backend/.env` (copy from `.env.example`)
- Frontend: `/frontend/.env` (copy from `.env.example`)
- **Never commit `.env` files** - they contain secrets

## Documentation

- Documentation files go in `/docs/` with date prefix: `docs/YYYYMMDD_{name}.md`
- Update `RELEASE_NOTES.md` for user-facing changes
- Exception: root `README.md` is not date-prefixed

## Testing Checklist

Before suggesting a commit:
1. ✅ Run `npm run lint` (frontend)
2. ✅ Check for TypeScript errors
3. ✅ Check `git diff` for any hardcoded secrets
4. ✅ Test the feature manually if possible
5. ✅ Verify no `.env` files are staged

## Common Tasks

### Adding a New Feature
1. Create backend module if needed (NestJS)
2. Add Prisma schema changes and run migration
3. Create API endpoints with DTOs
4. Add React Query hooks for data fetching
5. Create UI components
6. Test end-to-end

### Modifying Database Schema
1. Edit `/backend/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Update related services and DTOs

### Adding a New Modal
1. Create component in `/frontend/src/components/modals/`
2. Use existing modal patterns for consistency
3. Manage open/close state with Zustand or local state

## Constraints & Guidelines

- **Privacy First:** Never log or expose user data unnecessarily
- **File Size Limit:** 2GB per file (4GB with Telegram Premium)
- **Non-Commercial:** This is a community project, not for commercial use
- **Open Source:** Code should be readable and well-documented
- **Script Execution:** Never execute scripts or commands without explicit user permission

## Helpful Context

- Landing page: `/frontend/src/pages/Landing.tsx`
- Main dashboard: Files and folders view with Drive-like interface
- The app supports both desktop and mobile responsive layouts
- Telegram API credentials are obtained from https://my.telegram.org
