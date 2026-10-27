# AGENTS

This file provides guidance to agents when working with code in this repository.

## Repository Overview

掌门杀 (Zhangmensha) is a browser-based, Sanguosha-like identity card game themed on the cultivation novel 《修真门派掌门路》. It builds to a **single self-contained HTML file** (double-click to play, PeerJS multiplayer included).

Stack: TypeScript (strict) + Vite + `vite-plugin-singlefile` + esbuild. No runtime framework; the UI is string-templated `innerHTML` re-rendered from a single state object `G`.

**The single hardest rule of this repo: every term must come from `docs/`.** The setting library under `docs/md/` is the only authoritative vocabulary. `docs/raw/` may only supply a term when `docs/md/` has no counterpart, and the source must be cited. A term that cannot be found in `docs/` is **invented and forbidden**. See [docs/game/游戏机制.md § 九 术语禁用清单](docs/game/游戏机制.md).

## Commands

```bash
npm install          # first time only
npm run dev          # dev server with HMR (PeerJS CDN mode)
npm run dev:bundled  # dev server with bundled PeerJS
npm run build        # build BOTH modes into dist/
npm run build:cdn        # dist/掌门杀.html          (PeerJS via CDN <script>)
npm run build:bundled    # dist/掌门杀.bundled.html  (peerjs npm pkg inlined, offline-ready)
npm run typecheck     # tsc --noEmit (must pass with zero errors)
npm run clean         # remove dist/
```

Smoke tests (esbuild-bundled TS checks run in Node with a minimal DOM stub; `smoke:ui` uses headless Chromium via playwright-core):

```bash
npm run smoke          # single-player closed loop (setup -> AI battle -> settlement)
npm run smoke:cards    # deck composition + terminology compliance
npm run smoke:roster   # 116-character roster: uniqueness / referential integrity / camp distribution
npm run smoke:roles    # role pool + player-count adaptive ratios
npm run smoke:contract # soul-contract mechanics (sign / break / 公正鬼 escalation)
npm run smoke:wudao    # realm growth + 悟道 judgment (incl. 灵地 threshold)
npm run smoke:net      # multiplayer protocol (room code / codec / snapshot serialization)
npm run smoke:ui       # browser: lobby / 116-char grid / deal / theme+LLM panels / table-vs-list / console errors
npm run verify:dist    # artifacts are self-contained single files
```

Detailed docs live in `docs/game/`: [游戏机制.md](docs/game/游戏机制.md) (mechanics), [玩法.md](docs/game/玩法.md) (how to play), [卡牌.md](docs/game/卡牌.md) (card reference), [架构设计.md](docs/game/架构设计.md) (architecture), [README.md](docs/game/README.md) (doc index). Read them before larger changes.

## Build Architecture (read before changing build config)

- `vite.config.ts` reads `VITE_PEERJS_MODE` (`cdn` | `bundled`, set by `scripts/build.mjs` / `scripts/dev.mjs`, no cross-env needed) and aliases `#peer` to either `src/net/peer.cdn.ts` (reads global `window.Peer`) or `src/net/peer.bundled.ts` (`import Peer from 'peerjs'`); it also injects the PeerJS CDN script tag in cdn mode only and renames `dist/index.html` to the mode-specific filename. `emptyOutDir:false` lets both artifacts coexist.
- `vite.config.ts` sets `root: src/`, so `index.html` references `/main.ts` (not `/src/main.ts`).
- `src/types/peerjs.d.ts` is a hand-written minimal declaration covering both `window.Peer` and `module 'peerjs'`. Extend it there if you need more PeerJS APIs (no @types/peerjs dependency).
- `dist/掌门杀.html` and `dist/掌门杀.bundled.html` must remain drop-in single-file games — verify with `npm run verify:dist` and the smoke scripts after **every** change.

## Source Layout (`src/`)

- `main.ts` — the ONLY place with init side effects: mounts the `window` globals used by inline `onclick` handlers, then runs the init sequence (apply theme -> sync top bar -> lobby render -> LLM setup panel). No game logic here.
- `core/` — `types.ts` (all domain types incl. `Camp` / `RoleSide` / `NetMessage` union), `dom.ts` (`escapeHtml` etc.), `shuffle.ts`, `sound.ts`, `fx.ts`.
- `data/` — pure data + derivation: `camps` / `powers` / `regions` / `lingdi` / `realms` / `roles` / `contracts` / `characters` (116 playable) / `beasts` / `daoVerses` / `cards` (deck) / `cardCatalog` (card labels) / `spellTricks` (符篆/阵法/秘术) / `skilldefs` (55 skills).
- `game/` — engine: `state.ts` (the `G` object), `rules.ts` (distance/hand-limit), `realm.ts`, `wudao.ts`, `contract.ts`, `roles.ts`, `beasts.ts`, `damage.ts`, `actions.ts`, `skills.ts`, `skillEngine.ts`, `turn.ts`, `ai.ts` (+ `aibrain.ts`), `loop.ts`, `choice.ts` (Promise bridge), `marks.ts`, `log.ts`, `chat.ts`, `setup.ts`.
- `llm/` — the LLM-takeover decision chain: `types.ts` / `config.ts` (localStorage) / `client.ts` (fetch + timeout) / `agent.ts` (routing + bad-decision demotion) / `prompts.ts` (context assembly, cultivation terminology).
- `net/` — `protocol.ts` (typed message union — extend this first when adding networked features), `network.ts` (host-authoritative sync), `rooms.ts`, `peer.cdn.ts` / `peer.bundled.ts`.
- `profile/` — localStorage profile (`zhangmensha_profile_v1`): name/avatar/score/wins/games + `themeMode` + `themeStyle`.
- `ui/` — `render.ts` (single top-level `render()`; screens `lobby` / `setup` / `game`), `lobby.ts` (两屏：主界面选模式 → 对局设置), `playzone.ts` (`.p-card` seat ring / table layout), `hand.ts`, `modals.ts`, `settle.ts`, `theme.ts`, `llmSettings.ts`.
- `style.css` — hand-written CSS with CSS-variable tokens; **do not introduce a Tailwind/framework CDN** (it would break artifact self-containment).

## Critical Invariants

1. **`G` field shape is frozen** — `state_sync` serializes it directly and clients unpack it structurally. New fields must be nullable / appended, never renamed or removed.
2. **Inline handlers**: generated HTML (seats, action buttons, modals) calls `clickSeat(i)`, `openThemePanel()`, `llmSetField(...)`, etc. Any function referenced from a template string **must** be mounted on `window` in `main.ts` **and** declared in `globals.d.ts`, otherwise it throws at runtime.
3. **Module cycles are intentional** (ui ↔ game ↔ net ↔ llm). They are safe ONLY because no module has top-level side effects except `main.ts`; cross-module calls happen inside function bodies. Never add top-level code that touches another module's bindings.
4. **Mutable shared state ownership**: `G.logs` / `G.chat` / `ROLE_MARKS` / `SELECTED_*` / LLM failure streaks / `aibrain` beliefs are each owned by one module; others read via live bindings or call exported mutators (`resetLlmFailStreak`, `resetBrain`, ...). Do not assign to imported bindings.
5. **Magic numbers are load-bearing**: 80ms sync debounce, 6-digit room codes, deck composition (30 神通 / 15 护身 / 8 灵丹 / 5 灵药 / 8 悟道 / 49 符篆阵法秘术 / 13 法宝 / 10 灵地 = **138**), the `SOUL_BACKLASH_LETHAL = false` balance toggle, `mingli` limits, realm thresholds.
   - **Combat HP is fixed at 3–4** (`characters.ts` `HP_BASE`: 练气/筑基 3，金丹及以上 4) **+1 for 掌门** (`setup.createPlayer`); HP **must not grow** on breakthrough (`realm.ts`) — this is the Sanguosha-style pacing invariant.
   - **`SHENGTONG_PER_TURN = 1`** (`rules.ts`): at most one 神通 per turn. Removing this cap makes a single turn able to burst-kill (games collapse to 2–6 turns).
   - **Damage floor**: 法宝 (护身/秘宝合计 −1) + 被动减伤 cannot reduce a hit below **1**; only 道心 can fully negate, and 道心抵伤 is **once per turn** (`flags.daoxinGuardUsed`).
6. **Terminology compliance**: never introduce a term absent from `docs/`. The banned-word list is enforced by `npm run smoke:roster` and `npm run smoke:cards`.
7. **Roster integrity**: 116 playable characters, 4 camps (human / beast / moxiu / guixiu). `npm run smoke:roster` asserts the count, id/name uniqueness, and that every referenced skill / power / region / beast exists. 血魔井 is an **item** (法宝 card), never a character; 姜炎 is a **散修** (human camp, `power: 'sanxiu'`), never a 鬼修.
8. **AI dual mechanism**: `ai.ts` exposes `enumerateActions()` / `executeAction()`; `aiPlay()` routes to the LLM only when `p.aiMode === 'llm'` **and** `llmReady()` is true, otherwise it falls back to the heuristic path. A timeout / exception / illegal output must never deadlock the game — the fallback and `demoteLlmSeat` are load-bearing.
9. **Table vs list rendering**: `playzone.ts` always writes inline `left/top` seat coordinates for the desktop elliptical table. The small-screen list mode overrides them with `!important` in `style.css` (`position:static !important; left:auto !important; top:auto !important`). **The two are a matched pair** — removing the `!important` makes seats misalign on narrow screens, and removing the inline coordinates breaks the desktop table.
10. **Theme system**: `body[data-mode]` (day/night/dusk) × `body[data-theme]` (jade/gold/azure/purple/red/green) drives all colors through CSS variables; the choice is persisted in the profile and an inline first-frame script in `index.html` prevents a flash of the wrong theme.
11. **FX layer is cosmetic-only and sim-guarded**: every animation in `core/fx.ts` mounts into `#fxLayer` via one `push()` helper and returns early when `isSim()` is true. FX must never await, mutate game state, or throw under the headless DOM stub — `seatAnchor`/`elAnchor` already guard missing `getBoundingClientRect`. Add new effects to `fx.ts` + the `特效层` CSS block, then wire them at the event site (`damage.ts` / `actions.ts` / `turn.ts` / `contract.ts` / `beasts.ts` / `skillEngine.ts` / `settle.ts`).

## Verification Checklist

Before declaring any change done:

```bash
npm run typecheck && npm run build
npm run smoke && npm run smoke:cards && npm run smoke:roster && npm run smoke:roles
npm run smoke:contract && npm run smoke:wudao && npm run smoke:net && npm run smoke:ui
npm run verify:dist
```

`npm run smoke:ui` needs Chromium: `npx playwright install chromium`.
