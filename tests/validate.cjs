const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const path = require('path');
const dir = path.resolve('.');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json')));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions.sort(), ['clipboardWrite', 'notifications', 'offscreen', 'storage']);
for (const file of [manifest.background.service_worker, manifest.action.default_popup, ...manifest.content_scripts[0].js, 'offscreen.html', 'offscreen.js', 'popup.js', 'popup.css', 'icon128.png']) assert(fs.existsSync(path.join(dir, file)));
const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
let listener;
let active = 0;
let maximum = 0;
const copied = [];
const notifications = [];
let notificationFailure = false;
let copyFailure = false;
const settings = { username: 'target', enabled: true, alertMode: 'desktop' };
const chrome = {
  runtime: { id: 'test', getURL: p => 'chrome-extension://test/' + p,
    getContexts: async () => [{}], onMessage: { addListener: fn => listener = fn },
    sendMessage: async msg => { active++; maximum = Math.max(maximum, active); await new Promise(r => setTimeout(r, 5)); active--; if (copyFailure) return { ok: false, error: 'Copy denied' }; copied.push(msg.text); return { ok: true }; }
  },
  notifications: { clear: async id => { assert.equal(id, 'latest-copied-message'); }, create: async (id, options) => { if (notificationFailure) throw new Error('Notifications denied'); assert(copied.includes(options.message)); notifications.push({id, ...options}); return id; } },
  storage: { local: { get: async () => settings, set: async () => {} } }
};
vm.runInNewContext(read('background.js'), { chrome, console });
const sender = { id: 'test', tab: {}, url: 'https://www.twitch.tv/channel' };
const send = (login, text) => new Promise(resolve => listener({ target: 'worker', type: 'copy', login, text }, sender, resolve));
(async () => {
  await Promise.all([send('TARGET', 'one Kappa'), send('target', ' two\n'), send('target_extra', 'wrong')]);
  assert.deepEqual(copied, ['one Kappa', ' two\n']);
  assert.equal(maximum, 1);
  settings.enabled = false;
  await send('target', 'disabled');
  assert.equal(copied.length, 2);
  assert.deepEqual(notifications.map(n => n.message), ['one Kappa', ' two\n']);
  assert(notifications.every(n => n.title === 'Copied message' && n.iconUrl === 'icon128.png'));
  settings.enabled = true;
  copyFailure = true;
  assert.equal((await send('target', 'failed')).ok, false);
  assert.equal(notifications.length, 2);
  copyFailure = false;
  notificationFailure = true;
  assert.equal((await send('target', 'copied without alert')).ok, true);
  assert.equal(copied.at(-1), 'copied without alert');
  assert.equal(notifications.length, 2);
  notificationFailure = false;
  settings.alertMode = 'toast';
  assert.equal((await send('target', 'page only')).alertMode, 'toast');
  assert.equal(notifications.length, 2);
  delete settings.alertMode;
  assert.equal((await send('target', 'default page')).alertMode, 'toast');
  assert.equal(notifications.length, 2);
  settings.alertMode = 'desktop';
  assert.equal((await send('target', 'desktop only')).alertMode, 'desktop');
  assert.equal(notifications.length, 3);
  assert(read('content.js').includes("result.alertMode === 'toast'"));
  let offscreenListener;
  const buffer = { value: '', select() {} };
  let actual;
  vm.runInNewContext(read('offscreen.js'), {
    chrome: { runtime: { id: 'test', onMessage: { addListener: fn => offscreenListener = fn } } },
    document: { getElementById: () => buffer, execCommand: cmd => { assert.equal(cmd, 'copy'); actual = buffer.value; return true; } }
  });
  let result;
  offscreenListener({ target: 'offscreen', text: ' hello Kappa\n' }, { id: 'test' }, r => result = r);
  assert.equal(result.ok, true);
  assert.equal(actual, ' hello Kappa\n');
  assert.equal(buffer.value, '');
  console.log('PASS: manifest/files, exact match, disabled state, serialized copies, clipboard text, success-only alerts, notification failure isolation, both alert modes, default toast and exclusivity.');
})().catch(error => { console.error(error); process.exitCode = 1; });


