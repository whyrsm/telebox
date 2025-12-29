# Mobile File Preview Fix

**Date:** December 29, 2025  
**Issue:** File and image preview not working on mobile devices

## Problem

The file preview modal was not opening when users tapped on files in mobile view. The root cause was that the application relied on `onDoubleClick` events, which don't work reliably on mobile/touch devices.

## Solution

Implemented double-tap detection for mobile devices in the `useFileItemHandlers` hook:

### Changes Made

**File:** `frontend/src/hooks/useFileItemHandlers.ts`

1. Added mobile device detection using `'ontouchstart' in window || navigator.maxTouchPoints > 0`
2. Implemented double-tap logic with 300ms timeout window
3. Tracks last tap time and item ID to detect double-taps on the same item
4. On double-tap: Opens files/folders (same as desktop double-click)
5. On single tap: Selects the item (existing behavior)

### Behavior

**Desktop (unchanged):**
- Single click: Select item
- Double click: Open file/folder
- Ctrl/Cmd + click: Toggle selection
- Shift + click: Range selection

**Mobile (new):**
- Single tap: Select item
- Double tap (within 300ms): Open file/folder
- Works for both files and folders

## Technical Details

The fix detects mobile devices and intercepts the click handler to implement custom double-tap logic. This approach:
- Maintains backward compatibility with desktop behavior
- Uses native click events (no touch event handlers needed)
- Works across all mobile browsers
- Doesn't interfere with existing selection logic

## Testing

To test:
1. Open the app on a mobile device or use browser dev tools mobile emulation
2. Navigate to any folder with files
3. Single tap a file - it should be selected
4. Double tap the same file quickly - preview modal should open
5. Try with images, PDFs, videos, and other file types

## Files Modified

- `frontend/src/hooks/useFileItemHandlers.ts` - Added mobile double-tap detection
