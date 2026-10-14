# Twitch Chat Auto Copy

A simple Chrome extension called **Twitch Chat Clipboard**. Choose a Twitch username and automatically copy each new message from that person.

## Download

**[Download the extension ZIP](https://github.com/sagbho/twitch-chat-auto-copy/releases/latest/download/twitch-chat-clipboard.zip)**

## Install

1. Download the ZIP. Right-click it and choose **Extract All**, then **Extract**.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** at the top-right.
4. Click **Load unpacked**.
5. Open the extracted folder, then select the **inner `twitch-chat-clipboard` folder**. This is the folder directly containing **`manifest.json`**, `popup.html`, and the other extension files. Do not select the outer folder created by Extract All.
6. Open **Twitch Chat Clipboard** from Chrome's puzzle-piece Extensions menu.
7. Enter the Twitch login username (without @), check **Automatically copy new messages**, and click **Save**.
8. Open or refresh Twitch and keep the chat open.

If Chrome says **"Manifest file is missing or unreadable"**, go one folder deeper and select the inner folder containing `manifest.json`.

## Use

Each new matching message replaces your clipboard. Paste it wherever you need it. In the popup, choose your **Copied-message alert** and click **Save**:

- **Page toast** (default): a bottom-right toast on Twitch shows the exact copied text.
- **Desktop notification**: a **Copied message** notification includes the text while you use another tab or app. Your operating system may shorten long text. Only the latest notification is kept.

You get only the selected alert, never both. **Copy latest** copies again without an automatic alert.

Keep Twitch chat open in a tab. Chrome must be running, and Chrome/extension notifications must be allowed in your operating system. Background tabs can pause chat updates; messages must arrive in the open chat to be copied.

Turn the switch off and click **Save** to stop. The popup also shows the latest copied message and a **Copy latest** button.

## Update

Download and extract the new ZIP. Replace the files in your existing extension folder, then click **Reload** for Twitch Chat Clipboard at `chrome://extensions` and refresh Twitch. Version 1.1 adds the **notifications** permission; approve it if Chrome asks. If alerts are hidden, check Chrome's notification settings in your operating system and Do Not Disturb.

If this helps, a GitHub star is welcome!
