chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || message?.target !== 'offscreen' || typeof message.text !== 'string') return;
  const buffer = document.getElementById('clipboard');
  try {
    // Offscreen documents cannot be focused; use Chrome's offscreen clipboard pattern.
    buffer.value = message.text;
    buffer.select();
    if (!document.execCommand('copy')) throw new Error('Chrome refused the clipboard write');
    reply({ ok: true });
  } catch (error) {
    reply({ ok: false, error: error.message });
  } finally {
    buffer.value = '';
  }
});
