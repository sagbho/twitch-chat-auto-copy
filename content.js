(() => {
  const LINE = '[data-a-target="chat-line-message"]';
  const LOG = '[data-a-target="chat-scroller"] .chat-scrollable-area__message-container, .chat-scrollable-area__message-container';
  const seen = new WeakSet();
  const logs = new WeakSet();
  let settings = { username: '', enabled: false };
  let toastHost;
  let toastTimer;
  let audioContext;
  function playDing() {
    // A page interaction may be needed before Chrome permits audio playback.
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      audioContext ||= new Audio();
      Promise.resolve(audioContext.resume()).then(() => {
        if (audioContext.state !== 'running') return;
        const now = audioContext.currentTime;
        const tone = audioContext.createOscillator();
        const volume = audioContext.createGain();
        tone.type = 'sine';
        tone.frequency.setValueAtTime(660, now);
        volume.gain.setValueAtTime(0, now);
        volume.gain.linearRampToValueAtTime(0.06, now + 0.025);
        volume.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        tone.connect(volume);
        volume.connect(audioContext.destination);
        tone.onended = () => { tone.disconnect(); volume.disconnect(); };
        tone.start(now);
        tone.stop(now + 0.3);
      }).catch(() => {});
    } catch (_) { /* Audio is best-effort; copying and the toast still work. */ }
  }
  // Unlock audio on a real page interaction without playing an extra ding.
  document.addEventListener('pointerdown', () => {
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
  }, { passive: true });
  function showCopiedToast(text) {
    clearTimeout(toastTimer);
    toastHost?.remove();
    toastHost = document.createElement('div');
    toastHost.style.cssText = 'all:initial;position:fixed;right:20px;bottom:20px;z-index:2147483647;display:block;';
    const shadow = toastHost.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      .toast { box-sizing: border-box; width: min(360px, calc(100vw - 40px)); padding: 14px 16px;
        border: 1px solid #a970ff; border-radius: 10px; background: #18181b; color: #efeff1;
        box-shadow: 0 6px 28px #0008; font: 14px/1.5 system-ui, sans-serif; }
      strong { display: block; margin-bottom: 6px; color: #d9bdff; }
      .message { white-space: pre-wrap; overflow-wrap: anywhere; max-height: min(240px, 40vh); overflow: auto; }
    `;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    const title = document.createElement('strong');
    title.textContent = 'Copied message';
    const body = document.createElement('div');
    body.className = 'message';
    body.textContent = text;
    toast.append(title, body);
    shadow.append(style, toast);
    document.documentElement.append(toastHost);
    playDing();
    toastTimer = setTimeout(() => { toastHost?.remove(); toastHost = undefined; }, 6000);
  }
  chrome.storage.local.get(settings).then(value => { settings = value; });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of ['username', 'enabled']) {
      if (changes[key]) settings[key] = changes[key].newValue;
    }
  });
  function messageText(root) {
    if (root.nodeType === Node.TEXT_NODE) return root.nodeValue;
    if (root.nodeType !== Node.ELEMENT_NODE) return '';
    if (root.tagName === 'IMG') return root.getAttribute('alt') || '';
    if (root.tagName === 'BR') return '\n';
    return Array.from(root.childNodes, messageText).join('');
  }
  function process(line) {
    if (seen.has(line)) return;
    const author = line.querySelector('[data-a-user]');
    const body = line.querySelector('[data-a-target="chat-line-message-body"]');
    // Wait for Twitch to finish inserting the author and body.
    if (!author || !body) return;
    seen.add(line);
    const login = author.getAttribute('data-a-user') || '';
    if (!settings.enabled || !settings.username || login.toLowerCase() !== settings.username.toLowerCase()) return;
    const text = messageText(body);
    chrome.runtime.sendMessage({ target: 'worker', type: 'copy', login, text })
      .then(result => { if (result?.ok && !result.skipped && result.alertMode === 'toast') showCopiedToast(text); })
      .catch(error => console.debug('Twitch Chat Clipboard:', error.message));
  }
  function attach() {
    document.querySelectorAll(LOG).forEach(log => {
      if (logs.has(log)) return;
      logs.add(log);
      // Existing messages are history, including when a channel is first opened.
      log.querySelectorAll(LINE).forEach(line => seen.add(line));
      new MutationObserver(records => {
        const candidates = new Set();
        for (const record of records) {
          if (record.target instanceof Element) {
            const line = record.target.closest(LINE);
            if (line) candidates.add(line);
          }
          for (const node of record.addedNodes) {
            if (!(node instanceof Element)) continue;
            if (node.matches(LINE)) candidates.add(node);
            node.querySelectorAll(LINE).forEach(line => candidates.add(line));
          }
        }
        candidates.forEach(process);
      }).observe(log, { childList: true, subtree: true });
    });
  }
  attach();
  // Twitch navigates between channels without a full page load.
  new MutationObserver(attach).observe(document.documentElement, { childList: true, subtree: true });
})();



