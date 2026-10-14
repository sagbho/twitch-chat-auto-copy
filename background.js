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
    const settings = await chrome.storage.local.get({ username: '', enabled: false, alertMode: 'toast' });
    if (!settings.enabled || message.login.toLowerCase() !== settings.username.toLowerCase()) {
      return { ok: true, skipped: true };
    }
    try {
      await ensureOffscreen();
      const result = await chrome.runtime.sendMessage({ target: 'offscreen', text: message.text });
      if (!result?.ok) throw new Error(result?.error || 'Clipboard write failed');
      await chrome.storage.local.set({ lastCopy: new Date().toISOString(), lastText: message.text, lastLogin: message.login, lastError: '' });
      // Notification errors must never turn a successful copy into a copy failure.
      const alertMode = settings.alertMode === 'desktop' ? 'desktop' : 'toast';
      try {
        if (alertMode === 'desktop') {
        await chrome.notifications.clear('latest-copied-message');
        await chrome.notifications.create('latest-copied-message', {
          type: 'basic', iconUrl: 'icon128.png', title: 'Copied message',
          message: message.text, contextMessage: message.login
        });
        }
      } catch (error) {
        console.debug('Twitch Chat Clipboard notification:', error.message);
      }
      return { ok: true, alertMode };
    } catch (error) {
      await chrome.storage.local.set({ lastError: error.message });
      return { ok: false, error: error.message };
    }
  });
  queue.then(reply, error => reply({ ok: false, error: error.message }));
  return true;
});

