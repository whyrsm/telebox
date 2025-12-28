# TDrive

A Google Drive-like web application that uses Telegram as the storage backend. Users authenticate with their Telegram account and manage files stored in their Telegram "Saved Messages".

## Overview

TDrive provides a familiar file manager interface while leveraging Telegram's unlimited cloud storage. Each user's files remain in their own Telegram account, ensuring privacy and eliminating storage costs.

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

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- React Router (routing)
- Tailwind CSS + shadcn/ui (styling)
- TanStack Query (data fetching)
- Zustand (state management)
- Axios (HTTP client)

### UI Design (Hybrid: Google Drive layout + Finder aesthetics)

**Layout (Google Drive style)**
- Two-column layout: Sidebar | Main content area
- Collapsible sidebar with folder tree + quick access (Recent, Starred, Trash)
- Top toolbar: search bar (center), upload button, view toggle, user menu
- Breadcrumb navigation in main content area
- Main area shows files in grid or list view
- No third preview column — use modal or side sheet for file details
- Responsive: sidebar becomes drawer on mobile

**Visual Style (Finder-inspired)**
- Light mode default with subtle gray backgrounds (#f5f5f5, #fafafa)
- Minimal borders, use subtle shadows and background shifts instead
- Compact but not cramped — balanced padding
- System font stack: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Small, functional icons (Lucide icons, 18-20px)
- No gradients, no rounded-xl corners — use 4-6px radius max
- Selection: light blue highlight (#e5f1fb) like Finder

**Colors**
- Background: #ffffff (main), #f5f5f5 (sidebar)
- Text: #1d1d1f (primary), #6e6e73 (secondary)
- Accent: #007aff (macOS blue) — used sparingly
- Borders: #e5e5e5
- Hover: #f0f0f0
- Selected: #e5f1fb

**File Display**
- Grid view (default): thumbnails with filename below, good for media
- List view: icon, name, size, date modified — compact rows
- Toggle between views in toolbar
- Click to select, double-click to open/preview
- Multi-select with Shift/Cmd+click
- Checkbox selection for bulk actions (like Google Drive)

**Interactions**
- Right-click context menu (rename, move, delete, download)
- Drag and drop for moving files/folders
- Inline rename on slow double-click or F2
- Keyboard navigation (arrows, Enter, Delete)

**No AI-generated design patterns**
- No hero sections or marketing fluff
- No excessive animations or transitions
- No trendy glassmorphism or neumorphism
- No purple/blue gradient backgrounds
- No oversized padding or "breathable" layouts
- Functional first, aesthetic second

### Backend
- NestJS + TypeScript
- Prisma (ORM)
- PostgreSQL (database)
- GramJS (Telegram MTProto client)
- JWT (authentication)
- class-validator (validation)

### Future Additions
- Redis (session caching, rate limiting)
- React Native (mobile apps)

## Features

### MVP (Phase 1)
- [ ] Telegram phone number authentication
- [ ] View files from Saved Messages
- [ ] Upload files (single & multiple)
- [ ] Download files
- [ ] Delete files
- [ ] Create virtual folders
- [ ] Move files between folders
- [ ] Basic file search
- [ ] Image preview
- [ ] Video preview
- [ ] File type icons
- [ ] Responsive design

### Phase 2
- [ ] Drag & drop upload
- [ ] Upload progress indicator
- [ ] Bulk file operations
- [ ] Grid/List view toggle
- [ ] Sort by name/date/size
- [ ] File sharing (Telegram links)
- [ ] PDF preview
- [ ] Audio player

### Phase 3
- [ ] Import existing Saved Messages files
- [ ] Folder sharing between users
- [ ] File versioning
- [ ] Trash/recycle bin
- [ ] Storage usage stats
- [ ] Dark/light theme
- [ ] Keyboard shortcuts

### Future
- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Offline mode
- [ ] End-to-end encryption option

## Database Schema

Using snake_case for all database columns with Prisma's `@map` for field mapping.

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| telegram_id | BigInt | Telegram user ID |
| phone | String | Phone number (optional) |
| first_name | String | From Telegram profile |
| last_name | String | From Telegram profile |
| session_string | String | Encrypted MTProto session |
| created_at | DateTime | Account creation |
| updated_at | DateTime | Last update |

### folders
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Folder name |
| parent_id | UUID | Parent folder (null = root) |
| user_id | UUID | Owner reference |
| created_at | DateTime | Creation time |
| updated_at | DateTime | Last update |

### files
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | File name |
| size | BigInt | File size in bytes |
| mime_type | String | MIME type |
| message_id | BigInt | Telegram message ID |
| folder_id | UUID | Parent folder (null = root) |
| user_id | UUID | Owner reference |
| thumbnail | String | Thumbnail data (optional) |
| created_at | DateTime | Upload time |
| updated_at | DateTime | Last update |

## API Endpoints

### Authentication
```
POST   /auth/send-code     # Send verification code to phone
POST   /auth/verify        # Verify code and create session
POST   /auth/logout        # Destroy session
GET    /auth/me            # Get current user
```

### Folders
```
GET    /folders            # List folders (with optional parentId)
POST   /folders            # Create folder
PATCH  /folders/:id        # Rename folder
DELETE /folders/:id        # Delete folder
PATCH  /folders/:id/move   # Move folder
```

### Files
```
GET    /files              # List files (with optional folderId)
POST   /files/upload       # Upload file
GET    /files/:id          # Get file metadata
GET    /files/:id/download # Download file
DELETE /files/:id          # Delete file
PATCH  /files/:id/move     # Move file to folder
PATCH  /files/:id/rename   # Rename file
GET    /files/search       # Search files by name
```

## Project Structure

```
tdrive/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn components
│   │   │   ├── layout/        # Header, Sidebar, etc.
│   │   │   ├── files/         # File list, grid, item
│   │   │   ├── folders/       # Folder tree, breadcrumb
│   │   │   ├── upload/        # Upload modal, progress
│   │   │   └── preview/       # File previews
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Drive.tsx
│   │   │   └── Settings.tsx
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API calls
│   │   ├── stores/            # Zustand stores
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Helpers
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── guards/
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.module.ts
│   │   ├── folders/
│   │   │   ├── folders.controller.ts
│   │   │   ├── folders.service.ts
│   │   │   └── folders.module.ts
│   │   ├── files/
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   └── files.module.ts
│   │   ├── telegram/
│   │   │   ├── telegram.service.ts
│   │   │   └── telegram.module.ts
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts
│   │   │   └── prisma.module.ts
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   ├── filters/
│   │   │   └── interceptors/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── PROJECT.md
└── README.md
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost:5432/tdrive
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
TELEGRAM_API_ID=your-api-id
TELEGRAM_API_HASH=your-api-hash
ENCRYPTION_KEY=your-encryption-key
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

## Telegram Setup

1. Go to https://my.telegram.org
2. Log in with your phone number
3. Go to "API development tools"
4. Create a new application
5. Copy API_ID and API_HASH to backend .env

## Security Considerations

- MTProto session strings are encrypted at rest using AES-256
- JWT tokens expire after 7 days
- All API endpoints require authentication (except auth routes)
- File downloads are proxied through backend (no direct Telegram URLs exposed)
- Rate limiting on auth endpoints to prevent abuse
- Input validation on all endpoints

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- pnpm (recommended) or npm

### Backend
```bash
cd backend
pnpm install
cp .env.example .env  # Configure environment
pnpm prisma migrate dev
pnpm start:dev
```

### Frontend
```bash
cd frontend
pnpm install
cp .env.example .env  # Configure API URL
pnpm dev
```

## Deployment

### Backend
- Railway, Render, or any Node.js hosting
- Ensure PostgreSQL connection
- Set all environment variables

### Frontend
- Vercel, Netlify, or any static hosting
- Set VITE_API_URL to production backend URL

### Database
- Supabase, Neon, Railway, or any managed PostgreSQL

---

## Notes

- Telegram file size limit: 2GB (4GB with Premium)
- No total storage limit per user
- Files are stored in user's "Saved Messages" chat
- Folder structure is virtual (stored in PostgreSQL only)
- Thumbnails generated for images/videos on upload
