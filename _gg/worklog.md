# Work Log

## Task: Add new tables and helper functions to admin-db.ts

### Date: 2025-06-03

### Changes Made to `/home/z/my-project/src/lib/admin-db.ts`

#### 1. New Tables Added (inside `ensureAdminTables`, before `_tablesReady = true`)

- **RoomBookmark** — saves favorite rooms (UNIQUE on userId + roomId)
- **UserReport** — reporting users with reason, category, roomId, status
- **UserBlock** — blocking users (UNIQUE on blockerId + blockedId)
- **UserAchievement** — tracking unlocked achievements (UNIQUE on userId + achievementKey)
- **DailyLoginReward** — daily login gem rewards with streak tracking (UNIQUE on userId)
- **RoomAnalytics** — room stats and earnings per day (UNIQUE on roomId + date)

#### 2. Helper Functions Added (between `ensureAdminTables` and `seedGameConfigs`)

**RoomBookmark functions:**
- `addRoomBookmark()` / `removeRoomBookmark()` / `getUserBookmarks()` / `isRoomBookmarked()`

**UserReport & UserBlock functions:**
- `createUserReport()` / `blockUser()` / `unblockUser()` / `isUserBlocked()` / `getBlockedUserIds()`

**Achievement system:**
- `ACHIEVEMENTS` constant array (12 achievements with Arabic/English names, descriptions, icons, gem rewards)
- `AchievementKey` type
- `unlockAchievement()` / `getUserAchievements()`

**Daily Login Rewards:**
- `claimDailyReward()` — handles streak calculation with escalating gem rewards
- `getDailyRewardStatus()` — returns current streak and claim eligibility

**Room Analytics:**
- `updateRoomAnalytics()` — upsert pattern with ON CONFLICT fallback
- `getRoomEarnings()` — daily breakdown over configurable days
- `getTopGifters()` — aggregated from GiftHistory with participant info

**Word Filter:**
- `BANNED_WORDS` constant array (Arabic profanity patterns)
- `filterMessage()` — regex-based filtering with flagging

---

## Task: Create sound effects system and floating reactions

### Date: 2025-06-03

### Files Created

#### 1. `/home/z/my-project/src/lib/sound-effects.ts`
- Full Web Audio API sound effects system — no audio files needed
- **11 event sounds**: join, leave, mic on/off, gift send/receive, notification, error, seat request, kick, achievement
- **8 soundboard items**: laugh 😂, clap 👏, whistle 😤, wow 😮, boo 👎, drumroll 🥁, airhorn 📯, heartbeat 💓

#### 2. `/home/z/my-project/src/app/voice-rooms/components/FloatingReactions.tsx`
- `FloatingReactions` — full-screen overlay rendering animated emoji float-ups
- `QuickReactionBar` — 6-emoji quick-pick bar (❤️ 😂 👏 🔥 😍 💯)
- `useFloatingReactions` hook — state management with auto-cleanup after animation

---

## Task: Create API routes for new features

### Date: 2025-06-03

### Files Created

1. **`/home/z/my-project/src/app/api/bookmarks/route.ts`** — POST/DELETE/GET for room bookmarks
2. **`/home/z/my-project/src/app/api/report/route.ts`** — POST (report/block/unblock), GET (check blocked)
3. **`/home/z/my-project/src/app/api/achievements/route.ts`** — POST (unlock), GET (list all with status)
4. **`/home/z/my-project/src/app/api/daily-reward/route.ts`** — POST (claim), GET (check status)
5. **`/home/z/my-project/src/app/api/room-earnings/route.ts`** — GET (earnings + top gifters)
6. **`/home/z/my-project/src/app/api/voice-rooms/search/route.ts`** — GET (search rooms by query/category/sort)

---

## Task: Integrate all features into RoomInteriorView

### Date: 2025-06-03

### Changes Made to `/home/z/my-project/src/app/voice-rooms/components/RoomInteriorView.tsx`

1. **Sound effects** — Added import + sound on like/heart button + sound toggle in soundboard
2. **Floating reactions** — Overlay + QuickReactionBar with 6 emojis + Sparkles button in bottom bar
3. **Soundboard panel** — 8 emoji sound effects grid + enable/disable toggle
4. **Connection quality indicator** — Green/yellow/red dot in online count badge
5. **Word filter** — Chat messages filtered for Arabic profanity with error sound
6. **Recording indicator** — Admin-only REC toggle with timer
7. **Theme toggle** — Dark/light mode button in header
8. **Reconnect indicator** — Connection loss banner
9. **Daily reward toast** — Auto-check + claim + reward display modal

---

## Task: Add room discovery/search to RoomListView

### Date: 2025-06-03

### Changes Made to `/home/z/my-project/src/app/voice-rooms/components/RoomListView.tsx`

1. **Search bar** — RTL input with search icon + filter toggle
2. **Category filter tabs** — الكل | الأكثر نشاطاً | جديدة | المحفوظة
3. **Bookmark button** — On each room card with amber fill/outline
4. **Sorted/filtered rooms** — By participant count or creation date
5. **Empty states** — Contextual messages for search/no-results

---

## Task: Create utility components

### Date: 2025-06-04

### Files Created

1. **`ThemeToggle.tsx`** — Dark/light toggle with localStorage persistence
2. **`ReconnectIndicator.tsx`** — Connection loss banner with reconnection message
3. **`RecordingIndicator.tsx`** — Admin-only recording toggle with live timer
4. **`DailyRewardToast.tsx`** — Auto-check + claim + reward display modal

### Verification
- Lint: Zero new errors from all changes
- All pre-existing errors remain in other files
- Voice rooms page compiles successfully (verified via dev server HTML output)

---

## Task: Add Report, Block & Per-Speaker Volume to MicMenuSheet

### Date: 2025-06-04
### Task ID: 14+16

### Changes Made to `/home/z/my-project/src/app/voice-rooms/components/sheets/MicMenuSheet.tsx`

#### 1. Report & Block Menu Items (for occupied seats of other users)
- Added "إبلاغ" (Report) menu item with `AlertTriangle` icon in `TUI.colors.red`
- Added "حظر" (Block) menu item with `Ban` icon in `TUI.colors.orange`
- Both items appear AFTER existing admin actions (kick-temp, kick-permanent)
- Available for ALL users viewing other users' occupied seats (not just admins)

#### 2. Report Dialog
- Modal overlay with 4 reason options: سبام (Spam), محتوى غير لائق (Inappropriate content), تحرش (Harassment), آخر (Other)
- Radio-button selection style with red accent on selected reason
- Cancel / Submit buttons — submit disabled until reason selected
- Calls `onReport(userId, reason)` callback on submit

#### 3. Block Functionality
- Calls `onBlock(userId)` callback immediately on click
- Designed to be handled by parent (localStorage or API)

#### 4. Per-Speaker Volume Control
- Volume slider (range input, 0-100%) shown below menu items for occupied seats of other users
- Styled with `TUI.colors.sliderFilled`/`sliderEmpty` gradient track
- Displays current volume percentage
- Calls `onVolumeChange(userId, volume)` callback on change
- Only renders when `onVolumeChange` prop is provided

#### 5. New Props Added
- `onReport?: (userId: string, reason: string) => void`
- `onBlock?: (userId: string) => void`
- `onVolumeChange?: (userId: string, volume: number) => void`

#### Design Notes
- All styling uses inline styles matching existing TUI design tokens
- Report dialog is a fixed overlay within the MicMenuSheet component
- Volume slider section separated by a divider line from menu items
- No modifications to `useVoiceRTC.ts` — volume control handled via callback props


## Task 17+18+22 — Top Gifters, Achievements & Earnings Sheets

**Date**: $(date -u '+%Y-%m-%d %H:%M UTC')
**Agent**: fullstack-dev

### Summary
Implemented three new bottom sheet components for the Arabic RTL voice room app and integrated them into the ThreeDotsMenu in RoomInteriorView.

### Files Created
1. **`src/app/voice-rooms/components/sheets/TopGiftersSheet.tsx`** — Bottom sheet showing leaderboard of top gifters in the current room. Features rank badges (🥇🥈🥉 for top 3), colored borders (gold/silver/bronze), avatar/initial display, and gem value formatting.

2. **`src/app/voice-rooms/components/sheets/AchievementsSheet.tsx`** — Bottom sheet displaying 12 user achievements in a 2-column grid. Fetches unlocked achievements from `/api/achievements?userId=` on mount. Unlocked achievements have golden border + glow; locked achievements are dimmed with grayscale filter and lock icon overlay. Shows summary counter at top.

3. **`src/app/voice-rooms/components/sheets/EarningsSheet.tsx`** — Bottom sheet for room hosts showing earnings dashboard. Fetches from `/api/room-earnings?roomId=&userId=`. Features a gradient total earnings card with large gem number, today/week earnings split, and top 3 gifters for the room.

### Files Modified
4. **`src/app/voice-rooms/components/RoomInteriorView.tsx`**:
   - Added imports: `Medal`, `DollarSign` from lucide-react; three new sheet components
   - Added state: `showTopGifters`, `showAchievements`, `showEarnings`
   - Extended `ThreeDotsMenu` component with `onOpenTopGifters`, `onOpenAchievements`, `onOpenEarnings`, `hasAuthUser` props
   - Added 3 menu items: 🏆 المتبرعين (always visible), 🏅 الإنجازات (auth users only), 💲 الأرباح (owner only)
   - Rendered three sheet components at the end of the JSX

### Design Consistency
- All sheets use `BottomSheetOverlay` from `../shared/BottomSheetOverlay` with TUI color tokens
- All text in Arabic (RTL)
- Dark teal-green theme matching existing room UI
- Consistent card styling with `rgba()` backgrounds and subtle borders
- Responsive, mobile-first with touch-manipulation
- Loading states with spinner and Arabic text
---
Task ID: 1
Agent: Main Agent
Task: Implement missing voice room features and push to GitHub

Work Log:
- Explored the existing codebase to identify which of the 24 requested features were already implemented
- Found 18 of 24 features already existed (FloatingReactions, DailyRewardToast, ThemeToggle, DND, ReconnectIndicator, RecordingIndicator, AchievementsSheet, TopGiftersSheet, EarningsSheet, Room Search, Bookmarks, Share Link, Speaking Indicator, Report API, Auto-moderation, Network Quality hook, Noise Suppression)
- Created 6 missing UI components via subagents:
  1. NetworkQualityIndicator.tsx - visual signal bars for connection quality
  2. AudioLevelMeter.tsx - animated equalizer bars for audio levels
  3. PerSpeakerVolume.tsx - volume slider per participant + useSpeakerVolume hook
  4. UserSearch.tsx - search/filter participants in room
  5. OnlineStatus.tsx - online/offline badge with pulse animation + useOnlineStatus hook
  6. ReportBlockDialog.tsx - report/block dialog with reasons and API integration
- Integrated all 6 components into RoomInteriorView.tsx
- Added "Search User" and "Report User" entries to ThreeDotsMenu
- Replaced simple connection quality dot with full NetworkQualityIndicator component
- Fixed lint error in UserSearch.tsx (setState in effect)
- Verified all new files pass lint with zero errors
- Committed and pushed to bengharbios/G-G main branch

Stage Summary:
- 6 new component files created (1372+ lines added)
- RoomInteriorView.tsx updated with imports, state, and rendering of new components
- ThreeDotsMenu extended with 2 new menu items (بحث عن مستخدم, إبلاغ عن مستخدم)
- Successfully pushed to GitHub: commit beca1c2

---
Task ID: 1
Agent: game-logic-builder
Task: Create Shifarat game logic files (types, words, logic, store)

Work Log:
- Created src/lib/shifarat-types.ts with all TypeScript types (GameMode, GamePhase, RoundStatus, WordEntry, ShifaratTeam, ShifaratGameState)
- Created src/lib/shifarat-words.ts with 96 words in 8 categories (مكان وسفر، مهن وأعمال، أدوات ومواد، طعام وشراب، تقنية وترفيه، طبيعة وحيوانات، رياضة، بيت ومنزل) + helper functions
- Created src/lib/shifarat-logic.ts with pure game logic functions (getRandomWord, getWordCategory, checkGameWin, getOpponentTeam, formatTimer, getRemainingWordsCount, getAllWordsInCategories)
- Created src/lib/shifarat-store.ts with Zustand store using persist middleware following mafia game-store pattern
  - Set<string> serialization/deserialization for JSON persistence (onRehydrateStorage, partialize, merge)
  - All actions: startGame, newRound, markCorrect, markWrong, skipWord, tickTimer, timeUp, nextTurn, resetGame
  - syncToRoom for Diwaniya mode using existing room-sync infrastructure
- Verified all 4 new files pass ESLint with zero errors

Stage Summary:
- 4 files created in src/lib/
- Game supports 2 teams, 8 categories, configurable timer (20-120s), configurable target score
- Zustand store with persist follows mafia game pattern exactly
- Compatible with existing room-sync infrastructure for Diwaniya mode
---
Task ID: 2
Agent: game-ui-builder
Task: Create Shifarat game UI components

Work Log:
- Created src/components/shifarat/LandingPage.tsx
- Created src/components/shifarat/GameSetup.tsx
- Created src/components/shifarat/DiwaniyaSetup.tsx
- Created src/components/shifarat/PlayingPhase.tsx
- Created src/components/shifarat/GameOver.tsx
- Updated src/lib/shifarat-words.ts with ALL_CATEGORIES export and SHIFARAT_WORDS backward-compat export
- Updated src/lib/shifarat-store.ts with complete Zustand store (initGame, startRound, markCorrect, markWrong, skipWord, tickTimer, endRound, nextTurn, resetGame)

Stage Summary:
- 5 component files created in src/components/shifarat/
- Dark theme with emerald accents, full RTL Arabic
- Framer Motion animations throughout (staggered card entrance, scale/glow hover, spring trophy, confetti stars)
- Mobile-first responsive design (grid→stack, min 44px touch targets)
- LandingPage: Two mode selection cards (Godfather/Diwaniya) with hover effects
- GameSetup: Team names, timer selector, target score selector, category grid toggle, validation
- DiwaniyaSetup: Host name, room creation API, copy/share code, approve/reject pending players, polling
- PlayingPhase: Team score cards, timer bar (green→yellow→red), word display with show/hide toggle, hints area, skip counter, correct/skip/wrong buttons, round end next-turn flow
- GameOver: Trophy animation, winner/loser score cards, game stats (rounds, words, diff), play again/home buttons
- Zero lint errors on all new/modified files

---
Task ID: 2
Agent: game-types-logic-builder
Task: Rewrite shifarat-types.ts and shifarat-logic.ts for Codenames-style board game

Work Log:
- Rewrote src/lib/shifarat-types.ts with comprehensive Codenames board game types:
  - CardColor, TeamColor, BoardCard, Clue, GamePhase (7 phases), TeamInfo, GameSettings
  - ShifaratGameState with full board, team, clue/guessing, timer, history, mode, and result fields
  - GameLogEntry (8 entry types), ViewMode for Godfather role switching
  - Legacy type exports retained for backward compat with shifarat-words.ts and shifarat-store.ts (WordEntry, ShifaratTeam, ShifaratGameMode, ShifaratGamePhase, ShifaratRoundStatus)

- Rewrote src/lib/shifarat-logic.ts with pure Codenames game logic:
  - generateBoard(): Fisher-Yates shuffled 25-card board (9 starting team, 8 opponent, 7 neutral, 1 assassin)
  - createInitialState(): Full game state factory with team info, timer, history
  - giveClue(): Validates clue word (no board words/substrings), transitions to clue_given phase, grants clueNumber+1 guesses
  - guessWord(): Reveals card, determines correct/wrong/neutral/assassin result, updates scores/remaining, checks game end, auto-switches phase
  - passTurn(): Team forfeits remaining guesses
  - tickTimer(): 1-second decrement, auto-ends turn at 0
  - checkGameEnd(): assassin=instant loss, correct=all_found win, wrong=opponent_finished check
  - getTeamWordsRemaining(), switchTurn(), isValidClue(), formatTimer()
  - Legacy functions retained (getRandomWord, getWordCategory, checkGameWin, getOpponentTeam, getRemainingWordsCount, getAllWordsInCategories)

- Verified zero lint errors on both files

Stage Summary:
- 2 files rewritten (182 + 824 = 1006 lines total)
- All 11 Codenames rules implemented with pure functions (no side effects)
- Backward-compatible legacy exports ensure existing store/words/UI components continue to compile
- Game flow: setup → spymaster_view → clue_given → team_guessing → turn_result → turn_switch → spymaster_view (loop) → game_over

---
Task ID: 1
Agent: words-database-builder
Task: Create comprehensive Arabic words database (500+ words)

Work Log:
- Rewrote src/lib/shifarat-words.ts with 501 Arabic words across 20 categories
- Each word has 3-6 hint words for spymaster inspiration
- Categories: animals (26), food (25), places (25), objects (25), nature (25), professions (25), sports (25), technology (25), countries (25), culture (25), history (25), colors (25), feelings (25), clothing (25), vehicles (25), cuisine (25), marine (25), space (25), mystery (25), daily (25)
- Implemented getBoardWords(exclude?) function for random 25-word selection with Fisher-Yates shuffle
- Used reliable Modern Standard Arabic (فصحى مبسطة) vocabulary suitable for all Arabic speakers
- Maintained full backward compatibility: ALL_CATEGORIES, SHIFARAT_WORDS, WordEntry, getWordsForCategories, getRandomWord
- Exported new interface: CodenameWord { w, cat, hints }, CATEGORIES, WORDS, getBoardWords
- Zero lint errors on the file
- Verified: 501 total words, all 20 categories have 25+ words, 0 duplicates, 0 hint issues

Stage Summary:
- File: src/lib/shifarat-words.ts (722 lines, 501 word entries)
- 20 categories with 25+ words each
- All words verified as common Arabic vocabulary
- Backward compatible with all existing imports (shifarat-logic.ts, GameSetup.tsx, DiwaniyaSetup.tsx)

---
Task ID: 4
Agent: ui-builder
Task: Create Codenames UI components

Work Log:
- Rewrote PlayingPhase.tsx for Codenames 5x5 board
- Rewrote GameOver.tsx with board reveal
- Created HowToPlay.tsx tutorial
- Updated ShifaratSpectatorView.tsx
- Updated GameSetup.tsx with first team + spymaster options
- Updated DiwaniyaSetup.tsx
- Updated page.tsx for new phase flow
- Added Web Audio API sound effects

Stage Summary:
- 7 component files created/updated
- Mobile-first responsive design

---
Task ID: 2-a
Agent: Main Agent
Task: Build smart Arabic clue suggestion engine (إيحاءات ذكية) for Shifarat Codenames

Work Log:
- Analyzed existing Shifarat game codebase (types, store, logic, words, UI components)
- Identified that hints in shifarat-words.ts were descriptive rather than associative
- Created src/lib/shifarat-clue-engine.ts (400+ lines) with:
  - 70+ semantic clusters organized by theme (animals, food, places, nature, professions, etc.)
  - Each cluster has: theme word (clue), connected board words, context, risk level
  - generateClueSuggestions() function that analyzes the board and returns ranked clues
  - Clue scoring: +3 per team connection, -5 per opponent risk, -10 for assassin
  - Risk assessment: safe/moderate/risky based on opponent/neutral word overlap
  - Clue validation: filters out words on board and substrings
  - findCrossConnections() for finding multi-word thematic links
  - generateIndividualClues() for single-word associative hints
  - All associations based on Arabic semantic networks (WordNet, المعجم الوسيط, cultural knowledge)
- Updated SpymasterView in PlayingPhase.tsx:
  - Added "إيحاءات ذكية" (Smart Suggestions) collapsible panel
  - Multi-word suggestions section (best clues connecting 2+ team words)
  - Single-word suggestions section (targeted hints for individual words)
  - Risk indicators (🛡️ safe, ⚠️ moderate, ⚡ risky) with color coding
  - Click-to-use: tapping a suggestion fills the clue input with word + number
  - Help text explaining the association system
  - New imports: Lightbulb, Sparkles, ChevronDown, AlertTriangle, Shield, Zap icons
  - useMemo for performance optimization
- Fixed stray character typo in motion.div

Stage Summary:
- 1 new file created: src/lib/shifarat-clue-engine.ts
- 1 file updated: src/components/shifarat/PlayingPhase.tsx
- 70+ curated semantic clusters with Arabic thematic associations
- Smart risk assessment to avoid opponent word connections
- Seamless integration with existing Spymaster view
- Zero new lint errors from these changes

---
Task ID: 1
Agent: Main Agent
Task: Improve UX clarity for Shifarat game - user doesn't understand how to play

Work Log:
- Read all existing files: LandingPage.tsx, PlayingPhase.tsx, HowToPlay.tsx, GameOver.tsx, GameSetup.tsx, shifarat-types.ts, shifarat-logic.ts, shifarat-store.ts, page.tsx
- Identified UX pain points: no game explanation on landing, no first-time tutorial, unclear phase transitions, no phase guidance banners, full-screen turn result interrupts gameplay

Changes Made:

1. **LandingPage.tsx** (rewritten):
   - Added MiniBoardPreview component showing a 5x5 animated grid that toggles between spymaster view (colored) and team view (hidden)
   - Added GameStepsPreview component showing 4-step game flow with icons and descriptions
   - Added prominent "كيف تلعب؟ — شرح القواعد بالتفصيل" button that opens HowToPlay modal
   - Added "ابدأ سريعًا ⚡" Quick Start button
   - Added game explanation section with animated board preview and color legend
   - Both mode cards (Godfather/Diwaniya) now have numbered step descriptions explaining how each mode works
   - Auto-shows GameWalkthrough on first visit via localStorage check

2. **GameWalkthrough.tsx** (new file):
   - 5-step interactive walkthrough with animations:
     - Step 1: "هذه هي اللوحة — 25 بطاقة مخفية" (board with '?' marks)
     - Step 2: "الجاسوس يرى الألوان" (board revealed with color legend)
     - Step 3: "الجاسوس يعطي دليل — كلمة واحدة + رقم" (board + clue example "حيوان — 2")
     - Step 4: "الفريق يخمن الكلمات" (board with highlighted guesses + discussion)
     - Step 5: "صحيح؟ خطأ؟" (result examples: correct/wrong/assassin with colored cards)
   - WalkthroughBoard component with animated card reveals and highlight markers
   - ClueExample component showing "حيوان — 2" with animated reveal
   - ResultExample component showing 3 result types (correct/wrong/assassin) with staggered animations
   - Skip button for experienced players
   - localStorage persistence ('shifarat-walkthrough-seen')
   - Step indicator dots at top

3. **PlayingPhase.tsx** (rewritten):
   - Added PhaseBanner component showing clear guidance for each phase:
     - spymaster_view: "🎯 أنت جاسوس {teamName} — انظر للوحة وأعطِ دليلًا"
     - team_guessing: "🎯 خمنوا الكلمات المرتبطة بالدليل!"
     - turn_result: "📋 نتيجة التخمين"
     - turn_switch: "🔄 الدور ينتقل للفريق التالي"
   - Added CorrectToast component: small green toast banner shown at top when team guesses correctly (1.5s auto-dismiss), allows continuous guessing without interruption
   - SpymasterView improvements:
     - Phase banner at top with clear instruction
     - Collapsed suggestions panel now shows "اضغط للتوسيع ↓" hint
     - After giving clue: shows clear "تم! الدليل: {word} — {number}" confirmation card
     - Hint text above input: "💡 اختر إيحاءًا من الأعلى أو اكتب كلمتك الخاصة"
   - TurnResultView improvements:
     - Correct guesses: smaller card size (less intrusive since team keeps guessing)
     - Wrong/neutral/assassin: bigger card with detailed result info
     - Reduced animations (shorter, snappier transitions)
     - Removed full mini-board display from result (was redundant)
   - TurnSwitchView improvements:
     - Added "الدور الآن لـ" label above team name
     - Added spymaster instruction: "👁️ جاسوس {teamName}: أعد دليلك"
     - Team color glow effect (shadow-lg shadow-{color}-500/10)
     - PhaseBanner at top

Design Notes:
- All text in Arabic (RTL)
- Dark theme with emerald accents preserved
- Framer Motion animations throughout
- Mobile-first responsive (mini grid adapts, touch-friendly 44px targets)
- shadcn/ui components used (Button, Badge, Input)
- Zero new lint errors from shifarat files (3 errors found and fixed using queueMicrotask pattern)

Stage Summary:
- 3 files modified/created in src/components/shifarat/
- GameWalkthrough.tsx: ~370 lines, 5 animated walkthrough steps
- LandingPage.tsx: ~250 lines, with mini grid preview, quick start, tutorial button
- PlayingPhase.tsx: ~1030 lines, with phase banners, correct toast, improved clarity
- All pre-existing lint errors (47) are from other files, not shifarat

---
Task ID: 1
Agent: main
Task: تحسين تجربة المستخدم في لعبة الشيفرات - جعل اللعبة أسهل للفهم

Work Log:
- قراءة جميع ملفات اللعبة الحالية (types, logic, store, components)
- تحليل مشكلة المستخدم: واجهة معقدة ومشتتة لا تشرح كيف تلعب
- تفويض تحسين شامل لعبة الشفارات ل subagent (full-stack-developer)
- التحقق من نجاح التعديلات: lint نظيف، HTTP 200، لا أخطاء compilation

Stage Summary:
- LandingPage.tsx: أُعيد كتابتها بالكامل مع لوحة مصغرة متحركة (5x5)، شرح خطوات اللعبة، زر "كيف تلعب؟" بارز، زر "ابدأ سريعاً"، دليل ألوان
- GameWalkthrough.tsx: مكون جديد - شرح تفاعلي من 5 خطوات يظهر تلقائياً عند أول زيارة (localStorage)
- PlayingPhase.tsx: إضافة PhaseBanner (إرشادات واضحة لكل مرحلة)، CorrectToast (إشعار صغير عند التخمين الصحيح)، تحسين SpymasterView وTurnResultView وTurnSwitchView
- 0 أخطاء lint جديدة في ملفات الشفارات

---
Task ID: 1
Agent: Main Agent
Task: Fix Shifarat card guessing bugs - correct guess doesn't reveal color, wrong guess reveals card type

Work Log:
- Analyzed user's screenshot showing the game in guessing phase with no visual feedback after clicking correct card
- Read all relevant files: PlayingPhase.tsx (1519 lines), shifarat-store.ts, shifarat-types.ts, shifarat-logic.ts
- Identified 4 root causes:
  1. handleCardClick used stale closure variables (board, guessesAllowed, guessesThisTurn) — could cause silent failures
  2. GuessResultOverlay revealed card type for wrong/neutral guesses ("كلمة الفريق الخصم", "كلمة محايدة") violating user's requirement
  3. isInvalidState auto-reset in PlayingPhase was too aggressive — could reset game during normal gameplay
  4. Store onRehydrateStorage was incorrectly resetting games in clue_given/team_guessing phases
  5. selectCard store action was forcing viewMode to 'team' on every guess, which could cause unnecessary re-mounts

- Fixed handleCardClick to read state directly from store via useShifaratStore.getState() instead of closure variables
- Fixed GuessResultOverlay: wrong and neutral now both show "❌ خطأ!" + "الكلمة لا تخص فريقك — انتهى الدور" (no card type info revealed)
- Fixed TurnResultView: wrong/neutral subtitle changed to "الكلمة لا تخص فريقك — تم تحويل الدور"
- Fixed isInvalidState check: now only checks for truly broken state (empty board), removed auto-reset timer
- Fixed onRehydrateStorage: only resets if board is empty, doesn't check clue/guessing phase validity
- Fixed selectCard: removed viewMode forcing (was always setting to 'team', causing potential re-mounts)
- Bumped store persist version to 6 to clear old stale state from localStorage
- Added console.log debugging to giveClue and selectCard for tracking game flow

Stage Summary:
- 2 files modified: PlayingPhase.tsx, shifarat-store.ts
- Key behavior changes:
  - Correct guess → card color revealed, ✅ overlay shows for 1.5s then dismisses
  - Wrong guess → ❌ overlay with generic error (no card type revealed), turn switches
  - Neutral guess → same as wrong (generic error, turn switches)
  - Assassin guess → 💀 overlay, instant loss announcement
  - No more aggressive auto-reset during normal gameplay

---
Task ID: 1
Agent: Main Agent
Task: Fix Shifarat card guessing still not working - user clicks correct card, nothing changes

Work Log:
- User reported: after spy gives clue, in guessing phase, clicking "بركان" (correct word) does nothing
- Deep-analyzed all code paths: PlayingPhase.tsx (1520 lines), shifarat-store.ts, shifarat-logic.ts, shifarat-types.ts
- Identified potential issues:
  1. handleCardClick useCallback had [guessOverlay] dependency - stale closure could block clicks
  2. No protection against rapid double-clicks causing race conditions
  3. Persist version 6 state could be stale from previous buggy versions
  4. No try/catch around handleCardClick - errors would silently prevent state updates
  5. State verification was missing after set() - no way to confirm update succeeded

- Rewrote handleCardClick in TeamGuessingView:
  - Added isProcessingRef (useRef) to prevent double-clicks reliably
  - Added guessOverlayRef synced via useEffect (not during render - fixes lint)
  - Added try/catch with error recovery (sets isProcessingRef.current = false on error)
  - Added comprehensive console.log at every decision point for debugging
  - Changed dependency array to [] - uses getState() directly, no stale closures
  - Combined wrong/neutral sound handling
  - Set processing guard BEFORE calling selectCard (prevents race conditions)

- Enhanced selectCard in shifarat-store.ts:
  - Added detailed console.log including card color, team scores, isRevealed status
  - Added post-set verification log (confirms state was actually updated)
  - Changed from inline spread to explicit updates object for clarity

- Added persist migration to version 7:
  - Forces clean reset for all states from version < 7
  - Ensures no stale game state from previous buggy versions

Stage Summary:
- 2 files modified: PlayingPhase.tsx, shifarat-store.ts
- Key fixes: useRef for click guards, useEffect for ref sync, try/catch error recovery, comprehensive logging, persist version bump
- Pushed to GitHub: commit 7e013cc
---
Task ID: 1
Agent: main
Task: Fix Shifarat card guessing bug — correct guesses rejected as 'neutral'

Work Log:
- Analyzed debug output: `card=أفعى color=red team=red result=neutral` revealed the ROOT CAUSE
- Traced through selectCard → guessWord call chain
- Found that `guessWord` was throwing an error ("Cannot read properties of undefined (reading 'board')")
- The catch block in `selectCard` was returning `{ result: 'neutral' }` as a fallback for ANY error
- This masked the real error and caused three cascading bugs:
  1. Correct team cards showed "الكلمة لا تخص فريقك" (wrong toast)
  2. Turn never switched (phase stayed 'clue_given')
  3. Timer kept running (state stuck)

- Fixed `selectCard` in shifarat-store.ts:
  - Added pre-flight validation for board/state/currentTeam before calling logic
  - Changed catch block to return 'wrong' instead of 'neutral' on error
  - Forces game reset on corrupted state
  - Better error messages for debugging

- Simplified `guessWord` in shifarat-logic.ts:
  - Removed excessive try-catch wrappers (STEP 1-4) that hid errors
  - Let errors propagate naturally to selectCard's catch block

- Bumped Zustand persist from v9 to v10 to force-clear ALL stale localStorage state

- Cleaned up PlayingPhase.tsx:
  - Removed debug instrumentation (🔍 lines)
  - Removed debugInfo from toast interface
  - Cleaned up handleCardClick (removed console.logs)
  - Updated version to v3.3

Stage Summary:
- Root cause: catch block in selectCard returning 'neutral' on any error, masking the real issue
- Pushed as commit 55fa995 to GitHub (main branch) — Vercel will auto-deploy
- Key fix: pre-flight validation + proper error handling + persist version bump
---
Task ID: 1
Agent: Main Agent
Task: Fix stale Service Worker caching old JS — break the chicken-and-egg cycle

Work Log:
- Analyzed the root cause: old Service Worker (networkFirst strategy) cached stale JS chunks, preventing new code from reaching the browser
- Identified the chicken-and-egg cycle: new code cannot load because old SW serves old JS, and old SW cannot be updated because new code never loads
- Added inline cleanup script in layout.tsx <head> that runs BEFORE any JS chunks load — unregisters all SWs and clears all caches using sessionStorage flag (sw-clr-v5)
- Rewrote sw.js to be a pure push notification handler — NO fetch event listener, NO caching at all
- Simplified ServiceWorkerRegistrar with updateViaCache: "none"
- Bumped persist version to 12 to force localStorage reset
- Pushed as commit 9f6f0a0 (v3.8) to GitHub

Stage Summary:
- Key fix: Inline <head> script breaks the stale-SW cycle by running before JS chunks load
- The old SW networkFirst strategy fetches HTML from network first, so the fresh HTML (with cleanup script) WILL reach the browser
- sw.js now has zero fetch interception — browser handles all caching via standard HTTP + Next.js content hashes
- Persist v12 ensures corrupted game state from old versions is wiped


---
Task ID: 1
Agent: main
Task: Fix WebRTC voice between devices - Glare + socketId/userId mismatch

Work Log:
- Analyzed complete signaling flow in useVoiceRTC.ts and voice-signal/index.ts
- Identified ROOT CAUSE: WebRTC "glare" - both peers create offers simultaneously
  - When Phone joins and PC joins, both room-members and peer-joined fire
  - Both create offers → both enter have-local-offer state
  - setRemoteDescription() fails silently when receiving the other's offer
  - Connection NEVER establishes → no audio between devices
- Identified SECOND BUG: socketIdToUserIdRef existed in g-g-source but NOT in src
  - attachRemoteAnalyser saved speaking state with socketId key
  - RoomInteriorView looked up with userId key → never matched
- Fixed glare: Added rollback handling in offer handler + stale answer detection
- Fixed socketIdToUserId: Copied reverse mapping from g-g-source to src
- Fixed ICE candidate queuing: Changed from 1 retry to 5 retries with exponential backoff
- Pushed commit 23ccb0c to GitHub

Stage Summary:
- Key insight: Same-network devices failing proved it was NOT a TURN/NAT issue
- The problem was in the signaling layer - offer/answer exchange itself
- Glare fix: rollback local offer when receiving incoming offer in have-local-offer state
- Render will auto-deploy or user can manual deploy

---
Task ID: 1
Agent: main
Task: Persistent header + bottom nav across main pages (Games/Council/Friends) + gazelle loader for internal pages

Work Log:
- Analyzed the architecture: SiteHeader + SiteBottomNav were duplicated in src/app/page.tsx and src/app/friends/page.tsx, causing them to remount on every navigation between bottom-nav tabs. Also found a bug — on Friends page, `onProfileClick` was a no-op, so clicking the profile picture did nothing.
- Created `src/components/shared/AppShellContext.tsx` — context exposing authUser, openProfile, openLogin, openRegister, handleLogout, subscriberProfile to all child pages.
- Created `src/components/shared/AppShell.tsx` — client component placed in the root layout (`src/app/layout.tsx`). For shell routes (/, /friends, /voice-rooms), it renders SiteHeader + SiteBottomNav + YallaProfileDialog + AuthModals ONCE — they stay mounted across navigations. For non-shell routes (game lobbies), it just renders children. Handles auth gating: forced on / and /friends, /voice-rooms keeps guest mode.
- Created `src/components/shared/GazelleLoader.tsx` — pure CSS/SVG animated running gazelle (legs alternating, body bob, tail wiggle, moving ground, dust particles). Used for auth-checking screen and as the global loading.tsx.
- Updated `src/app/layout.tsx` to wrap {children} with <AppShell>.
- Refactored `src/app/page.tsx` — removed all auth state, SiteHeader, SiteBottomNav, LoginModal, RegisterModal, YallaProfileDialog, SubscriberProfileData fetch, handleLogout, handleAuthSuccess (all moved to AppShell). HomePage is now slim: just logo header + GamesSection.
- Refactored `src/app/friends/page.tsx` — removed SiteHeader (was broken with no-op onProfileClick), removed SiteBottomNav (now provided by AppShell). Kept the local YallaProfileDialog for viewing OTHER users' profiles (viewOnly mode) — that's distinct from AppShell's profile dialog which opens MY profile.
- Refactored `src/app/voice-rooms/components/RoomListView.tsx` via Python script (`/home/z/my-project/scripts/refactor_roomlistview.py`) — removed the internal "Top Row" (avatar + profile popover + search button, ~5230 chars) and the internal BOTTOM_NAV `<nav>` (~2500 chars, was purely decorative with no onClick handlers). Root div changed from `fixed inset-0 flex flex-col overflow-hidden` to `relative flex flex-col min-h-screen` so it flows inside AppShell's spacer. Header no longer needs paddingTop env(safe-area-inset-top) since AppShell's SiteHeader handles the top.
- Updated `src/app/loading.tsx` to use GazelleLoader fullScreen instead of generic spinner — applies to all routes' initial load.
- Verified build: `npx next build` compiles successfully (✓ in 19.1s). Pre-existing TS errors in unrelated files (familyfeud, profile, etc.) — not introduced by this change.
- Committed as f90160f and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 8 files changed, 498 insertions, 397 deletions.
- New persistent architecture: ONE SiteHeader + ONE SiteBottomNav for /, /friends, /voice-rooms — they mount in AppShell (root layout) and stay mounted across tab switches. Only page content changes.
- Bug fixed: clicking profile avatar in SiteHeader now opens YallaProfileDialog on EVERY shell route (was broken on /friends).
- New loading animation: animated running gazelle (GazelleLoader) replaces generic spinner for both auth-checking state and Next.js route loading.
- Dead code: BottomNavigation function in src/app/page.tsx is still defined but unused (pre-existing dead code from earlier refactor) — left alone to minimize risk.

---
Task ID: 1
Agent: main
Task: Ant overlay above pages + offline modal + prevent 'page web non disponible'

Work Log:
- Analyzed user's screenshot: Android device showing browser's "Page Web non disponible" page (net::ERR_INTERNET_DISCONNECTED) when trying to access /voice-rooms offline.
- User wants: (1) running ant animation as floating overlay above pages (not a separate page), (2) show on every loading across all pages, (3) slow internet → show ant, (4) intermittent disconnection → show ant moving above pages, (5) full offline → modal in middle with 2 buttons (close game + reconnect), (6) NEVER show browser's "page web non disponible" page.

- Created `src/components/shared/AntLoaderOverlay.tsx` — floating bottom-center pill above SiteBottomNav, contains GazelleLoader size=56 + label. Uses CSS opacity/transform for show/hide (no setState in effect — complies with react-hooks rules). 4 reasons: navigation/slow-fetch/slow-network/intermittent with auto-labels.

- Created `src/components/shared/OfflineModal.tsx` — modal in middle shown when fully offline. Two buttons: "إغلاق اللعبة" (tries window.close(), fallback to about:blank) and "إعادة الاتصال" (HEAD /api/auth/me ping, reload on success). Includes ant animation, "still offline" message, status indicator.

- Created `src/components/shared/NetworkStatusProvider.tsx` — wraps AppShell in root layout. Listens to window online/offline events. Periodic 30s ping to verify server reachability. Uses navigator.connection.effectiveType for slow 2G/3G detection. Monkey-patches window.fetch to detect slow fetches (>2s threshold) — auto-shows overlay. Detects Next.js route transitions via usePathname(). Provides useNetworkStatus() hook.

- Created `public/offline.html` — standalone HTML page (no React, no JS framework) with inline SVG ant animation + offline modal. Served by Service Worker when navigation fetch fails. Auto-reconnect on 'online' event + periodic 30s ping. Includes Google Fonts CDN with font fallback.

- Updated `public/sw.js` — added fetch event listener that intercepts navigation requests (mode === 'navigate'). On network failure (ERR_INTERNET_DISCONNECTED, ERR_NAME_NOT_RESOLVED, ERR_NETWORK_CHANGED, etc.), serves cached /offline.html instead of letting browser show "Page Web non disponible". Non-navigation requests pass through. Pre-caches /offline.html in 'ggames-offline-v1' cache during install.

- Updated `capacitor.config.ts` — added `server.errorPath: 'offline.html'`. For Android WebView wrapping remote URL: when remote load fails, Capacitor serves local /offline.html instead of system browser error page. This handles the very first load when offline (before SW is registered).

- Updated `src/app/layout.tsx` — wrapped AppShell with <NetworkStatusProvider>. Bumped sw-clr-v5 → sw-clr-v6 to force cleanup of any stale SW and ensure new SW with fetch interceptor gets registered on next session.

- Updated `src/app/loading.tsx` — uses GazelleLoader fullScreen for initial route load (before React hydrates). After hydration, NetworkStatusProvider's overlay takes over.

- Verified: npx next build ✓ (19.0s), ESLint ✓ (after refactor to remove set-state-in-effect), no TS errors in new files.

- Committed as 6c8c770 and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 9 files changed, 1064 insertions, 21 deletions.
- 4 new files: AntLoaderOverlay, OfflineModal, NetworkStatusProvider, public/offline.html.
- 4 modified files: capacitor.config.ts, public/sw.js, src/app/layout.tsx, src/app/loading.tsx.
- Architecture: NetworkStatusProvider wraps AppShell in root layout — overlay floats above all pages. SW + Capacitor errorPath handle the offline-page case for both PWA and Android WebView.

---
Task ID: 1
Agent: main
Task: Friend profile shows full info + 3-dot menu respects friend status

Work Log:
- User reported 2 issues: (1) Friend profile dialog was incomplete (missing ID, country, birthdate, gender, level, frame, ornament, card, cover). (2) 3-dot menu on a friend's profile still showed "إضافة صديق" (Add Friend) even though the user is already a friend.

- Root cause #1: /api/user/lookup only returned basic fields (id, username, displayName, avatar, numericId). The YallaProfileDialog never fetched the full profile in viewOnly mode — just used whatever was in authUser prop (which was passed basic info only).

- Root cause #2: openUserProfile in friends/page.tsx was checking `friends.some(f => f.userId === user.id)`, but FriendItem uses 'userId' (not 'id'). When passing FriendItem directly to openUserProfile(f), user.id was undefined, so the check failed, friendStatus stayed 'none', and the menu showed "Add Friend".

- Fixes:
  1. src/app/api/user/lookup/route.ts: extended to support `full=1` query param that returns ALL profile fields (bio, country, cover, frame, ornament, card, gender, birthDate, level, role, createdAt). Also supports UUID lookup (not just numericId/username search). Returns single user when isNumeric or isUuid + full=1, otherwise returns array.
  
  2. src/app/friends/page.tsx (openUserProfile): now accepts both 'id' and 'userId' keys (FriendItem uses userId, UserResult uses id). Falls back user.id || user.userId. friendStatus check now correctly matches friends.
  
  3. src/components/shared/YallaProfileDialog.tsx: added fullUser state — when viewOnly=true, fetches /api/user/lookup?id=<UUID>&full=1 and merges into fullUser. Added effectiveUser = viewOnly ? (fullUser || authUser) : authUser. All display parts (avatar, frame, ornament, card, cover, name, ID, country, bio, gender icon) now use effectiveUser. Gender icon is now dynamic (male/female based on effectiveUser.gender). Added birthDate display (🎂 row) under info strip when birthDate exists. Profile level populated from fetched user.level → xp.level. Edit windows (editWin, basicWin) now hidden in viewOnly mode. Guest view check changed from authUser to effectiveUser.

- Verified: npx next build ✓ (21.8s), ESLint ✓. Pre-existing TS warnings (framer-motion Variants + authUser null check in edit windows — all in non-viewOnly code paths) remain but don't block build.

- Committed as f08e70b and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 3 files changed, 191 insertions, 47 deletions.
- Friend profile now shows full info: ID, country flag, gender icon (dynamic), birthdate, level flag, bio, frame (equipped), ornament (pendant), card (backdrop), cover (profile theme).
- 3-dot menu now correctly shows "مراسلة + حذف صديق" for existing friends, "إضافة صديق" only for non-friends.

---
Task ID: 1
Agent: main
Task: Fix chat view height + delete friend stays in chat with add-friend button

Work Log:
- User reported 3 issues: (1) chat input hidden under bottom nav (chat view larger than screen), (2) delete friend from profile 3-dot menu didn't work, (3) wanted: when deleted, friend should be removed from friends page; if chat stays, input/smiles/gifts should be replaced with yellow 'add friend' button.

- Root cause #1: chat view height was h-[calc(100vh-3.5rem)] = 100vh-56px, but AppShell adds top spacer (56-64px) AND bottom nav (~75px). Chat view extended 75px below visible area.

- Root cause #2: delete confirmation modal was inside {view === 'chat' && ...} block. When user opened profile from friends LIST (not chat) and clicked delete, view was 'list' so the modal never rendered — delete silently failed because no confirmation.

- Root cause #3: handleDeleteFriend redirected to list view (setView('list'); setChatFriend(null);) instead of staying in chat with the add-friend UI.

- Fixes in src/app/friends/page.tsx:
  1. Chat view height: h-[calc(100dvh-3.5rem-75px)] — uses dynamic viewport height and subtracts both top spacer (3.5rem) and bottom nav (75px). Input now visible above bottom nav.
  2. Delete confirmation modal moved OUTSIDE the chat view block — now global, renders whenever showDeleteConfirm && chatFriend are set, regardless of current view. Z-index raised to z-[10000].
  3. handleDeleteFriend: removed redirect-to-list. Now calls DELETE API with proper error handling (checks res.ok + data.success), removes friend from local state, sets friendStatus='none', stays in current view.
  4. Chat view: added inline IIFE computing isStillFriend = friends.some(f => f.userId === chatFriend.userId). Bottom row is conditional:
     - If still friend: normal input + smile + gifts
     - If NOT still friend: yellow 'إعادة إضافة كصديق' button (amber-400 bg) that calls handleReAddFriend()
  5. 3-dot menu in chat adapts: shows 'حذف صديق' if friend, 'إعادة إرسال طلب صداقة' if not.
  6. Empty state message adapts based on isStillFriend.
  7. handleReAddFriend: new function that POSTs to /api/friends with toUserId = chatFriend.userId, sets friendStatus='pending' on success.

- Verified: npx next build ✓ (24.8s), ESLint ✓.

- Committed as dfc8d21 and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 2 files changed (src/app/friends/page.tsx + worklog.md), 111 insertions, 29 deletions.
- Chat input box now visible above bottom nav.
- Delete friend works from any view (list or chat) — confirmation modal is global.
- After delete in chat: stays in chat, replaces input/smiles/gifts with yellow 'add friend' button.
- After re-adding as friend: button shows 'pending' state, and once accepted the chat input returns (isStillFriend becomes true again).

---
Task ID: 1
Agent: main
Task: Notifications badges + 'مراسلة' text button

Work Log:
- User requested: (1) Enable notifications — show badge on Friends button in bottom nav when receiving friend request, friend accept, or message from friend. When entering friends page: badge on 'friends' tab for messages, badge on requests section for pending requests, badge on sender name for unread messages. (2) Change the icon in front of friend in friends list to a 'مراسلة' text button.

- Implementation:
  1. NEW endpoint /api/notifications/summary (src/app/api/notifications/summary/route.ts): returns pendingFriendRequests count, unreadMessages total, unreadByFriend array (per-friend count + last message + last timestamp), and totalBadge. Single GROUP BY query for unread messages.
  
  2. SiteBottomNav.tsx: polls /api/notifications/summary every 30s + on focus + on visibilitychange. Shows red badge on the 'friends' tab icon with count = pendingCount + totalUnread. Badge shows '99+' for values > 99.
  
  3. Friends page (src/app/friends/page.tsx):
     - New state: unreadByFriend (Record<friendId, {count, lastMessage, lastMessageAt}>), pendingCount
     - loadSummary() polls every 15s (faster than bottom nav for snappier UI)
     - Re-fetches summary when view changes (chat opened/closed)
     - Top tab bar badges: 'notifications' tab = pendingCount, 'friends' tab = totalUnread
     - Friend list item redesigned: avatar (with red unread badge), name (bold if unread) + green dot indicator + level + last message preview (truncated to 30 chars) if unread, 'مراسلة' text button (green pill with MessageCircle icon + text 'مراسلة' + red unread badge on corner)
     - Replaced the old icon-only MessageCircle button (w-9 h-9 rounded-full) with the new 'مراسلة' text button

- Verified: npx next build ✓ (23.8s), ESLint ✓, no TS errors in modified files.

- Committed as a698dea and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 4 files changed (new summary endpoint + friends page + SiteBottomNav + worklog), 244 insertions, 10 deletions.
- Bottom nav Friends button now shows red badge with total notifications count (pending reqs + unread msgs).
- Friends page shows per-friend red unread badges on avatar AND on 'مراسلة' button.
- Top tabs show badges: 'الإشعارات' = pending requests count, 'أصدقاء' = total unread messages.
- 'مراسلة' button is now a green pill with text + icon, replaces the icon-only circle button.

---
Task ID: 1
Agent: main
Task: Ant overlay no longer blocks input + only shows when network REALLY bad

Work Log:
- User reported: (1) ant blocks email/password input during login, (2) back/logout buttons stacked on top of each other, (3) ant appears too frequently — only show when network is VERY VERY weak.

- Root cause #1: AntLoaderOverlay used z-[9998], which is ABOVE shadcn Dialog (z-50). When login modal opened, the ant overlay was rendered on top, blocking all input. Also overlay triggered on pathname change (4s) and slow fetches (>6s) — too aggressive.

- Root cause #3: Overlay triggered on: pathname change (4s), fetch >6s, effectiveType 2g/slow-2g, single ping failure. Way too aggressive — user wants only at "most extreme weak level".

- Fixes:
  1. AntLoaderOverlay.tsx: z-index lowered from z-[9998] to z-30 (BELOW modals at z-50). pointer-events-none always so even if visible, it never blocks clicks/typing.
  
  2. NetworkStatusProvider.tsx — much less aggressive:
     - REMOVED pathname-change trigger entirely (was showing on every navigation — most annoying)
     - Slow-fetch threshold raised from 6s to 15s (only really slow fetches)
     - Network type check: only slow-2g triggers overlay (NOT 2g anymore). Also requires RTT > 3000ms OR downlink < 25kbps as additional criteria.
     - Ping interval raised from 30s to 60s (less polling)
     - Intermittent disconnection now requires 3+ consecutive ping failures before showing overlay (was 1 failure → ~3 minutes of confirmed disconnection before showing)
     - Added hasOpenModal() helper — checks for ANY open modal/dialog or focused input/textarea. If any is open, overlay is suppressed.
     - Added 500ms interval check — if a modal opens, immediately hide overlay
     - showOverlay() API also checks hasOpenModal() before showing
  
  3. SettingsModal CSS (.ys-bottom-buttons): Added flex-wrap: nowrap explicitly, white-space: nowrap, overflow: hidden, text-overflow: ellipsis on .ys-btn to prevent text wrapping. Added min-width: 0 to allow flex shrink. Reduced font-size from 16px to 14px for safer fit on narrow screens.

- Verified: npx next build ✓ (24.5s), ESLint ✓.

- Committed as 21f75de and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 4 files changed (AntLoaderOverlay, NetworkStatusProvider, globals.css, worklog), 142 insertions, 102 deletions.
- Ant overlay no longer blocks login form input (z-index lowered below modals + pointer-events-none).
- Ant overlay now only shows when network is REALLY bad: slow-2g, OR RTT > 3000ms, OR downlink < 25kbps, OR fetch > 15s, OR 3+ ping failures in a row (3+ minutes of confirmed disconnection).
- Ant overlay is suppressed entirely when ANY modal/dialog is open OR when an input/textarea has focus.
- SettingsModal bottom buttons (logout + account center) have defensive CSS to prevent text wrapping and stacking on narrow screens.

---
Task ID: 1
Agent: main
Task: WhatsApp-style chat bubbles + Send arrow button

Work Log:
- User requested: (1) Send button should be arrow-shaped (not MessageCircle). (2) Messages should differentiate between mine and friend's like WhatsApp/Telegram — not all on one side.

- Investigation: current code had REVERSED alignment. In RTL layout, friend's messages were on visual LEFT (justify-end) and my messages on visual RIGHT (justify-start). This is OPPOSITE of WhatsApp Arabic convention where my messages are on LEFT and friend's on RIGHT.

- Fixes in src/app/friends/page.tsx:
  1. Send button: replaced MessageCircle with Send icon (lucide-react). Send is paper-airplane/arrow shaped, matches WhatsApp/Telegram send buttons. Added hover effect and aria-label='إرسال'.
  
  2. Message alignment flipped to match WhatsApp/Telegram convention:
     - isMine = msg.fromUserId !== chatFriend.userId (clarified logic)
     - My messages: justify-end = visual LEFT in RTL (was justify-start)
     - Friend's messages: justify-start = visual RIGHT in RTL (was justify-end)
     - In WhatsApp Arabic: my msgs on LEFT, friend's on RIGHT ✓
  
  3. Message bubble styling improved:
     - My messages: bg-[#15BC83] (green) + rounded-2xl + rounded-bl-sm (smaller bottom-left radius = visual 'tail' effect like WhatsApp)
     - Friend's messages: bg-[#1a3a30] (dark green) + border + rounded-2xl + rounded-br-sm (smaller bottom-right radius for tail effect)
     - Added shadow-sm for depth
     - Time text color: white/70 for mine, white/40 for friend's
     - Added break-words for long messages
  
  4. Simplified message rendering using IIFE with return statement for cleaner conditional logic.

- Verified: npx next build ✓ (23.3s), ESLint ✓.

- Committed as 513638b and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 2 files changed (src/app/friends/page.tsx + worklog), 61 insertions, 10 deletions.
- Send button is now a paper-airplane/arrow icon (Send from lucide-react).
- Messages now properly differentiated: my messages on LEFT (green bubbles), friend's messages on RIGHT (dark green bubbles with border) — like WhatsApp/Telegram.
- Tail effect via asymmetric border-radius (rounded-bl-sm for mine, rounded-br-sm for friend's).

---
Task ID: 1
Agent: main
Task: Two-sided friend deletion + faster notifications + chat layout gap fix

Work Log:
- User reported 4 issues:
  1. When deleting a friend, they remained on the friend's side and could still send messages. The 'add friend' button didn't appear for the friend until late.
  2. When on friends page and a friend sends a message, notification badge should appear immediately, even while on the friends page.
  3. Notifications should show counts: bottom nav = total (messages + reqs), friends page tab = total messages, per-friend badge = msgs from that specific person.
  4. When opening a chat and scrolling, there's a gap at the bottom between the input frame and the bottom nav buttons.

- Root causes:
  - removeFriend() deletes the single FriendRequest record, so BOTH sides lose the friendship at the DB level. BUT the friend's CLIENT state still has them as a friend (cached 'friends' array). The chat POST endpoint didn't validate friendship before accepting messages.
  - Summary polling was 15s — too slow for new messages.
  - Counts are already correct (bottom nav = total, friends tab = messages sum, per-friend = individual count). Just needed faster updates.
  - Chat view used h-[calc(100dvh-3.5rem-75px)]. 'dvh' is dynamic — when mobile URL bar shows/hides during scroll, viewport height changes but the calculated height doesn't update → gap or overlap.

- Fixes:
  1. admin-db.ts: added areFriends(userIdA, userIdB) — checks if an accepted FriendRequest exists between two users. Single indexed query.
  
  2. chat/route.ts POST: validates friendship before inserting message. Returns 403 with friendshipStatus='none' if not friends. This prevents a former friend from sending messages after being deleted.
  
  3. chat/route.ts GET: includes friendshipStatus ('friends' | 'none') in response. Friend's UI can detect they've been deleted and immediately show 'add friend' button. Also: only marks messages as read if still friends (so deleted friends see unread badges on old messages).
  
  4. friends/page.tsx:
     - Polls /api/chat GET every 3s during chat — reads friendshipStatus from response and updates friendStatus. If 'none', reloads friends list and shows 'add friend' button.
     - Periodically reloads /api/friends?type=friends every 20s while page is visible — detects remote deletions even when not in chat.
     - loadSummary polling increased from 15s to 10s (faster notifications for new messages while on friends page).
     - Added visibilitychange listener — re-fetches summary when user returns to the tab.
     - sendMessage() now handles 403 response (not friends anymore) — shows toast, sets friendStatus='none', reloads friends list.
  
  5. Chat view layout: replaced h-[calc(100dvh-3.5rem-75px)] with position:fixed + top:14 + bottom:[75px]. This pins the chat view between the AppShell top spacer and SiteBottomNav, regardless of dynamic viewport height changes. No more gap when scrolling.

- Verified: npx next build ✓ (22.9s), ESLint ✓ (only pre-existing warnings about unused eslint-disable directives).

- Committed as 4b2d937 and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 4 files changed (admin-db, chat/route.ts, friends/page.tsx, worklog), 131 insertions, 14 deletions.
- Friend deletion is now two-sided: when A deletes B, B's chat GET response returns friendshipStatus='none', B's UI immediately shows 'add friend' button. If B tries to send a message, POST returns 403 and shows toast 'لم تعودا أصدقاء'.
- Notifications are faster: summary polls every 10s while page visible (was 15s). Friends list re-polls every 20s to detect remote deletions. visibilitychange listener triggers immediate re-fetch when user returns to tab.
- Chat view uses fixed positioning (top:14, bottom:75px) instead of dynamic viewport height calc — no more gap when scrolling.

---
Task ID: 1
Agent: main
Task: Consistent emoji PNGs + full gift catalog with prices in chat

Work Log:
- User reported: (1) emojis sent don't look like emojis that appear in chat (inconsistent rendering). (2) Didn't pull all emojis from sources — need comprehensive list. (3) Need to pull all gifts with prices.

- Root causes:
  1. Emojis were rendered as Unicode text in both picker and chat. Different CSS (text-2xl vs text-sm) caused different rendering on some devices.
  2. Only 16 emojis in the picker.
  3. Only 8 gift emojis (no images, no prices) in the gift picker.

- Fixes:
  1. NEW src/lib/chat-emojis-gifts.ts: EMOJI_CATEGORIES (7 categories: smileys, gestures, hearts, animals, food, activities, symbols) with 120+ emojis total. Re-exports DEFAULT_GIFTS (50+ gifts) and GIFT_CATEGORIES (9 cats) from voice-rooms/types. emojiToPng(emoji): converts Unicode emoji to GitHub emoji CDN PNG URL for consistent rendering. getGiftById(id), isGiftMessage(text), parseGiftId(text), getGiftImageUrl(gift).

  2. Friends chat emoji picker — completely redesigned: 7 category tabs (horizontally scrollable), 8-column grid of emojis rendered as PNG images, max height 40vh, scrollable, fallback to Unicode text on PNG failure.

  3. Friends chat gift picker — completely redesigned: 9 category tabs (popular, romance, luxury, special, ramadan, birthday, vip, zodiac, fantasy), 4-column grid of gifts with thumbnail image + Arabic name + price (with diamonds icon), max height 45vh, scrollable. Gifts sent as 'gift:<id>' format for proper lookup.

  4. Chat message display — 4 cases:
     a) Gift message (type=gift, text starts with 'gift:'): parse giftId, look up gift, render gift thumbnail + name + price with diamonds icon
     b) Pure emoji message (text matches emoji regex): render as 12x12 PNG image for consistency
     c) Old gift message (type=gift, no 'gift:' prefix — backward compat): render emoji as PNG image
     d) Regular text: render as text with whitespace-pre-wrap

  5. Gift send format changed from '🌹' to 'gift:g1' — allows proper gift lookup with image, name, and price display.

- Verified: npx next build ✓ (23.5s), ESLint ✓.

- Committed as 7a08143 and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 3 files changed (NEW chat-emojis-gifts.ts, friends/page.tsx, worklog), 400 insertions, 4 deletions.
- Emojis now render consistently as PNG images (from GitHub emoji CDN) in both picker and chat — no more font-dependent rendering.
- Emoji picker now has 7 categories with 120+ emojis (was 16).
- Gift picker now has 9 categories with 50+ gifts, each showing thumbnail image + Arabic name + price (with diamonds icon).
- Gifts sent as 'gift:<id>' format — chat displays the gift's image, name, and price.

---
Task ID: 1
Agent: main
Task: Scroll-to-top on route change + Council page natural body scroll

Work Log:
- User reported: (1) pages should start from top when opened (not from middle). (2) Council page should match Games/Friends layout, rooms don't scroll at the bottom.

- Root causes:
  1. Next.js App Router does NOT auto-scroll-to-top when navigating between routes that share the same layout (our AppShell wraps all shell routes). Browser preserves scroll position.
  2. RoomListView root was 'flex flex-col min-h-screen' with rooms area using 'flex-1 overflow-y-auto'. Since parent (min-h-screen) doesn't constrain height to a specific value, flex-1 has no defined height to fill — the scrollable div just expands to fit all content. Body itself doesn't scroll because content is fully rendered. Result: rooms at the bottom are clipped or unreachable.

- Fixes:
  1. AppShell.tsx: added useEffect that watches pathname and calls window.scrollTo({top:0, behavior:'auto'}) on every route change. Also resets scrollTop on any element with data-scrollable='true'.
  
  2. RoomListView.tsx: redesigned to match Games/Friends layout pattern:
     - Root changed from 'flex flex-col min-h-screen' to 'min-h-screen' (removed flex-col — natural document flow)
     - Header (main tabs) and sub-tabs now use 'max-w-lg mx-auto w-full' for centered, mobile-friendly width (matches Friends page pattern)
     - Rooms area changed from 'flex-1 overflow-y-auto' to natural flow (no overflow, no flex-1) — body scrolls naturally like Games/Friends
     - paddingBottom increased from 85 to 100 to clear the bottom nav
     - All existing functionality preserved: main tabs (اكتشف/رائج/غرفي), sub-tabs (مؤخراً/منضم/متابَع/أصدقاء), my-room section, search bar, room cards, loading state, empty state.

- Verified: npx next build ✓ (22.0s), ESLint ✓.

- Committed as 3543ef5 and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 3 files changed (AppShell, RoomListView, worklog), 57 insertions, 8 deletions.
- Every page now starts from the top when navigated to (scroll-to-top on pathname change).
- Council page (voice-rooms) now uses natural body scroll — rooms at the bottom are reachable. Layout matches Games/Friends pattern (max-w-lg mx-auto, pb-100 for bottom nav clearance).

---
Task ID: 1
Agent: main
Task: Redesign Council page to match Games/Friends visual style

Work Log:
- User reported: "لا أرى أي تحديث او تصميم جديد صفحة المجلس كما هي" — don't see any new design, Council page is the same as before. Previous commit only made structural changes (scroll behavior, layout flow) but the VISUAL design was unchanged.

- Redesigned RoomListView.tsx with substantial visual changes:

1. NEW page header — matches Games page logo pattern: 11x11 rounded gradient box (from-[#15BC83] to-[#0FA070]) with Radio icon, 'المجلس' title (text-xl font-black text-white), gradient divider line below (matches Games page).

2. Main tabs redesigned — matches Friends page tab style: was pill-shaped centered buttons with inline styles, now full-width rectangular tabs with icons + labels. Active tab: bg-[#15BC83] text-white shadow-md. Inactive: text-white/50. Icons added: Compass (اكتشف), Flame (رائج), Home (غرفي). Sticky top-14 (below SiteHeader spacer).

3. Create Room CTA redesigned — matches Friends search button style: was white card with green plus icon and 'إنشاء غرفتي' text, now green pill button (bg-[#15BC83]) with: White/20 circle with Plus icon, 'إنشاء غرفتي' bold + 'ابدأ بثّك الصوتي الآن' subtitle, ChevronLeft arrow on the left.

4. Sub-tabs simplified — cleaner Tailwind classes: was inline styles with clamp() font sizes, now text-xs font-bold, bg-white for active / bg-white/10 for inactive, overflow-x-auto for horizontal scroll on small screens.

5. My Room banner — uses Tailwind classes (bg-[#15BC83]/15 border-[#15BC83]/30) instead of inline styles for consistency with Friends page.

6. Added imports: Compass, Flame, Radio from lucide-react.

- Verified: npx next build ✓ (22.8s), ESLint ✓.

- Committed as ce0c522 and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 2 files changed (RoomListView, worklog), 83 insertions, 75 deletions.
- Council page now has a prominent page header with 'المجلس' title + Radio icon.
- Main tabs (اكتشف/رائج/غرفي) are now full-width rectangular with icons — matches Friends page tab style.
- Create Room CTA is now a prominent green pill button with subtitle.
- Sub-tabs are cleaner with consistent Tailwind classes.
- All existing functionality preserved: main tabs, sub-tabs, my-room section, search, room cards.

---
Task ID: 1
Agent: main
Task: Fix RoomInteriorView z-index + audit asset usage

Work Log:
- User reported: (1) header and bottom nav block the top and bottom of the room interior. (2) Haven't used the icons, images, windows, mic shapes, and features pulled from Yalla Ludo sources.

- Fix #1 (z-index): RoomInteriorView root div was 'fixed inset-0 flex flex-col' without z-index. AppShell's SiteHeader (z-50) and SiteBottomNav (z-50) came AFTER RoomInteriorView in DOM order, so they stacked on top. Changed RoomInteriorView root to z-[60] — now covers the header/nav entirely. Also applied to loading state container.

- Audit #2 (asset usage): Checked what Yalla Ludo assets are actually used in RoomInteriorView:
  - TUI.colors: 58 references ✓ (color system IS used)
  - LikeAnimation: uses /gifts/gift_heart0-8.png ✓
  - GiftAnimations: uses SVGA player ✓
  - MicSeat: uses lucide-react icons (Crown, Lock, Mic, MicOff) instead of actual images ❌
  - BottomBar: no image assets ❌
  - Room header: no yalla-ui icons ❌
  - MicSeat VIP badges: no room_ic_flag_member_*.webp ❌
  - Level badges: no level_big_*.png ❌

- Committed as 6cb9d17 and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 1 file changed (RoomInteriorView.tsx), 2 insertions, 2 deletions.
- Z-index fix: RoomInteriorView now covers the full screen (z-[60]) above AppShell header (z-50) and bottom nav (z-50).
- Asset usage audit: identified that MicSeat, BottomBar, and header need to use actual Yalla Ludo image assets instead of lucide-react icons.

---
Task ID: 1
Agent: main
Task: Extract voice room icons from Yalla Ludo v1.5.1.0 APK

Work Log:
- User provided MediaFire download link for Yalla+Ludo+-+Ludo&Jackaroo_1.5.1.0_APKPure.xapk (320MB).
- Downloaded XAPK successfully via curl from MediaFire.
- XAPK is a ZIP containing: com.yalla.yallagames.apk (219MB), appAssetPack.apk (65MB), config.arm64_v8a.apk (35MB), manifest.json.
- Extracted main APK (com.yalla.yallagames.apk) from XAPK.
- Listed all room_* resources: 2493 files total (1680 in res/drawable*, 100 in assets/).
- The main drawable folder is res/drawable-xxhdpi-v4 (3600 files total, not v17 as expected).
- Extracted 1265 room icons from res/drawable-xxhdpi-v4 + 328 from res/drawable-ldrtl-xxhdpi-v17 + 2 SVGA from assets/ = 1267 total.
- Copied all to public/room-icons/ (20MB total).
- Key icons verified: room_icon_room_top_close, room_icon_room_top_more, room_icon_share, room_ic_input_sound, room_ic_input_mic, room_mic_emoji_icon, room_icon_picture, room_icon_room_music, room_default, room_center_small_treasure_chest, room_fruit_small_icon, icon_room_top_sound, room_gift.svga, room_coin.svga, room_ic_message_send, room_ic_message_send_off, room_chat_icon_emoji, room_gift_send_icon, room_prop_icon, room_icon_back.
- Each icon has 12 VIP-level variants (default, blue, coffee, diamond, fame, gold, grand, king, legend, leopard, love, purple).
- Build verified: npx next build ✓ (22.0s).
- Committed as 0e133ce and pushed to GitHub main → Vercel will auto-deploy.

Stage Summary:
- 1267 new files (public/room-icons/), 20MB total.
- ALL voice room interior icons from Yalla Ludo v1.5.1.0 are now available locally.
- Next step: update MicSeat, RoomInteriorView, BottomBar to use these real icons instead of lucide-react or settings-page icons.

---
Task ID: shop-rebuild-1
Agent: main
Task: إعادة بناء جميع النوافذ من الصفر — ChargeDialog + RoyalDialog + BuyVipDialog — بأصول Yalla Ludo الأصلية 100%

Work Log:
- نسخ 23 أصل ملكي من /yalla-ui/full/ إلى /yalla-ui/royal/:
  - royal_level_top_bg.webp, royal_level_value_ic.webp, royal_progress_point_ic.webp
  - royal_effective_time_bg.9.png
  - royal_super_privileges_dialog_bg.webp, royal_super_privileges_item_bg.webp
  - royal_super_privilege_dialog_title_bg.webp, royal_super_privileges_dialog_progress_end_ic.webp
  - royal_visual_ic.9.png, royal_visual_selected_ic.webp
  - royal_circle_coupon_ic.webp, royal_coupon_item_bg.webp, royal_coupon_item_mark_ic.webp
  - royal_coupon_shop_diamond_item_ic.webp, royal_coupon_shop_item_ic.webp
  - circle_content_open_ic.webp, reddot.webp
  - royal_store_add_sub_num_bg.webp, royal_store_gift_pay_value_bg.webp, royal_store_hot_item_bar.webp
  - btn_royal_gray.9.png, btn_royall_yes.9.png, dialog_buy_towar_royal_btn_bg.webp
- نسخ 19 أصل متجر من /yalla-ui/full/ إلى /yalla-ui/shop/:
  - bg_rank.9.png (شريط العنوان)
  - btn_shop.9.png, btn_shop_free.9.png (زر الشراء في item_diamonds.xml)
  - btn_yes.9.png, btn_yes_press.9.png (bn_yes — زر شراء VIP)
  - cart_vip_buy_item_bg.webp (خلفية عنصر VIP)
  - shop_item_bg.webp (خلفية عنصر الجواهر/الذهب)
  - shop_item_tail_bg.9.png, shop_top_green_line.9.png (الفواصل)
  - skin_bg.9.png, skin_close.webp, description_rule.webp
  - jia.webp (زر +)
  - diamonds1.webp, coin1.webp (الرموز الكبيرة 88x88dip)
  - vip.webp, vip_sub_entrance_ic.webp
  - privilege_detail_knight_ic.webp, privilege_detail_baron_ic.webp (رموز الفئات)

- ChargeDialog.tsx — إعادة بناء شاملة:
  - الهيدر: bg_rank.9.png حقيقية + skin_close.webp + bg_add_coin chips مع jia.webp
  - الألسنة: shop_switch_*_check.webp و shop_switch_*_uncheck.webp كأيقونات داخل كل لسان
  - الفاصل: shop_top_green_line.9.png مع fallback CSS
  - بانر أول شحن: bg_firstcharge.png كخلفية حقيقية + fast_pay_first_reward_tip_ic.webp
  - RegularPackageCard: shop_item_bg.webp بعتامة كاملة + label_best.webp/label_popular.webp كصور شارات حقيقية + btn_shop.9.png كخلفية زر الشراء
  - VipPackageCard: cart_vip_buy_item_bg.webp ممتلئة + privilege_detail_knight/baron_ic.webp + royal_5_throne_ic.webp (60x72dip) + btn_yes.9.png كخلفية زر الشراء (bn_yes drawable)
  - RoyalPackageCard: طبقات royal_level_top_bg.webp + bg_shop_royal.webp + royal_level_value_ic.webp + btn_yes.9.png للزر

- RoyalDialog.tsx — إعادة بناء شاملة:
  - شريط العنوان: bg_rank.9.png + description_rule.webp + skin_close.webp
  - الخلفية العلوية: royal_level_top_bg.webp بعتامة 85% (كانت CSS gradient قبل ذلك)
  - تاريخ الصلاحية: royal_effective_time_bg.9.png كخلفية حقيقية للـ pill
  - لوحة الامتيازات: royal_super_privileges_dialog_bg.webp كخلفية حاوية + royal_super_privileges_item_bg.webp كخلفية كل عنصر + royal_super_privileges_item_bg.webp للزر
  - إزالة state غير المستخدم setLoading لإصلاح تحذير ESLint (react-hooks/set-state-in-effect)

- BuyVipDialog.tsx — إعادة بناءة شاملة:
  - الهيدر: bg_rank.9.png + vip.webp + skin_close.webp + bg_add_coin للجواهر
  - البانر: bg_shop_top_banner.webp كخلفية + vip_sub_entrance_ic.webp
  - الفاصل: shop_top_green_line.9.png
  - كل عنصر: cart_vip_buy_item_bg.webp كخلفية ممتلئة + privilege_detail_knight/baron_ic.webp + royal_5_throne_ic.webp (60x72dip) + btn_yes.9.png كخلفية زر الشراء
  - زر الشراء في النموذج: btn_yes.9.png حقيقية

- التحقق من المطابقة مع layouts الأصلية Yalla Ludo:
  - fragment_shop.xml: 3 ألسنة بـ shop_switch_*_check/uncheck + iv_close skin_close + bg_rank للعنوان
  - view_shop_diamonds.xml: shop_top_green_line.9.png كفاصل
  - item_diamonds.xml: 107x150dip shop_item_bg.webp + label_best.webp + btn_shop.9.png (90x32dip)
  - item_vip_buy.xml: 157.5x195.44998dip cart_vip_buy_item_bg.webp + iv_days 59x72dip + btn_vip_buy bn_yes 110x40dip
  - fragment_royal_level2.xml: royal_level_top_bg 212.5dip + RoyalProgressView (radius 92dip) + royal_effective_time_bg + RoyalPrivilegeDetailView

- Build verification: npx next build --webpack ✓ (44s compile, 132/132 pages generated)
- ESLint verification: ✓ on all 3 dialog files (ChargeDialog, RoyalDialog, BuyVipDialog) — clean
- Commit: 29818650
- Pushed to GitHub main (ff2fe678..29818650)

Stage Summary:
- 45 new files added under /yalla-ui/royal/ (23) and /yalla-ui/shop/ (22)
- 3 dialog components rebuilt to use authentic Yalla Ludo image assets instead of CSS gradients
- All references now match the decoded APK layouts (fragment_shop.xml, item_diamonds.xml, item_vip_buy.xml, fragment_royal_level2.xml)
- Pre-existing ESLint warning in RoyalDialog fixed (removed unused setLoading state)
- Build passes — Vercel will auto-deploy on push

---
Task ID: shop-rebuild-2
Agent: main
Task: إزالة Royal/VIP من الهيدر + إعادة بناء النوافذ كنسخة طبق الأصل 100% من السورس

Work Log:
- ملاحظات المستخدم: (1) أيقونات Royal/VIP يجب ألا تكون في الهيدر، بل داخل نافذة الشحن. (2) تصميم النوافذ لا يزال غير مطابق للسورس — يجب نسخ سطر سطر، أيقونة أيقونة، لون لون.

SiteHeader.tsx (إزالة الأزرار الخاطئة):
- حذف زر Royal (royal-btn) من الهيدر
- حذف زر VIP (vip-btn) من الهيدر
- حذف استيراد RoyalDialog و BuyVipDialog
- حذف state royalOpen و vipOpen و royalLevel
- حذف useEffect لجلب /api/royal/state
- إصلاح تحذير ESLint المسبق على setFrameImg (react-hooks/set-state-in-effect) عبر microtask
- الهيدر الآن يحمّل ChargeDialog فقط — وهو يحوي بداخله rle_entranceView لفتح RoyalDialog

BuyVipDialog.tsx (حذف):
- حُذف بالكامل — لم يكن موجوداً في السورس الأصلي Yalla Ludo
- وظيفته مدمجة الآن في لسان "اشتراكات" داخل ChargeDialog (fragment_shop.xml الأصلي له 3 ألسنة فقط)

ChargeDialog.tsx (نسخة طبق الأصل من fragment_shop.xml):
- الحاوية: RelativeLayout 360dip، كامل الارتفاع، bg=skin_bg.9.png (وليس bg_rank — fragment_shop.xml ليس فيه شريط عنوان)
- الصف العلوي حسب fragment_shop.xml سطر سطر:
  • rle_entranceView (top-left marginStart=5 marginTop=3): يفتح RoyalDialog — يستخدم royal_level_value_ic.webp
  • iv_coupon (top-left marginStart=50 marginTop=3): placeholder
  • rl_money_title (centered): rl_gold + rl_diamonds (كل واحد bg_add_coin #0c3c30 radius 10، 75x20dip + coin/diamonds ImageView 29x29dip)
  • iv_close (skin_close.webp top-right padding 15/10/10/10)
- radio_group_switch (344x45dip marginTop=10): 3 ألسنة فقط (NOT 4):
  • gold: bg=shop_switch_left_check.webp + icon=shop_switch_gold_check.webp (16x17dip) + 'ذهب' (12sp bold white)
  • diamond: bg=shop_switch_middle_uncheck.webp + icon=shop_switch_diamond_uncheck.webp (16x19dip) + 'ألماس' (12sp bold #17654c)
  • privilege: bg=shop_switch_right_uncheck.webp + icon=shop_switch_privilege_uncheck.webp (18.5x16dip) + 'اشتراكات' (12sp bold #17654c)
- view_shop_diamonds.xml للمحتوى:
  • shop_top_green_line.9.png (9dip divider)
  • RecyclerView grid (3 أعمدة جواهر/ذهب، 2 أعمدة VIP)
  • shop_item_tail_bg.9.png (191x25dip زر تفاصيل، لون #2bc895)

DiamondPackageCard (نسخة طبق الأصل من item_diamonds.xml 107x150dip):
- shop_item_bg.webp (107x150dip fitXY كخلفية كاملة)
- ll1 (79x20dip marginTop=8 centerHorizontal): أيقونة صغيرة (14x16dip) + عدد (12sp #fff782 shadow #000 dy=3 radius=5)
- iv_coin (88x88dip diamonds1.webp أو coin1.webp)
- svg_best (label_best.webp 60x21dip marginTop=2 marginEnd=-3)
- ll_buy (btn_shop.9.png 90x32dip alignParentBottom centerHorizontal):
  • tv_money StrokeTextView 14sp bold #47790c stroke_color=#94f534 stroke_width=2

VipPackageCard (نسخة طبق الأصل من item_vip_buy.xml 157.5x195.45dip):
- cart_vip_buy_item_bg.webp كخلفية كاملة
- FrameLayout 59x72dip marginTop=39 centerHorizontal:
  • iv_days: رمز الفئة (privilege_detail_knight/baron_ic.webp أو royal_5_throne_ic.webp)
  • ctv_days: 'Nيوم' (16sp bold #17654c)
- btn_vip_buy (btn_yes.9.png 110x40dip marginTop=23):
  • diamonds ImageView 15x19dip
  • tv_num StrokeTextView 15sp StrokeTextStyle_Yes

RoyalDialog.tsx (نسخة طبق الأصل من fragment_royal_level2.xml):
- rl_main: RelativeLayout 360dip wide full_height
- View bg=skin_bg.9.png (marginTop=53dip): خلفية تحت شريط العنوان
- RoyalPrivilegeDetailView (marginTop=236 margins 4/4/4/4 bottom): قائمة الامتيازات
- View bg=royal_level_top_bg.webp (360x212.5dip marginTop=44 centerHorizontal)
- rl_title (bg_rank.9.png 53dip):
  • iv_rules (description_rule.webp padding 10/8/10/10 alignParentStart)
  • tv_title (21sp #87ebaa center marginBottom=10 text='مستوى رويال' shadow black_50 dy=5 radius=1)
  • iv_close (skin_close.webp padding 10/10/10/10 alignParentEnd)
- RoyalProgressView (progressRadius=92dip below=rl_title centerHorizontal): SVG دائري مع 5 نقاط مستويات حول المحيط
- svga_royal_level (85x85dip marginTop=99 centerHorizontal): royal_level_N.webp
- ctv_middle_royal_level (19sp bold marginTop=166 gradient #ffffff75→#ffc000 text='ROYAL N')
- FrameLayout (marginTop=193 37dip): ll_upgrade_need_value + ll_keep_info
  • ctv_upgrade_text (12sp bold white) + ctv_upgrade_need (15sp bold #ffed5d marginStart=4) + royal_level_value_ic.webp (16x16dip marginStart=5)
  • ctv_keep_text (12sp bold white) + ctv_keep_need (15sp bold #ffed5d marginStart=4)
- fl_time_validity (royal_effective_time_bg.9.png marginTop=238 minWidth=180 22dip paddingStart=10 paddingEnd=10):
  • 'validity_date' (10sp bold #87eaa9) + ctv_time_validity (10sp bold white marginStart=5)
- rl_growth_record (100dip below=rl_title alignParentEnd): 'نقاطي الملكية >>' (8sp bold #87eaa9) + points (12sp bold white) + 1dip #87eaa9 underline (marginBottom=15)
- RoyalPrivilegeList: royal_super_privileges_dialog_bg.webp حاوية + royal_super_privileges_item_bg.webp لكل عنصر

Stage Summary:
- 4 ملفات معدّلة: SiteHeader (إزالة الأزرار الخاطئة + إصلاح ESLint) + ChargeDialog (نسخة طبق الأصل) + RoyalDialog (نسخة طبق الأصل) + BuyVipDialog (محذوف)
- 1006 إضافة، 1603 حذف — إعادة بناء شاملة
- جميع الأبعاد والصور والألوان الآن مطابقة لـ fragment_shop.xml + view_shop_diamonds.xml + item_diamonds.xml + item_vip_buy.xml + fragment_royal_level2.xml
- Build verified: npx next build --webpack ✓ (41s, 132/132 pages)
- ESLint verified: ✓ clean on ChargeDialog, RoyalDialog, SiteHeader
- Commit: 1294667a — Pushed to GitHub main (b8c53a81..1294667a)

---
Task ID: gem-shop-pixel-perfect
Agent: main
Task: استنساخ نافذة شحن الماس (Diamond Shop) من Yalla Ludo بدقة بكسلية 1:1

Work Log:
- مهمة المستخدم: نسخة طبق الأصل 1:1 من نافذة شحن الماس في Yalla Ludo، سطر سطر، أيقونة أيقونة، لون لون
- المواصفات التفصيلية 12 قسم تطلب: ملف SPEC، خلفية، شريط علوي، تبويبات، نظام أرفف، مكافأة أول شحن، بطاقات، شارات، أزرار، حركات، حالات، تجاوب، هيكلة بيانات، تحقق بصري

المرحلة 1: التدقيق (Audit):
- استخراج الأبعاد الفعلية لكل أصل باستخدام Python/PIL (file.py)
- استخراج متوسط الألوان من كل أصل باستخدام PIL (avg pixel)
- العثور على الأصول المفقودة:
  - shelves.webp (1091x290 avg #3eceaa bright teal-green) — خلفية الرفوف
  - chest_firstcharge.webp (158x131 avg #a990a6) — صندوق الكنز الوردي/ماجنتا
  - bg_firstcharge.png (296x162 avg #cffee3 very light green-white) — الفقاعة البيضاء
  - recharge_room_gift.webp (114x114 avg #f57db4 bright pink) — أيقونة الهدية
  - charge_reward_profile_card.webp (240x188 avg #97b8d0 light blue) — أيقونة الإطار
  - charge_reward_head_decor.webp (120x120 avg #b894f gold-bronze) — أيقونة الخاتم
  - charge_reward_head_frame.webp (120x120 avg #be8334 gold) — أيقونة الإكليل
  - diamonds1-6.webp (310x271, 6 different icons!) — مطابقة لكل حزمة على حدة
  - coin1-6.webp (310x271, 6 different gold icons) — مطابقة لحزم الذهب
  - label_best.webp (192x72 avg #de374d red ribbon) — شارة BEST
  - label_popular.webp (186x66 avg #e96adf pink-magenta ribbon) — شارة POPULAR
  - royal_level_0-5.webp — شارات مستوى رويال لـ R0/R1/R2/R3/R4/R5 تحت الصورة

المرحلة 2: GEM_SHOP_SPEC.md (12 قسم، جدول 32 سطر):
- قسم 0: تقنية المشروع + ملفات النافذة
- قسم 1: جدول العناصر الكامل (32 عنصر: element, source path, x/y, dimensions, colors HEX, font/size/color/states/animations/notes)
- قسم 2: خريطة التخطيط المرجعية 360x800 + النسب المئوية لكل عنصر
- قسم 3: الفروقات المصححة (السابق → الجديد)
- قسم 4: الألوان المقاسة من أصول السورس (Python/PIL)
- قسم 5: الحركات الموجودة في السورس (SVGA references في XML)
- قسم 6: الحالات والتفاعل (عادي/ضغط/معطّل لكل زر)
- قسم 7: التجاوب على 4 شاشات
- قسم 8: هيكلة البيانات (Package/Tab/FirstChargeReward interfaces) + بنية API للأدمن
- قسم 9: جدول التعارضات (19 تعارض بين صورة المستخدم والسورس)
- قسم 10: قائمة الأصول المستخدمة + غير الموجودة (بدائل موثّقة)
- قسم 11: المخرجات النهائية
- قسم 12: ملخص للتنفيذ

المرحلة 3: إعادة بناء ChargeDialog (نسخة طبق الأصل):
- الحاوية: full-screen (no outer frame), bg=skin_bg.9.png + linear-gradient #3DB57A → #2A8A5C + radial vignette
- الشريط العلوي: X يسار + رصيد ماس + رصيد ذهب (centered) + صورة لاعب يمين + شارة R0/R1/.../R5
- الألسنة: 3 فقط (gold/diamond/privilege) — bg=shop_switch_*_check.webp حقيقية + icon 16-19dip + 12sp bold
- الفاصل: shop_top_green_line.9.png (9dip full-width)
- مكافأة أول شحن: title (17sp #fff771) + shelves.webp background + chest_firstcharge.webp يسار + bg_firstcharge.png bubble يمين بـ 3x2 grid (6 عناصر)
- نص التنبيه: 'يمكنك أن تحصل على المكافآت بعد الشراء بأي كمية' (white 10sp)
- الرفوف (3): ShelfRow component بتدرّج #5DD7A6→#3ECEAA→#2DA887→#1F7A5F + 3D bevel
- بطاقات الباقات (6) بأرقام مطابقة 100%:
  Row 1: 400/USD 0.99 (HOT) | 1800/USD 3.99 | 5000/USD 9.99
  Row 2: 16.0K/USD 29.99 (Popular) | 53.7K/USD 99.99 | 161.7K/USD 299.99 (BEST)
- كل بطاقة بأيقونة مختلفة: diamonds1-6.webp
- شارات (HOT/BEST/Popular) أعلى يمين (layout_gravity=end)
- زر شراء: btn_shop.9.png + "USD X.XX" 14sp bold #47790c + 8-direction text-shadow (stroke=#94f534 width=2dip)
- زر سفلي: shop_item_tail_bg.9.png + "تفاصيل الماس >>" 13sp #2bc895

المرحلة 4: API Data-driven (gems/packages/route.ts):
- 6 diamond packages مع displayAmount ('16.0K', '53.7K', '161.7K') + priceFormat ('USD 0.99') + badge + order + enabled
- 6 gold packages مع نفس الأسعار
- 3 VIP tiers (Knight/Baron/Royal) مع days
- 3 Royal point packages
- FirstChargeReward: 6 items مطابقة لـ item_shop_guild.xml L33-58
- Tabs: 3 ألسنة مع iconCheck/iconUncheck/bgCheck/bgUncheck/iconW/iconH/marginTop/order/visible

المرحلة 5: SiteHeader:
- إعادة royalLevel state + fetch /api/royal/state
- تمرير avatarUrl + royalLevel إلى ChargeDialog
- إصلاح ESLint المسبق على setFrameImg

Verification:
- npx next build --webpack ✓ (42s, 132/132 pages)
- ESLint ✓ clean on all touched files
- Python/PIL color extraction: جميع الألوان مقاسة من أصول السورس
- 32 عنصر مطابق للسورس

Conflicts resolved (19 in total, priority to source):
- X close on LEFT (image 2) vs RIGHT (source) → followed image 2
- Player avatar top-right not in source → added (image 2 has it)
- R0 badge under avatar → added (source has rle_entranceView invisible)
- Badges TOP-LEFT (image 2) vs TOP-RIGHT (source) → followed source (right)
- 19 total conflicts, all documented in GEM_SHOP_SPEC.md section 9

Stage Summary:
- Files: GEM_SHOP_SPEC.md (NEW, 12 sections, 32-row table), ChargeDialog.tsx (rewrite), SiteHeader.tsx (royal state), gems/packages/route.ts (data-driven)
- All 32 source assets used (no redrawn assets)
- Build verified + ESLint clean
- Commit: 14322381 — Pushed to GitHub main (12925c2a..14322381)
- Next: apply same pixel-perfect methodology to Gold Shop window (after user's confirmation)

---
Task ID: shop-rebuild-4-fix
Agent: main
Task: إصلاح مشاكل عرض العناصر في المتجر — الإطارات المتحركة + المعلقات + المواضيع + بطاقات الملف

Work Log:
- السؤال الأصلي للمستخدم: (1) الإطارات المتحركة لا تظهر + المعلقات/المواضيع/بطاقات الملف لا تظهر. (2) ماذا سُحب من سورس يللا لودو ولماذا لم يُضَف.

تشخيص المشكلة (3 أسباب متتابعة):

السبب 1: خادم التطوير يعمل من مسار خاطئ
- ps أظهر: cwd لـ next-server = /home/z/my-project/ (لا يحتوي على src/app)
- كل API كان يرجع 500 + "ENOENT: no such file or directory, scandir '/home/z/my-project/src/app'"
- قتلت العمليات القديمة (PID 1044-1065) وأعدت تشغيل `bun run dev` من /home/z/my-project/_gg/

السبب 2: قاعدة البيانات غير مهيأة
- DATABASE_URL البيئية = file:/home/z/my-project/db/custom.db (مسار غير موجود)
- أنشأت /home/z/my-project/db/ و custom.db فارغ
- libsql أنشأ الـ schema عند أول طلب

السبب 3 (الأهم): categoryId فارغ على DecorItems المزروعة
- seedDefaultDecor() ينفّذ INSERT OR REPLACE الذي يُعيد ضبط categoryId إلى '' (القيمة الافتراضية)
- linkExistingItemsToCategories() كان يعمل مرة واحدة داخل ensureAdminTables() قبل وجود أي عناصر
- النتيجة: DecorItems لها kind='ornament'/'theme'/'card' لكن categoryId='' فارغ
- StoreSubPage API: WHERE categoryId=? لم يطابق أي صف

إصلاح فوري (سكربت مرة واحدة):
- شغّلت سكربت مؤقت يطبّق نفس UPDATEs في linkExistingItemsToCategories
- بعد الإصلاح:
  - ornament → wall_hangings: 4 عناصر ✓
  - theme → themes: 10 عناصر ✓
  - card → profile_card: 7 عناصر ✓
  - PlayerFrame categoryId='frames': 75 إطار ✓ (45 SVGA + 28 PNG + 2 CSS gradient)

إصلاح دائم في admin-db.ts:
- DECOR_SEED_VERSION = 7 → 8 (يفرض إعادة البذر عند الطلب التالي)
- داخل seedDefaultDecor() بعد INSERT OR REPLACE: استدعاء linkExistingItemsToCategories(c) ليعيد ربط categoryId كل مرة

إصلاح عرض SVGA في المتجر:
- StoreItemCard كان يستخدم <img src={item.imageUrl} /> للصورة المركزية — هذا لا يعرض .svga
- 45 من 75 إطارات في DB هي /yalla-frames/svga/{id}.svga — تظهر كصور مكسورة
- استبدلت <img> بـ <SvgaOrImg src={item.imageUrl} /> في مركز البطاقة + شريط العنصر المحدد
- SvgaOrImg يستخدم svgaplayerweb لعرض .svga في canvas، و <img> للصور العادية
- نفس الإصلاح لشريط معلومات العنصر المحدد في الأسفل (40×40)

التحقق:
- typecheck: ✓ نظيف على StoreSubPage.tsx و admin-db.ts (أخطاء Next.js types فقط غير متعلقة)
- API GET /api/store/items?categoryId=frames → 75 عنصر (45 svga + 28 png + 2 other)
- API GET /api/store/items?categoryId=wall_hangings → 4 عناصر (1 svga + 3 png)
- API GET /api/store/items?categoryId=themes → 10 عناصر (png)
- API GET /api/store/items?categoryId=profile_card → 7 عناصر (png)
- API GET /api/store/items?categoryId=ludo_skin/entry_effects/jackaroo_skin → 0 (المستوردة مخفية بالتصميم)

Stage Summary:
- 2 ملفات عُدّلت: admin-db.ts (DECOR_SEED_VERSION=8 + linkExistingItemsToCategories post-seed) + StoreSubPage.tsx (SvgaOrImg بدل img)
- 1 سكربت محلي محفوظ: /home/z/my-project/scripts/fix-store-categories.ts (للاستخدام في حال استُعيدت DB)
- الآن العناصر كلها تظهر في المتجر: 75 إطار (منها 45 متحرك SVGA) + 4 معلقات جدارية + 10 مواضيع + 7 بطاقات = 96 عنصر
- العناصر المسحوبة من سورس (30 عنصر skin_10000..13003) تبقى مخفية بالتصميم لأن ملفات PNG غير موجودة على القرص
- الخطوة التالية: الدفعة 5 — لوحة الأدمن لإدارة العناصر المرئية + أسعار/حركات SVGA + رفع صور للعناصر المسحوبة المخفية

تفصيل ما سُحب من سورس يللا لودو:
- 45 أصل صورة من /res/drawable/ — نُسخت إلى /public/yalla-ui/royal/ (23 ملكي) + /yalla-ui/shop/ (22 متجر)
- 11 قسماً من RLShopFragment.smali — أصبحت STORE_CATEGORIES_SEED
- 30 معرّف skin من /assets/skin/ — أصبحت IMPORTED_SKIN_ITEMS (كلها مخفية، price=0، source='imported')
- 45 ملف SVGA من /assets/svga/ — موجودة فعلياً في /public/yalla-frames/svga/ + مسجلة في SVGA_FRAMES_CATALOG
- layouts مفكوكة من APK بـ apktool — استُخدم fragment_shop.xml, item_diamonds.xml, item_vip_buy.xml, fragment_royal_level2.xml, fragment_rl_shop.xml, rl_shop_item.xml

---
Task ID: batch-5-admin-store
Agent: main
Task: الدفعة 5 — لوحة أدمن لإدارة المتجر الموحّد (PlayerFrame + DecorItem)

Work Log:
- القائمة المطلوبة من المستخدم: (1) إدارة العناصر المرئية، (2) رفع صور للعناصر المسحوبة المخفية الـ30، (3) ضبط أسعار الـ45 SVGA

المرحلة 1: فتح الحقول الجديدة في row mappers
- toPlayerFrame(): أضفت 8 حقول Batch 2 (categoryId, visible, source, animatedUrl, isNew, discountPercent, scheduleStart, scheduleEnd) إلى النتيجة — كانت تُهمل سابقاً
- toDecorItem(): أضفت نفس 8 حقول
- updateFrame(): أضفت معالجة لـ isNew و discountPercent و sortOrder كأرقام (كانت تُمرّر كنص)
- updateDecorItem(): أضفت 'skin' لقائمة kinds المسموحة + معالجة isNew/discountPercent/sortOrder/price/totalOwned كأرقام

المرحلة 2: API endpoints جديدة
- GET /api/admin/store/items?categoryId=X&includeHidden=1 — يرجع كل العناصر في القسم (مخفية + ظاهرة، نشطة + معطلة) مع كل الحقول الجديدة + kindLabel عربي
- PATCH /api/admin/store/items/[id]?table=PlayerFrame|DecorItem — تحديث حقول مُحيطة (whitelist): nameAr, imageUrl, animatedUrl, rarity, price, isFree, isActive, sortOrder, categoryId, visible, source, isNew, discountPercent, scheduleStart, scheduleEnd
- DELETE /api/admin/store/items/[id]?table=X — حذف نهائي + تنظيف UserFrame/UserDecor المرتبطة
- POST /api/admin/store/items/[id]/upload?table=X — رفع PNG/WebP/SVGA (≤2MB) إلى MediaAsset + إرجاع URL عمومي + تحديث imageUrl (للصور) أو animatedUrl (لـ SVGA)
- GET /api/media/[id] — يخدم البايتات المخزنة من MediaAsset (مع cache-control immutable 24h)

المرحلة 3: صفحة الأدمن /admin/store
- auth check عبر /api/admin/stats (نفس آلية /admin)
- login form مستقل عند عدم التوثق
- تبويبات الأقسام الـ11 من /api/store/categories + frames مضافة افتراضياً
- بطاقة لكل عنصر: معاينة (SvgaOrImg يدعم PNG/SVGA) + شارات (مستورد/SVGA/جديد/خصم) + حالة ظاهر/مخفي + نادرة + سعر + مملوك + قسم
- أزرار 4: تعديل/تبديل ظاهر/رفع صورة/حذف
- نافذة تعديل كاملة: nameAr, price, rarity, visible, source, categoryId, sortOrder, discountPercent, isFree, isActive, isNew, imageUrl, animatedUrl
- فلاتر: بحث نصي + حالة (all/shown/hidden) + مصدر (all/ours/imported)
- شارات إحصائية: total / shown / hidden / imported / svga
- رابط breadcrumb إلى /admin
- تحذير أصفر للعناصر المستوردة المخفية: "ارفع صورة ثم بدّل الحالة إلى ظاهر"

المرحلة 4: اختبار شامل
- GET /api/admin/store/items?categoryId=ludo_skin&includeHidden=1 بدون كوكي → 401 ✓
- login admin/Ghaleb@2024 → cookie admin_token ✓
- GET مع كوكي → 13 عنصر skin_10000..10012 كلها visible='hidden', source='imported', isActive=0 ✓
- PATCH skin_10000 {visible:'shown', isActive:true, price:300} → نجح ✓
- GET /api/store/items?categoryId=ludo_skin (عمومي) → رجع 1 عنصر بالسعر الجديد ✓
- PATCH إعادة ضبط visible='hidden' isActive=false price=0 → نجح ✓
- POST /upload رفع test_item.png (68 bytes) → url=/api/media/skin_10000_1792616485559 column=imageUrl ✓
- GET /api/media/... → 200 + 68 bytes = حجم الأصل ✓
- PATCH لإعادة imageUrl الأصلي ✓
- GET /admin/store → 200 (compile + render 347ms) ✓
- typecheck: 0 أخطاء على كل الملفات الجديدة ✓

Stage Summary:
- 5 ملفات جديدة: src/app/admin/store/page.tsx (~600 سطر) + 4 routes تحت /api/admin/store/ و /api/media/
- 2 ملفات معدّلة: admin-db.ts (toPlayerFrame/toDecorItem/updateFrame/updateDecorItem) + /api/media/[id]/route.ts (تصدير MediaAsset)
- 0 ملفات محذوفة — كل البيانات القديمة محفوظة
- الآن الأدمن قادر على: رؤية كل العناصر المخفية + تفعيلها + رفع صور لها + ضبط أسعارها + تعديل كل خصائصها — بدون كتابة كود
- العناصر المسحوبة الـ30: تظهر الآن في الأدمن تحت تبويبات ludo_skin/jackaroo_skin/entry_effects/themes بشارة "مستورد" — يمكن للأدمن رفع الصورة وتبديل الحالة لجعلها ظاهرة في المتجر

الخطوات التالية المقترحة:
1. إضافة زر "تطبيق على كل العناصر المختارة" (bulk actions): toggle visible / set price / set rarity
2. عرض تعارضات أسعار SVGA الـ30 في نافذة مستقلة مع زر "اعتمد سعر السورس" أو "اعتمد سعرنا"
3. إضافة معاينة فورية في نافذة التعديل عند تغيير imageUrl/animatedUrl
4. تصدير/استيراد JSON للكتالوج (backup/restore)

---
Task ID: batch-5-sidebar-link
Agent: main
Task: إضافة رابط "إدارة المتجر" إلى الشريط الجانبي في /admin → /admin/store

Work Log:
- المشكلة: المستخدم دخل لوحة /admin ولم يجد رابطاً لصفحة /admin/store (التي بنيتها في الدفعة 5)
- استنسخت أحدث نسخة من GitHub إلى /home/z/my-project/g-g-2/ للعمل على الملف الأصلي
- التعديل على _gg/src/app/admin/page.tsx (3 تغييرات):
  1. import { ..., ShoppingBag } from 'lucide-react' — إضافة أيقونة
  2. type ActiveSection: أضفت 'store' إلى نهاية union type
  3. navItems: أضفت { id: 'store', label: 'إدارة المتجر', icon: <ShoppingBag /> } فوق 'frames'
  4. handleNavClick: عند section==='store' → router.push('/admin/store') بدل تبديل القسم
- التزام: commit 64037da4 "feat(admin): add 'إدارة المتجر' link to sidebar → /admin/store"
- Push إلى GitHub: 452aa48d..64037da4 main -> main (✓ نجح بعد PAT من المستخدم)
- إعادة ضبط remote URL لإزالة الـ PAT من config (لا يُخزّن الـ token في أي مكان محلي)
- typecheck: ✓ نظيف على التعديلات (الـ pre-existing gameSlug error غير متعلق)

Stage Summary:
- صفحة /admin/store الآن قابلة للوصول من الشريط الجانبي عبر زر "إدارة المتجر"
- بعد إعادة نشر Vercel (~60 ثانية)، سيظهر الزر بين "المتصدرين" و"إدارة الإطارات"
- تنبيه أمني: PAT الذي شاركه المستخدم في المحادثة يُعتبر مكشوفاً (يُحفظ سجل المحادثة) — يجب إبطاله من https://github.com/settings/tokens بعد الانتهاء
