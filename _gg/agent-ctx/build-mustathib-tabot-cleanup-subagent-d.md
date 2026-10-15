# Work Record: Build mustathib + Cleanup tabot (Yalla Ludo style)

Task ID: build-mustathib-tabot-cleanup
Agent: Subagent D
Started: 2026-10-14

## Plan
1. Build new mustathib game (Werewolf-style, Arabic) — types, store, 5 components, page.tsx, r/[code], join/[code], 5 API routes, mustathib-room-store.ts
2. Cleanup tabot — apply Yalla Ludo style to LandingPage/GameSetup/GameBoard/GameOver, update page.tsx, delete legacy Tabot*.tsx, create r/tabot/[code]
3. Run tsc --noEmit
4. Git commit + push
5. Append summary to /home/z/my-project/worklog.md

## Reference Files Used
- /home/z/g-g/_gg/src/components/tobol/LandingPage.tsx (template)
- /home/z/g-g/_gg/src/components/tobol/GameSetup.tsx (template)
- /home/z/g-g/_gg/src/components/tobol/GameBoard.tsx (template, 1023 lines)
- /home/z/g-g/_gg/src/components/tobol/TobolGameOver.tsx (template)
- /home/z/g-g/_gg/src/lib/tobol-store.ts (Zustand pattern)
- /home/z/g-g/_gg/src/lib/tobol-room-store.ts (Turso room pattern)
- /home/z/g-g/_gg/src/lib/yalla-game-helpers.ts (shared hooks)
- /home/z/g-g/_gg/src/lib/tabot-store.ts (preserve tabot logic)
- /home/z/g-g/_gg/src/lib/tabot-types.ts (OUTCOME_CONFIG, 4 roles, 16 doors)

## Files Created
[pending]

## Files Modified
[pending]

## Stage Summary
[pending]
