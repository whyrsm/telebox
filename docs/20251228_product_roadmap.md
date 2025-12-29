# TDrive Product Roadmap

A living document to guide development priorities and track progress.

---

## Vision

Build a reliable, privacy-focused file storage solution that leverages Telegram's unlimited cloud storage with a familiar Google Drive-like interface.

---

## Current Status

**Phase 1 (MVP)** — Complete ✅

Core functionality is fully implemented:
- ✅ Telegram phone authentication with country selector
- ✅ View files from Saved Messages
- ✅ Upload/download files with progress indicator
- ✅ Soft delete with trash/recycle bin
- ✅ Create virtual folders
- ✅ Move files between folders (batch operations)
- ✅ Basic file search
- ✅ Grid/List view toggle
- ✅ Context menu actions (files & folders)
- ✅ Image preview
- ✅ Video preview
- ✅ Folder-based routing with breadcrumb navigation
- ✅ Multi-select with keyboard and drag selection
- ✅ Favorites/starred functionality
- ✅ Storage usage stats
- ✅ Landing page
- ✅ Responsive mobile UI
- ✅ Empty state with onboarding

---

## Roadmap

### Phase 1: MVP Completion ✅

**Goal:** Fully functional file manager with core features

| Feature | Status |
|---------|--------|
| Image preview modal | ✅ Done |
| Video preview/player | ✅ Done |
| File type icons | ✅ Done |
| Responsive mobile layout | ✅ Done |
| Upload progress indicator | ✅ Done |
| Error handling improvements | ✅ Done |
| Multi-select functionality | ✅ Done |
| Trash/recycle bin | ✅ Done |
| Favorites system | ✅ Done |
| Storage stats | ✅ Done |
| Landing page | ✅ Done |

**Tech Debt:**
- Fix `any` types in services
- Extract duplicate code (icon maps, handlers)
- Add loading states to remaining async operations
- Add error boundaries for better error handling
- Add comprehensive test coverage

---

### Phase 2: Enhanced UX (Current)

**Goal:** Polish the experience and add power-user features

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Drag & drop upload | ✅ Done | — | — |
| Drag & drop file moving | ✅ Done | — | — |
| Bulk file operations | ✅ Done | — | Batch move, delete |
| Multi-select (keyboard + drag) | ✅ Done | — | Shift, Cmd/Ctrl, drag box |
| PDF preview | ✅ Done | — | — |
| Audio player | ✅ Done | — | — |
| Text file preview | ✅ Done | — | — |
| Sort by name/date/size | ⬜ Todo | High | Column headers in list view |
| File sharing (Telegram links) | ⬜ Todo | High | Generate share links |
| Keyboard shortcuts | ⬜ Todo | Medium | Navigate, select, delete |
| Recent files view | ⬜ Todo | Medium | Activity-based list |

---

### Phase 3: Advanced Features

**Goal:** Feature parity with mainstream cloud storage

| Feature | Status | Priority | Notes |
|---------|--------|----------|-------|
| Import existing Saved Messages | ✅ Done | — | — |
| Import from groups/private chats | ✅ Done | — | Sequential with progress bar |
| Trash/recycle bin | ✅ Done | — | Soft delete with restore |
| Starred/favorites | ✅ Done | — | Quick access section |
| Storage usage stats | ✅ Done | — | Visual breakdown in sidebar |
| Dark/light theme toggle | ⬜ Todo | High | System preference detection |
| File versioning | ⬜ Todo | Low | Keep previous versions |
| Recent files | ⬜ Todo | Medium | Activity-based list |
| Advanced search filters | ⬜ Todo | Medium | By type, date, size |

---

### Phase 4: Platform Expansion

**Goal:** Multi-platform availability

| Feature | Priority | Notes |
|---------|----------|-------|
| PWA support | High | Installable web app |
| Mobile app (React Native) | Medium | iOS & Android |
| Desktop app (Electron) | Low | macOS, Windows, Linux |
| Offline mode | Low | Local cache + sync |

---

### Phase 5: Monetization (Plus Tier)

**Goal:** Sustainable revenue through premium features

**Pricing:** $5/month (or $48/year)

| Feature | Free | Plus | Notes |
|---------|------|------|-------|
| Storage | Unlimited | Unlimited | Telegram provides this |
| File management | ✓ | ✓ | Folders, upload, download |
| Share links | Public only | Public + Private + Password + Expiry | Key upgrade trigger |
| Workspaces | 1 | Unlimited | Separate file collections |
| Organization | Folders | Folders + Tags + Colors + Starred | Visual organization |
| Search | Basic | Full-text + Filters | Search within documents |
| File history | — | 30-day version history | Restore previous versions |
| Support | Community | Priority | Email support |

**Implementation Priority:**

| Feature | Priority | Complexity |
|---------|----------|------------|
| Public share links (Free) | High | Medium |
| Private/password share links (Plus) | High | Medium |
| Workspaces | High | High |
| Tags & colors | Medium | Low |
| Starred/favorites | Medium | Low |
| File version history | Medium | High |
| Full-text search | Low | High |
| Payment integration (Stripe) | High | Medium |
| User plan management | High | Medium |

---

### Future Considerations

- End-to-end encryption option (client-side)
- Folder sharing between TDrive users
- Team tier (shared workspaces, admin controls)
- Third-party integrations
- Browser extension for quick uploads

---

## Technical Priorities

### Infrastructure
- [ ] Add Redis for session caching
- [ ] Implement rate limiting
- [ ] Add request logging/monitoring
- [ ] Set up CI/CD pipeline

### Code Quality
- [ ] Increase test coverage (unit + integration)
- [ ] Complete TypeScript strict mode compliance
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Performance profiling and optimization

### Security
- [ ] Security audit of auth flow
- [ ] Add CSRF protection
- [ ] Implement session invalidation
- [ ] Add audit logging

---

## Success Metrics

- **Reliability:** < 1% failed uploads/downloads
- **Performance:** < 2s initial load, < 500ms navigation
- **Usability:** Complete core tasks without documentation

---

## Release Milestones

| Version | Target | Scope |
|---------|--------|-------|
| v0.1.0 | — | MVP: Basic file operations |
| v0.2.0 | — | Phase 2: Enhanced UX |
| v0.3.0 | — | Phase 3: Advanced features |
| v0.4.0 | — | Phase 4: PWA + Platform |
| v1.0.0 | — | Production-ready + Free tier launch |
| v1.1.0 | — | Plus tier + Payments |

---

*Last updated: 2025-12-29*
