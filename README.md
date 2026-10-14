# Twitch Chat Auto Copy — Chrome extension

Type a Twitch username, turn copying on, and save. Each new chat message from that person automatically replaces your clipboard. A small **Copied message** toast at the bottom-right shows exactly what was copied.

**[Download the extension ZIP](https://github.com/sagbho/twitch-chat-auto-copy/releases/latest/download/twitch-chat-clipboard.zip)** · [Latest release](https://github.com/sagbho/twitch-chat-auto-copy/releases/latest)

No Chrome Web Store installation, Twitch password, or API key is needed.

## Install (Chrome 116 or later)
1. Download the ZIP above and unzip it to a permanent folder (right-click → **Extract All** on Windows).
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked**, open the extracted folder, and select the `twitch-chat-clipboard` folder containing `manifest.json`.
4. Open the extension popup from Chrome's puzzle-piece Extensions menu. Enter the exact Twitch **login username** (no @), check **Automatically copy new messages**, and click **Save**.
5. Open or refresh your Twitch channel chat. Leave chat open. New messages from that login replace your system clipboard automatically; paste elsewhere to check.

The switch takes effect when you click Save. Turn it off and Save to stop copying. The popup shows the last successfully copied message and time; **Copy latest** copies that saved message again, even when automatic copying is disabled. Refresh existing Twitch tabs after installing or reloading the extension.

## Behavior and limitations
- Exact, case-insensitive login matching; display names are not used.
- Copies only the message body, preserving whitespace and image emote alt text; excludes username, timestamp, and badges.
- Existing DOM messages are ignored when a chat container is first detected. Messages arriving after that are observed. Twitch may insert delayed backlog as new DOM nodes; those cannot reliably be distinguished from live messages using the page alone.
- Each matching message overwrites the previous clipboard, with writes serialized across open Twitch tabs. Multiple tabs may produce duplicate copies; keep one chat open when order matters.
- After each confirmed automatic copy, a bottom-right **Copied message** toast displays the exact copied text for six seconds. Long text wraps and scrolls. A newer successful copy replaces the toast.
- Twitch can pause or unload chat in background tabs. Only messages rendered in an open chat can be observed. No chat history, whispers, deleted-message recovery, or API connection is provided.
- Twitch DOM selectors may change. If copying stops, check the popup for a clipboard error and inspect `content.js` selectors.
- Local settings, the last successfully copied message/login, and last copy time/error are stored on this Chrome profile. The saved message remains until another is copied or the extension is uninstalled. Nothing is sent to any server. The extension never sends chat messages and does not read your clipboard.

## Permissions
`storage`: popup settings and copy status. `offscreen`: hidden packaged clipboard document. `clipboardWrite`: automatic clipboard replacement. The content script runs only on `https://www.twitch.tv/*`; no tabs, clipboardRead, or broad host permission is requested.

Uses Chrome's offscreen CLIPBOARD pattern: https://developer.chrome.com/docs/extensions/reference/api/offscreen

## Validation
JavaScript syntax, manifest/file references, and mocked message-processing/clipboard pipeline checks were run locally. No live Twitch or real Chrome clipboard verification was performed. Test with a new message from the configured account before relying on it.

## Development
The extension uses plain JavaScript and Manifest V3. There are no dependencies or build steps. Edit the files, reload at `chrome://extensions`, and refresh Twitch. Run `node tests/validate.cjs` and `node tests/validate-toast.cjs` from the repository root for the mocked checks.

If this little tool helps you, a GitHub star is welcome. Report issues with your Chrome version and what happened; avoid posting private clipboard contents.
