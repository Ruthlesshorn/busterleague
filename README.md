# Buster League Draft 2026

A fantasy baseball draft app with real-time sync via Firebase.

## Pages

| Page | URL | Access |
|---|---|---|
| Dashboard | `index.html` | Public |
| Team View | `myteam.html` | Team login required |
| Draft Board | `draft.html` | Admin only |
| Login | `login.html` | — |

## Running Locally

The app fetches `players.json` at runtime, so the files must be served over HTTP.
Opening HTML files directly (via `file://`) will not work.

**Option 1 — VS Code Live Server** *(easiest)*
Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer),
right-click `index.html` in the file explorer, and choose **Open with Live Server**.

**Option 2 — Node.js**
```bash
npx serve .
```

**Option 3 — Python**
```bash
python -m http.server 8080
# or on some systems:
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## File Structure

```
├── index.html        # Public dashboard
├── draft.html        # Admin draft board
├── myteam.html       # Per-team view
├── login.html        # Login page
├── players.json      # Player dataset (701 players, shared by all pages)
└── draft-utils.js    # Shared JS utilities (loaded by index.html and draft.html)
```

## Deployment

This is a static site — drop the files anywhere that serves HTML.
The app uses Firebase Realtime Database for live draft sync across all users.
