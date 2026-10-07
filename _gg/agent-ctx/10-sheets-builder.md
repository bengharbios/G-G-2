# Task 10 — sheets-builder

## Summary
Built all 6 TUILiveKit sheet components + shared BottomSheetOverlay for the voice rooms UI.

## Files Created (7 total)

### Shared
- `components/shared/BottomSheetOverlay.tsx` — Reusable bottom sheet wrapper with TUILiveKit Drawer pattern (framer-motion slide-up, blur backdrop, 15px top radius, spring animation, 48px header)

### Sheets
1. `components/sheets/GiftSheet.tsx` — Gift selection panel (400px, category tabs, 4-col grid, quantity pills, send button)
2. `components/sheets/SettingsSheet.tsx` — Room settings (350px, horizontal icon items, bg picker, name editor, mode/mic count/auto toggle)
3. `components/sheets/ProfileSheet.tsx` — User management (179px/280px adaptive, avatar + role badge, follow button, admin actions, role dropdown)
4. `components/sheets/MicMenuSheet.tsx` — Seat context menu (auto-height, context-aware actions, destructive/positive coloring)
5. `components/sheets/SeatManagementSheet.tsx` — Anchor seat management (724px, auto mode toggle, seated list, applicant list, empty state)
6. `components/sheets/RoomInfoSheet.tsx` — Room info display (auto-height, room details, stats, settings list, copy link)

## Design System
All components use `TUI` design tokens from `types.ts`:
- Colors: G2 (#22262E) bg, B1 (#1C66E5) primary, G7/G6/G5 text hierarchy
- Radius: xl (15px) sheet corners, pill (20px) buttons, circle avatars
- Dimensions: Exact pixel heights from TUILiveKit screen_adapter.dart
- Animations: Spring drawer (300ms cubic-bezier), fast transitions (200ms)

## Lint Status
- 0 errors in voice-rooms components
- 2 warnings (false positives from Lucide `Image` component name conflicting with jsx-a11y/alt-text rule)
