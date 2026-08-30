# Ctrl-Q

Press **Ctrl+Q** to jump back to the tab you were just on. Press it again to come back.
That's the whole extension.

It tracks tab activity across every window, so "the last tab" means the last tab you actually
looked at — not just the last one in the current window.

## Install

Chrome can only install unpacked extensions from a folder on disk, so start by getting one:

```bash
git clone https://github.com/tiagowhuber/ctrl-q.git
```

Then load it:

1. Open `chrome://extensions`
2. Turn on **Developer mode** (toggle, top right)
3. Click **Load unpacked** and select the `ctrl-q` folder
4. Ctrl-Q appears in the list — that's it, it's live

The folder has to stay where it is. Chrome loads an unpacked extension from that path every
time it starts, so moving or deleting it uninstalls the extension.

### If Ctrl+Q doesn't do anything

Chrome, not the extension, owns the key binding, and it silently skips a suggested shortcut
that something else already claimed. Open `chrome://extensions/shortcuts`, find **Ctrl-Q**,
click the box next to "Switch to the last used tab", and press your keys.

On macOS the default is `Ctrl+Q`, since `Cmd+Q` quits the browser.

## Updating

```bash
git pull
```

Then hit the refresh icon on the Ctrl-Q card in `chrome://extensions`.

## How it works

Chrome gives every tab a `lastAccessed` timestamp, but it only moves when a tab becomes active
*within its own window* — switching between browser windows leaves it untouched, so on its own
it gets the answer wrong the moment you use two windows.

So `background.js` keeps its own timestamps in `chrome.storage.session`, updated on both tab
activation and window focus, and ranks each tab by whichever signal is newer. Session storage
survives the service worker being shut down and never touches disk.

## Files

- `manifest.json` — permissions (`tabs`, `storage`) and the shortcut
- `background.js` — tracks which tab was used when, and does the swap
- `icons/` — toolbar and extensions-page icons

## Permissions

- `tabs` — read the tab list and switch between tabs
- `storage` — remember the ordering across service-worker restarts

No host permissions: the extension never reads page content, and nothing leaves the browser.
