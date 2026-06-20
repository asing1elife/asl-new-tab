# ASL New Tab

A custom Chrome new tab page that turns your native bookmarks into a beautiful, organized portal. Click any bookmark to open it in a new tab.

## Why

Chrome's native bookmark bar opens bookmarks in the **current** tab. This extension replaces the new tab page with a two-panel portal — folders and loose bookmarks on the left, detailed contents on the right — so every click opens a fresh tab.

## Features

- **Override Chrome's new tab page** via `chrome_url_overrides.newtab`
- **Reads native bookmarks** through `chrome.bookmarks` API — no manual data upkeep
- **Left sidebar**: top-level folders and loose bookmarks from the bookmark bar, drag-reorderable within the sidebar
- **Right content area**: selected folder's bookmarks rendered in recursive sub-directory sections with tree-line indentation
- **Click to open** — bookmarks always open in a new tab
- **Bidirectional drag-and-drop** — reorder items within sidebar or content grids; drag bookmarks between the sidebar and any folder group in either direction
- **Full CRUD** — create, rename, and delete folders and bookmarks via modal dialogs; add subfolders and bookmarks to any directory
- **Search** — global filter across all bookmarks by title or URL
- **Favicons** — real website favicons via Chrome's `_favicon` API, with a fallback globe icon on error
- **Auto-refresh** — listens for bookmark create / update / delete / move events and re-renders automatically
- **Dark mode** — light and dark color schemes via `prefers-color-scheme`, with a pink-to-orange gradient background and glassmorphism panels
- **Unsplash wallpapers** — set a personal background from Unsplash's landscape photos; add your Access Key in **Settings**, hit **refresh** for a new image. The picture is cached as a base64 data URL in `chrome.storage.local`, so it restores instantly on every new tab — even offline. The translucent glassmorphism panels let the wallpaper glow through behind your bookmarks.

## Install (Developer Mode)

1. Open `chrome://extensions/`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this project folder
4. Open a new tab to see the result

## Wallpaper Setup (optional)

1. Get a free **Access Key** at [unsplash.com/developers](https://unsplash.com/developers) (create an app — the demo tier is enough)
2. Click the **⚙️ Settings** button in the sidebar and paste your key
3. A landscape wallpaper loads immediately and is cached locally
4. Use the **↻ refresh** button (shown once a key is set) to fetch a new image anytime
5. To turn it off, open Settings and **Remove Key**

## Project Structure

```
.
├── manifest.json     # MV3 configuration
├── newtab.html       # Page structure
├── newtab.css        # Styles (two-column layout, light/dark, glassmorphism)
├── newtab.js         # Bookmark rendering, drag-and-drop, CRUD, search, wallpaper logic
└── icons/            # Extension icons (16, 48, 128)
```

## Permissions

| Permission | Purpose |
|---|---|
| `bookmarks` | Read and modify the native Chrome bookmark tree |
| `favicon` | Load website favicons via `chrome://favicon/` |
| `storage` | Persist the Unsplash Access Key and cached wallpaper |

## Tech Stack

- **Manifest V3** Chrome extension
- **Zero dependencies** — vanilla HTML, CSS, and JavaScript
- **Lucide icons** — embedded inline SVGs (MIT licensed)
