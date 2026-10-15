# Work Record: Redesign shifarat + mafia in Yalla Ludo style

Task ID: redesign-shifarat-mafia
Agent: Subagent B
Started: 2026-10-15

## Plan
1. Verify shifarat files (LandingPage, GameSetup, PlayingPhase, GameOver, page.tsx, r/shifarat/[code]) — already Yalla Ludo styled by previous pass
2. Redesign mafia NightPhase.tsx — apply Yalla Ludo header (sound + viewers + quit) + StrokeTextStyle titles + dark green background, preserve all night-phase logic (boss kill, silencer, medic, sniper, diwaniya polling)
3. Create /r/mafia/[code]/page.tsx deep-link route (swap slug + emoji 🕵️) — copy of /r/tobol/[code]/page.tsx
4. Run `bun run lint` to verify no TS/ESLint errors
5. Read /home/z/my-project/dev.log to verify dev server status
6. Commit + push to origin main
7. Append summary to /home/z/my-project/worklog.md

## Reference Files Used
- /home/z/g-g/_gg/src/components/tobol/LandingPage.tsx (template)
- /home/z/g-g/_gg/src/components/tobol/GameSetup.tsx (template)
- /home/z/g-g/_gg/src/components/tobol/GameBoard.tsx (template)
- /home/z/g-g/_gg/src/components/tobol/TobolGameOver.tsx (template)
- /home/z/g-g/_gg/src/app/tobol/page.tsx (template)
- /home/z/g-g/_gg/src/app/r/tobol/[code]/page.tsx (deep-link template)
- /home/z/g-g/_gg/src/lib/yalla-game-helpers.ts (shared hooks: STROKE_STYLE, useInGameSetupMode, useYallaSoundState, useHostHeartbeat, useViewerCount, useShareLinks, useGameRewards)

## State at Start
- shifarat/* and mafia/* main components ALREADY redesigned in working tree (uncommitted)
- shifarat r/[code] ALREADY created (untracked)
- mafia NightPhase.tsx NOT yet styled — still uses old mafia-bg-night + lucide icons (no Yalla helpers)
- mafia r/[code] NOT yet created

## Files Modified (this agent)
- /home/z/g-g/_gg/src/components/mafia/NightPhase.tsx — applied Yalla Ludo header (sound + viewers + quit) + StrokeTextStyle titles + dark green game_bg.webp background + tobol-start-btn for action button + diwaniya share-link capsule at bottom. All night-phase logic preserved (handleNextPhase, polling, sniper choices, mafia reveal, syncHostChoice, canProceed, getPhaseTitle, getPhaseDescription, renderTargetSelection).

## Files Created (this agent)
- /home/z/g-g/_gg/src/app/r/mafia/[code]/page.tsx — deep-link redirect route (Yalla Ludo style). Swaps tobol slug → mafia, swaps emoji 🥁 → 🕵️, swaps logo color from orange (245,158,11) to red (239,68,68) matching mafia accent. Builds intent:// URL with com.bengharbios.ggames package and falls back to /join/mafia/[code].

## Files Verified Already Yalla Ludo Styled (no changes needed)
- /home/z/g-g/_gg/src/components/shifarat/LandingPage.tsx — bg_mode_select.png + godfather/diwaniya buttons + watch-code + rules + floating emojis ✅
- /home/z/g-g/_gg/src/components/shifarat/GameSetup.tsx — STROKE_STYLE title 22px + image 76x64 + "تجهيز المعركة" pill + tobol-team-card + VS + score frame + start button + header (sound/quit). useInGameSetupMode() + useYallaSoundState(). ✅
- /home/z/g-g/_gg/src/components/shifarat/PlayingPhase.tsx — header + title + team panels + VS + notification pill + 5x5 codenames board (preserved) + battle log + diwaniya extras (useHostHeartbeat + useViewerCount + useShareLinks). ✅
- /home/z/g-g/_gg/src/components/shifarat/GameOver.tsx — bg_award + segment_award + godfather row + reward chips (useGameRewards(true, 'shifarat', 'win'|'play', 2)) + teams + stats + 2-button row. ✅
- /home/z/g-g/_gg/src/app/shifarat/page.tsx — useHydrated + useHostHeartbeat + inline Yalla header + ?mode= + height:100vh + overflow:hidden. ✅
- /home/z/g-g/_gg/src/app/r/shifarat/[code]/page.tsx — deep-link route with 🎯 emoji and emerald green button. ✅
- /home/z/g-g/_gg/src/components/mafia/LandingPage.tsx — bg_mode_select + godfather/diwaniya + watch-code + rules + floating emojis (🕵️🌑🔦💼🔫💀). ✅
- /home/z/g-g/_gg/src/components/mafia/GameSetup.tsx — STROKE_STYLE title 22px + image 76x64 + "تجهيز المعركة" pill + mafia-vs-citizens team cards + composition + start button + header. ✅
- /home/z/g-g/_gg/src/components/mafia/CardDistribution.tsx — Yalla header + StrokeTextStyle title + tobol-board-notice-v3 pill + progress bar + RoleCard + start-btn (أرى بطاقتي/ابدأ الليل). useHostHeartbeat('mafia') + useViewerCount. ✅
- /home/z/g-g/_gg/src/components/mafia/DayPhase.tsx — YallaDayShell wrapper with sound toggle + viewers + StrokeTextStyle title + tobol-board-notice-v3 pill + LiveVotingBoard + vote tally + processVoteResults. useHostHeartbeat + useViewerCount. ✅
- /home/z/g-g/_gg/src/components/mafia/GameOver.tsx — bg_award + segment_award + godfather row + reward chips (useGameRewards(true, 'mafia', 'win'|'loss', playerCount)) + teams + stats + 2-button row. ✅
- /home/z/g-g/_gg/src/app/mafia/page.tsx — useHydrated + useHostHeartbeat + inline Yalla header + ?mode= + height:100vh + overflow:hidden. ✅

## Stage Summary
- ✅ shifarat game fully redesigned in Yalla Ludo style (5 component files + page.tsx + r/[code] deep-link)
- ✅ mafia game fully redesigned in Yalla Ludo style (6 component files including NightPhase + page.tsx + r/[code] deep-link)
- ✅ Both games preserve all logic — Zustand stores untouched, shifarat-clue-engine.ts + shifarat-words.ts untouched, game-types.ts getTeamComposition untouched
- ✅ Reused existing tobol-* CSS classes — no new CSS added
- ✅ All shared Yalla helpers wired in: useInGameSetupMode, useYallaSoundState, useHostHeartbeat, useViewerCount, useShareLinks, useGameRewards
- ✅ ESLint passes (no new errors introduced; only pre-existing setState-in-effect warnings remain in same pattern as DayPhase.tsx and the original NightPhase.tsx)
- ✅ Committed: 18b827e7 feat(games): redesign shifarat + mafia in Yalla Ludo style
- ✅ Pushed: e14f0c17..18b827e7 main -> main (origin: github.com/bengharbios/G-G-2.git)
- ✅ agent-ctx record written at /home/z/g-g/_gg/agent-ctx/redesign-shifarat-mafia-subagent-b.md
