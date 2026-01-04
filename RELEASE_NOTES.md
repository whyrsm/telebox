# Release Notes

## [v0.2.1] - 2026-01-04

### 🔐 Security Enhancements

- **Session String Encryption**: Implemented AES-256-GCM encryption for user session strings
  - Session strings are now encrypted at rest in the database
  - Enhanced security against database breaches
  - Migration script provided for existing data (`migrate-sessions-to-gcm.ts`)
  
- **Metadata Encryption Improvements**: Refined encryption mechanism for file and folder names
  - Standardized encryption under `CryptoService`
  - Dual-key decryption logic for backward compatibility
  - Support for both canonical (new) and legacy encryption keys
  - Comprehensive documentation of encryption architecture

- **Security Page**: Added dedicated `/security` page explaining encryption mechanisms
  - Transparent explanation of zero-knowledge architecture
  - Visual breakdown of encryption process
  - Technical deep dive into AES-256-GCM implementation
  - User-friendly security information

### 📊 Analytics & Monitoring

- **Google Analytics Integration**: Added Google Analytics tracking
  - Configurable via `VITE_GA_MEASUREMENT_ID` environment variable
  - Privacy-conscious implementation
  - Integrated in `index.html` with environment variable support

### 🛠️ Developer Tools

- **Database Migration Scripts**: Enhanced migration capabilities
  - PostgreSQL database migration tools using `podman`
  - Session encryption migration script
  - Metadata encryption assessment tools
  - Database comparison utilities for data verification

- **Encryption Debugging Tools**: Added utilities for encryption troubleshooting
  - Decrypt tool script for testing encrypted strings
  - Session encryption assessment script
  - Comprehensive encryption documentation

### 📚 Documentation

- **Encryption Mechanism Documentation**: Added detailed technical documentation
  - `docs/20260104_encryption_mechanism.md` - Complete encryption architecture
  - Visual diagrams of encryption flow
  - Security benefits and trade-offs explained
  - FAQ section for common questions

- **Updated Metadata Encryption Docs**: Refined existing encryption documentation
  - Clarified session string persistence
  - Updated key derivation process
  - Enhanced security explanations

### 🐛 Bug Fixes

- **Encryption Key Consistency**: Fixed issues with folder and file name display
  - Resolved key derivation inconsistencies
  - Ensured stable encryption keys across services
  - Fixed decryption errors for existing data

### 🔧 Technical Improvements

- **CryptoService Standardization**: Centralized all encryption logic
  - Unified encryption/decryption methods
  - Consistent key derivation across services
  - Better error handling and validation

- **Service Refactoring**: Updated services to use standardized encryption
  - `TelegramService` now uses `CryptoService`
  - `AuthService` integrated with new encryption
  - `FilesService` and `FoldersService` use dual-key decryption

---

## [v0.2.0] - 2026-01-03

### 🎉 New Features
- **Move To Functionality**: Add comprehensive 'Move to' feature for files and folders
  - New MoveToModal component with folder tree navigation
  - Support for single and batch move operations
  - Recursive folder tree filtering with optimized performance
  - Context menu integration for quick access

### 🐛 Bug Fixes
- **Modal Styling**: Fix button visibility issues in modals
  - Resolved "Move here" button not appearing due to CSS reset conflicts
  - Updated global button styles to allow Tailwind classes to work properly
- **Folder Tree**: Fix folders disappearing when selected in MoveToModal
  - Implemented proper recursive filtering
  - Added useMemo optimization to prevent unnecessary re-renders
  - Removed redundant exclusion checks

### 🎨 UI/UX Improvements
- **Design System**: Apply Notion-inspired design guidelines
  - Subtle gray highlights for selected items (`bg-black/10`)
  - Consistent hover states (`hover:bg-black/5`)
  - Dark primary button with proper contrast
  - Warm gray backgrounds (`#f7f6f3`)
- **Selection Bar**: Move to floating position with improved UX
- **Mobile FAB**: Refactor positioning and styling
- **Trash Modal**: Improve accessibility and styling

### ✨ Enhancements
- **Drag & Drop**: Add global drag-and-drop file upload
- **Import**: Enable Telegram import in mobile and desktop UI
- **Sorting**: Add file and folder sorting by name, size, and modified date
- **Mobile**: Add double-tap detection for file preview on touch devices
- **Batch Operations**: Add batch delete functionality for files and folders

### 📚 Documentation
- Remove pricing model documentation (now open source)
- Add open source section placeholder to landing page

### 🔧 Technical Improvements
- Optimize folder tree filtering with `useMemo`
- Enhanced query invalidation for better data consistency
- Improved React hooks usage (fixed hooks order violations)

---

## [v0.1.0] - 2025-12-29

### 🎉 Initial Release

This is the first official release of **Telebox** - a self-hosted cloud storage solution powered by Telegram.

### 🚀 Core Features

#### Authentication & Security
- Telegram-based authentication using MTProto
- Session persistence across server restarts
- Phone number validation with country selector
- End-to-end encryption for file metadata
- Secure file storage using Telegram's infrastructure

#### File Management
- Upload files to Telegram cloud storage
- Download files with progress tracking
- File preview for multiple formats (images, videos, PDFs, text)
- MIME type detection and handling
- Soft delete with trash functionality
- Permanent delete from trash
- File renaming and organization

#### Folder Management
- Create and organize folders
- Nested folder structure
- Folder navigation with breadcrumbs
- Folder-based routing
- Context menu for folder operations
- Soft delete folders with contents

#### Favorites
- Mark files and folders as favorites
- Quick access to favorite items
- Toggle favorite status

#### Selection & Batch Operations
- Multi-select files and folders
- Keyboard shortcuts for selection
- Drag selection support
- Batch move operations
- Batch delete operations
- Visual selection feedback

#### Import from Telegram
- Browse Telegram dialogs (chats, channels, groups)
- Import files from Telegram conversations
- Support for different chat types
- Progress tracking for imports
- Single file import endpoint

#### Drag & Drop
- Drag and drop file/folder movement
- Visual feedback during drag operations
- Drop zone highlighting

#### Mobile Support
- Responsive design for mobile devices
- Mobile-optimized UI components
- Touch-friendly interactions
- Mobile FAB (Floating Action Button)
- Viewport adjustments for mobile browsers

---

## Version History

- **v0.3.0** (2026-01-04) - Security enhancements and encryption improvements
- **v0.2.0** (2026-01-03) - Move To functionality and modal improvements
- **v0.1.0** (2025-12-29) - Initial release with core features

---

## Upgrade Notes

### From v0.2.0 to v0.3.0

**Important Security Update:**

This release introduces session string encryption. Existing installations should migrate their data:

1. **Session Encryption Migration** (Recommended):
   ```bash
   cd backend
   # Review the migration script first
   cat scripts/migrate-sessions-to-gcm.ts
   # Run migration (if script exists)
   npm run migrate:sessions
   ```

2. **Environment Variables**:
   - **Optional**: Add `VITE_GA_MEASUREMENT_ID` to `frontend/.env` for Google Analytics
   - Existing `ENCRYPTION_KEY` in `backend/.env` continues to work

3. **Database Compatibility**:
   - Fully backward compatible with existing encrypted metadata
   - Dual-key decryption supports both old and new encryption formats
   - No data loss during migration

**New Features Available:**
- Visit `/security` page to learn about the encryption architecture
- Enhanced privacy with encrypted session strings
- Improved encryption documentation in `/docs`

**Breaking Changes:**
- None. This release is fully backward compatible.

---

### From v0.1.0 to v0.2.0

No breaking changes. This release is fully backward compatible.

**New Features Available:**
- Use the context menu or selection bar to access the new "Move to" functionality
- Enjoy improved modal styling and button visibility
- Experience better performance with optimized folder tree rendering

**CSS Changes:**
- Global button reset has been updated - if you have custom button styles, verify they still work correctly

---

## Contributors

- [@whyrsm](https://github.com/whyrsm) - Project maintainer

---

## License

This project is open source and available under the MIT License.
