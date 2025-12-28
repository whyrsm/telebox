# Telegram Import Feature

## Overview

The import feature allows users to import files from their Telegram chats into TDrive. Files are copied to Saved Messages and organized into folders named after the source chat.

## User Flow

1. **Open Import Modal** - Click "Import from Telegram" button in sidebar
2. **Select Source** - Browse and search through available chats (Saved Messages, private chats, groups, channels)
3. **Select Files** - Choose which files to import from the selected chat
4. **Import** - Files are copied to Saved Messages and organized into a folder

## Technical Implementation

### Backend

**New Module:** `backend/src/import/`

**Endpoints:**
- `GET /import/dialogs` - List user's Telegram chats
- `GET /import/dialogs/files?chatId={id}` - List files in a specific chat
- `POST /import` - Import selected files

**Key Services:**
- `ImportService.getDialogs()` - Fetches user's Telegram dialogs
- `ImportService.getDialogFiles()` - Fetches media messages from a chat
- `ImportService.importFiles()` - Forwards messages to Saved Messages and creates DB records

**Telegram Methods Added:**
- `TelegramService.getDialogs()` - Get user's chat list
- `TelegramService.getMessagesFromChat()` - Get messages from specific chat
- `TelegramService.forwardToSavedMessages()` - Forward messages to Saved Messages

### Frontend

**New Component:** `frontend/src/components/modals/ImportModal.tsx`

**Features:**
- Two-step modal (select chat → select files)
- Search functionality for chats
- Checkbox selection for files
- Select all/none toggle
- File size display and total calculation
- Loading states

**Integration:**
- Added import button to Sidebar
- Integrated with Drive page
- Refreshes folder tree and file list after import

## File Organization

Imported files are automatically organized:
- **Folder Name:** Named after the source chat (e.g., "Project Team", "John Doe")
- **Location:** Root level (no parent folder)
- **Duplicates:** If folder exists, files are added to existing folder

## Supported File Types

All Telegram media types:
- Documents (PDF, DOCX, ZIP, etc.)
- Images (JPG, PNG, GIF, etc.)
- Videos (MP4, MOV, etc.)
- Audio files

## Future Enhancements

- [ ] Batch import progress indicator
- [ ] Import history/log
- [ ] Option to select destination folder
- [ ] Import from multiple chats at once
- [ ] Scheduled/automatic imports
- [ ] Import filters (by date, file type, size)

---

*Implemented: 2024-12-28*
