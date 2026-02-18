# Changelog

## [Unreleased] — File size refactor & dead code removal

### Problem

`index.html`, `draft.html`, and `myteam.html` each embedded an identical 701-player
data array (~454KB per file), making every file ~500KB despite containing only
30–140KB of actual logic. Several utility functions were also duplicated verbatim
across pages.

### New Files

- **`players.json`** — the 701-player dataset extracted from all three HTML files.
  Pages now load it at runtime via `fetch('players.json')`. The app must be served
  over HTTP to work (see README).

- **`draft-utils.js`** — shared utilities loaded by `index.html` and `draft.html`:

  | | |
  |---|---|
  | `teams` | Draft order array |
  | `getCurrentTeam()` | Snake draft pick logic |
  | `getNextTeams(count)` | Returns upcoming teams in order |
  | `renderDraftOrder(nextCount)` | Renders the draft order sidebar |
  | `updateDraftStatus()` | Updates the "on the clock" UI |
  | `getPlayerPosition(player)` | Returns primary position |
  | `getEligiblePositions(player)` | Returns all eligible positions |
  | `isPreDrafted(player)` | True if player is a keeper |
  | `draftPlayerByKey(key)` | Executes a draft pick |
  | `undoLastPick()` | Reverts the last pick |
  | `toggleDropdown(e)` | Nav dropdown open/close |
  | `loadDraftState()` | Loads draft state from localStorage |

- **`README.md`** — documents how to run the app locally.

- **`.gitignore`** — excludes `.claude/` local config.

### Changed

| File | Before | After | Notes |
|---|---|---|---|
| `index.html` | 497KB | 30KB | Removed `PLAYERS_DATA`, extracted functions, removed dead code |
| `draft.html` | 509KB | 49KB | Removed `PLAYERS_DATA`, extracted functions |
| `myteam.html` | 596KB | 141KB | Removed `PLAYERS_DATA` only (all other functions are page-specific) |
| `players.json` | — | 463KB | New shared file |
| `draft-utils.js` | — | 5KB | New shared file |

### Dead Code Removed

**`index.html`**
- `filterPlayers()` and `renderPlayers()` — executed on every `renderAll()` cycle
  but were no-ops: all DOM elements they targeted (`#players-tbody`, `#position-filter`,
  `#search`, `#show-drafted`) do not exist in the page's HTML. These are left over
  from when `index.html` was the full draft interface before `draft.html` was split out.
- `// Sorting functionality` block — queried `th.sortable` elements that don't exist.
- `sortColumn` / `sortDirection` — only used by the above removed functions.
- Duplicate `renderAll()` call in `DOMContentLoaded` — called twice in a row.
- Stale `console.log` for player count (logged `0` after async refactor).

**`draft.html`**
- Duplicate `renderAll()` call in `DOMContentLoaded` — same copy-paste artifact.

**`myteam.html`**
- `playerMatchesPos()` — defined but never called.
- `statCells()` — defined but never called.

### `renderDraftOrder` parameterized

Previously duplicated in both `index.html` and `draft.html` with one difference:
the number of upcoming teams to show (20 vs 10). Merged into `draft-utils.js` as
`renderDraftOrder(nextCount = 10)`. Call sites updated accordingly.
