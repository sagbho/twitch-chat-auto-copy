let queue = Promise.resolve();
let creating;
async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });
  if (contexts.length) return;
  if (!creating) {
    creating = chrome.offscreen.createDocument({
      url: 'offscreen.html', reasons: ['CLIPBOARD'],
      justification: 'Copy newly arriving messages from the configured Twitch login.'
    }).finally(() => { creating = undefined; });
  }
  await creating;
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message?.target !== 'worker' || message.type !== 'copy') return;
  if (sender.id !== chrome.runtime.id || !sender.tab ||
      !sender.url?.startsWith('https://www.twitch.tv/') ||
      typeof message.text !== 'string' || typeof message.login !== 'string') return;
  queue = queue.catch(() => {}).then(async () => {
    const settings = await chrome.storage.local.get({ username: '', enabled: false });
    if (!settings.enabled || message.login.toLowerCase() !== settings.username.toLowerCase()) {
      return { ok: true, skipped: true };
    }
    try {
      await ensureOffscreen();
      const result = await chrome.runtime.sendMessage({ target: 'offscreen', text: message.text });
      if (!result?.ok) throw new Error(result?.error || 'Clipboard write failed');
      await chrome.storage.local.set({ lastCopy: new Date().toISOString(), lastText: message.text, lastLogin: message.login, lastError: '' });
      return { ok: true };
    } catch (error) {
      await chrome.storage.local.set({ lastError: error.message });
      return { ok: false, error: error.message };
    }
  });
  queue.then(reply, error => reply({ ok: false, error: error.message }));
  return true;
});

