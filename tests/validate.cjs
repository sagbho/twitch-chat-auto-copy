const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const path = require('path');
const dir = path.resolve('.');
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json')));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions.sort(), ['clipboardWrite', 'offscreen', 'storage']);
for (const file of [manifest.background.service_worker, manifest.action.default_popup, ...manifest.content_scripts[0].js, 'offscreen.html', 'offscreen.js', 'popup.js', 'popup.css']) assert(fs.existsSync(path.join(dir, file)));
const read = file => fs.readFileSync(path.join(dir, file), 'utf8');
let listener;
let active = 0;
let maximum = 0;
const copied = [];
const settings = { username: 'target', enabled: true };
const chrome = {
  runtime: { id: 'test', getURL: p => 'chrome-extension://test/' + p,
    getContexts: async () => [{}], onMessage: { addListener: fn => listener = fn },
    sendMessage: async msg => { active++; maximum = Math.max(maximum, active); await new Promise(r => setTimeout(r, 5)); copied.push(msg.text); active--; return { ok: true }; }
  },
  storage: { local: { get: async () => settings, set: async () => {} } }
};
vm.runInNewContext(read('background.js'), { chrome });
const sender = { id: 'test', tab: {}, url: 'https://www.twitch.tv/channel' };
const send = (login, text) => new Promise(resolve => listener({ target: 'worker', type: 'copy', login, text }, sender, resolve));
(async () => {
  await Promise.all([send('TARGET', 'one Kappa'), send('target', ' two\n'), send('target_extra', 'wrong')]);
  assert.deepEqual(copied, ['one Kappa', ' two\n']);
  assert.equal(maximum, 1);
  settings.enabled = false;
  await send('target', 'disabled');
  assert.equal(copied.length, 2);
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
  console.log('PASS: manifest/files, exact case-insensitive match, disabled state, serialized writes, offscreen buffer preservation/cleanup.');
})().catch(error => { console.error(error); process.exitCode = 1; });

