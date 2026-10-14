const username = document.getElementById('username');
const enabled = document.getElementById('enabled');
const status = document.getElementById('status');
const form = document.getElementById('settings');
const alertMode = document.getElementById('alert-mode');
const latest = document.getElementById('latest');
const copyLatest = document.getElementById('copy-latest');
let lastText;
async function refreshStatus() {
  const value = await chrome.storage.local.get({ lastCopy: '', lastError: '', lastText: null, lastLogin: '' });
  lastText = value.lastText;
  latest.textContent = lastText === null ? 'No message yet.' : `${value.lastLogin}: ${lastText}`;
  copyLatest.disabled = lastText === null;
  status.textContent = value.lastError ? `Copy error: ${value.lastError}` : value.lastCopy ? `Last copied: ${new Date(value.lastCopy).toLocaleString()}` : 'No messages copied yet.';
}
copyLatest.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(lastText); status.textContent = 'Latest message copied.'; }
  catch (error) { status.textContent = `Copy error: ${error.message}`; }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ['lastText', 'lastCopy', 'lastError'].some(key => changes[key])) refreshStatus();
});
async function load() {
  const value = await chrome.storage.local.get({ username: '', enabled: false, alertMode: 'toast', lastCopy: '', lastError: '' });
  username.value = value.username;
  enabled.checked = value.enabled;
  alertMode.value = value.alertMode === 'desktop' ? 'desktop' : 'toast';
  await refreshStatus();
}
load().catch(error => { status.textContent = error.message; });
form.addEventListener('submit', async event => {
  event.preventDefault();
  const login = username.value.trim().toLowerCase();
  if (enabled.checked && !login) { status.textContent = 'Enter a Twitch login first.'; return; }
  if (login && !/^[a-z0-9_]{1,25}$/.test(login)) { status.textContent = 'Use only letters, numbers, and underscores.'; return; }
  try {
    await chrome.storage.local.set({ username: login, enabled: enabled.checked, alertMode: alertMode.value, lastError: '' });
    username.value = login;
    status.textContent = enabled.checked ? `Saved. Listening for ${login}.` : 'Saved. Copying is disabled.';
  } catch (error) { status.textContent = error.message; }
});
