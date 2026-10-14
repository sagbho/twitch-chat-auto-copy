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

Each new matching message replaces your clipboard. Paste it wherever you need it. A bottom-right **Copied message** toast shows the exact text copied.

Turn the switch off and click **Save** to stop. The popup also shows the latest copied message and a **Copy latest** button.

If this helps, a GitHub star is welcome!
