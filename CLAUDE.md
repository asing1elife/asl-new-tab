# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Manifest V3 Chrome extension that overrides the new tab page (`chrome_url_overrides.newtab`) with a two-panel portal built from the user's **native Chrome bookmarks**. Unlike Chrome's bookmark bar (which opens in the current tab), every bookmark here opens in a new tab via `<a target="_blank">`.

**Zero dependencies, no build step.** Vanilla HTML/CSS/JS. There is no `package.json`, bundler, linter, or test suite.

## Running / testing

There are no CLI commands. To run or verify a change:

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. **Load unpacked** → select this project folder
4. Open a new tab. After editing files, click the extension's reload icon on the extensions page, then reopen the tab.

Bump `version` in `manifest.json` for releases (history shows a `chore: upgrade version` commit per release).

## Code layout

Everything lives in four files at the repo root:

- `manifest.json` — MV3 config, permissions (`bookmarks`, `favicon`, `storage`)
- `newtab.html` — static shell: `.app` (sidebar + content) and a separate `#dashboard` overlay, both present in the DOM; the dashboard is toggled with `hidden`
- `newtab.css` — two-column layout, light/dark via `prefers-color-scheme`, glassmorphism panels
- `newtab.js` — **all logic** (~1600 lines, single IIFE-free script, `"use strict"`)

Note: comments and commit messages are written in **Chinese**; match that convention when editing.

## Architecture of `newtab.js`

The file is organized into commented sections: icons → data → sidebar → drag-and-drop → content → modals → search → wallpaper → click stats/dashboard.

**Entry point.** Four calls run at load: `init()` (async), then `setupSidebarDnd()`, `setupContentDnd()`, `setupBookmarkListeners()`. `init()` is re-run on every bookmark change to re-render from scratch.

**State.** A module-level `state` object is rebuilt on every `init()`:
- `topChildren` — bookmark-bar direct children in original order
- `topFolders` — the folders among them (these become sidebar entries)
- `allBookmarks` — flattened list, used only for search
- `nodeById` — id→node index over the whole subtree, used for reorder math
- `currentEntryId` — preserved across re-renders so a refresh doesn't jump back to the first folder

`BOOKMARK_BAR_ID = "1"` is Chrome's fixed id for the Bookmarks Bar; the entire tree is read with `chrome.bookmarks.getSubTree("1")`.

**Folder/bookmark distinction:** `isFolder = !node.url`, `isBookmark = !!node.url`.

**Rendering model.** The left sidebar lists top-level folders + loose bookmarks. Selecting a folder calls `buildSections()`, which recursively flattens the folder into a flat array of sections (the folder's own direct bookmarks, then each descendant subfolder as its own section with a `path` array for breadcrumb/indentation). `renderSections()` paints them as `makeGroup` blocks of `makeBookmarkCard`s.

**Auto-refresh + self-move suppression (important).** `setupBookmarkListeners()` subscribes to `onCreated/onRemoved/onChanged/onMoved` and calls `init()` on any change. But drag-and-drop reorders also fire `onMoved`, which would cause a full re-render mid-drag (flicker). To avoid this, moves initiated by the extension push their id into the `selfMoves` Set; the listener does `selfMoves.delete(id)` and returns early, relying on the optimistic DOM update instead. When editing DnD code, keep this contract intact.

**Drag-and-drop** is bidirectional and spans two systems:
- Sidebar DnD (`setupSidebarDnd`) reorders top-level entries.
- Content DnD (`setupContentDnd`) reorders cards/sections within the grid and supports dragging bookmarks *between* the sidebar and content groups in either direction.
- Both ultimately call `chrome.bookmarks.move()`. `reorderWithinParent()` computes the target index from `nextId`/`prevId` neighbors and optionally applies an optimistic local splice to `state.nodeById` so the DOM/state stay consistent without a full re-render.

**Modals.** `showModal({title, confirmText, buildBody, onConfirm})` is the generic dialog factory; all CRUD dialogs (`openRenameDialog`, `openCreateDialog`, `openBookmarkEditDialog`, etc.) build on it and call `chrome.bookmarks.create/update/remove`.

**Icons** are inline Lucide SVGs in the `ICONS` map; `icon(name, cls)` builds an `<svg>` element. Favicons use Chrome's `_favicon` API (`faviconUrl`) with a globe fallback on error.

## Persistence (`chrome.storage.local`)

Three independent features store data locally; keys are namespaced in constant objects:

- **Wallpaper** (`WP`): `wallpaper_key` (Unsplash Access Key), `wallpaper_cache_data` (the image as a base64 data URL), `wallpaper_cache_ts`. On page load only the *cached* image is applied — no network request. Fetching a new image happens only on explicit refresh or when saving a key, via `fetchAndCache` → Unsplash `photos/random`. Caching as base64 makes it restore instantly and work offline. The refresh button is hidden until a key is configured.
- **Click stats** (`STATS`): key `click_events`, array of `{url, title, ts}`. `recordClick` logs on every bookmark click. Writes are **debounced** (`saveStatsTimer`) and **mirrored in memory** (`clickEvents`) to avoid per-click storage overhead. Entries older than `RETAIN_DAYS = 30` are auto-pruned by `pruneOldEvents`.
- **Dashboard** reads the in-memory `clickEvents` mirror and renders summary cards, a per-day bar chart, and a per-bookmark table over a selectable range (Today / 7 / 30 days, `dashboardRange`). It's a full-screen overlay toggled by swapping `hidden` on `#app` vs `#dashboard`.
