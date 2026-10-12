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
