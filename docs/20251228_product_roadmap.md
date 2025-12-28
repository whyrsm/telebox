# TDrive Product Roadmap

A living document to guide development priorities and track progress.

---

## Vision

Build a reliable, privacy-focused file storage solution that leverages Telegram's unlimited cloud storage with a familiar Google Drive-like interface.

---

## Current Status

**Phase 1 (MVP)** — In Progress

Core functionality is implemented:
- ✅ Telegram phone authentication
- ✅ View files from Saved Messages
- ✅ Upload/download files
- ✅ Delete files
- ✅ Create virtual folders
- ✅ Move files between folders
- ✅ Basic file search
- ✅ Grid/List view toggle
- ✅ Context menu actions
- ⬜ Image preview
- ⬜ Video preview
- ⬜ Responsive design polish

---

## Roadmap

### Phase 1: MVP Completion (Current)

**Goal:** Fully functional file manager with core features

| Feature | Status | Priority |
|---------|--------|----------|
| Image preview modal | ✅ Done | — |
| Video preview/player | ✅ Done | — |
| File type icons | ✅ Done | — |
| Responsive mobile layout | ⬜ Todo | Medium |
| Upload progress indicator | ✅ Done | — |
| Error handling improvements | ⬜ Todo | Medium |

**Tech Debt:**
- Fix `any` types in services
- Extract duplicate code (icon maps, handlers)
- Add loading states to all async operations

---

### Phase 2: Enhanced UX

**Goal:** Polish the experience and add power-user features

| Feature | Priority | Notes |
|---------|----------|-------|
| Drag & drop upload | High | Drop zone in main area |
| Drag & drop file moving | High | Move files between folders |
| Bulk file operations | High | Multi-select delete, move |
| Sort by name/date/size | Medium | Column headers in list view |
| File sharing (Telegram links) | Medium | Generate share links |
| PDF preview | ✅ Done | — |
| Audio player | ✅ Done | — |
| Text file preview | ✅ Done | — |
| Keyboard shortcuts | Low | Navigate, select, delete |

---

### Phase 3: Advanced Features

**Goal:** Feature parity with mainstream cloud storage

| Feature | Priority | Notes |
|---------|----------|-------|
| Import existing Saved Messages | ✅ Done | — |
| Import from groups/private chats | ✅ Done | — |
| Trash/recycle bin | High | Soft delete with restore |
| Storage usage stats | Medium | Visual breakdown |
| Dark/light theme toggle | Medium | System preference detection |
| File versioning | Low | Keep previous versions |
| Starred/favorites | Low | Quick access section |
| Recent files | Low | Activity-based list |

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

### Future Considerations

- End-to-end encryption option (client-side)
- Folder sharing between TDrive users
- Team/workspace features
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
| v1.0.0 | — | Production-ready release |

---

*Last updated: 2024-12-28*
