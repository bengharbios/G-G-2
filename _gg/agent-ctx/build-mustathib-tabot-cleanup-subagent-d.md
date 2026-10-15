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

## Files Created (this agent pass)
- /home/z/g-g/_gg/src/app/join/tabot/[code]/page.tsx — dedicated spectator join route for tabot (parallel to /join/mustathib/[code])

## Files Modified (this agent pass)
- /home/z/g-g/_gg/src/components/tabot/GameSetup.tsx — added explicit `if (!selectedFirstTeam)` guard to satisfy TypeScript strict checks
- /home/z/g-g/_gg/src/app/r/tabot/[code]/page.tsx — removed unused `import { redirect } from 'next/server'`
- /home/z/g-g/_gg/download/deployment/app/join/[code]/page.tsx — replaced `import TabotSpectatorView from '@/components/tabot/TabotSpectatorView'` with `'@/components/tabot/SpectatorView'` (since old TabotSpectatorView.tsx was deleted)
- /home/z/g-g/_gg/download/deployment/app/tabot/page.tsx — replaced `import TeamSetup` with `import GameSetup` (since old TeamSetup.tsx was deleted)

## State Discovered
- All mustathib files (types, store, components, page.tsx, r/[code], join/[code], 5 API routes, room-store) were already committed by subagent D's previous pass — verification only.
- All tabot cleanup files (LandingPage, GameSetup, GameBoard, GameOver, SpectatorView, r/tabot/[code]) were already committed by subagent D's previous pass.
- Old Tabot-prefixed files (TabotLanding, TabotSetup, TabotGameBoard, TabotGameOver, TabotSpectatorView) + TeamSetup/TeamStatus/DiwaniyaSetup were already deleted by previous pass.

## Stage Summary
- ✅ Mustathib (Werewolf-style) game fully built and committed (8 game files + page.tsx + 2 routes + 5 API routes + room-store + types)
- ✅ Tabot cleanup complete: Yalla Ludo style applied to all 4 main components + spectator view created + page.tsx updated + old Tabot*.tsx deleted + r/tabot/[code] route created + join/tabot/[code] route created
- ✅ TypeScript clean — zero errors in src/(components|app|lib)/(tabot|mustathib) — verified with `tsc --noEmit -p tsconfig.json`
- ✅ Floating emojis used: mustathib ['🐺','🦉','🐦‍⬛','🔮','🌙','⭐'] and tabot ['🪦','⚰️','🦇','🕯️','🔒','🔑']
- ✅ Reused all existing tobol-* CSS classes — no new CSS added to globals.css
- ✅ All shared Yalla helpers wired in (useHostHeartbeat, useGameRewards, useInGameSetupMode)
- ✅ Committed: 86637294 feat(games): build new mustathib + cleanup tabot in Yalla Ludo style
- ✅ Pushed: 7a4c6fd7..86637294 main -> main (origin: github.com/bengharbios/G-G-2.git)
- ✅ Worklog appended at /home/z/my-project/worklog.md
