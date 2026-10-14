const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync('content.js', 'utf8');
const start = source.indexOf('  let audioContext;');
const end = source.indexOf('  // Unlock audio');
const code = source.slice(start, end) + '\nthis.ding = playDing;';
let starts = 0;
let stops = 0;
let blocked = false;
class AudioContext {
  state = 'running'; currentTime = 10; destination = {};
  resume() { return blocked ? Promise.reject(new Error('Autoplay blocked')) : Promise.resolve(); }
  createOscillator() { return { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {}, start() { starts++; }, stop() { stops++; } }; }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
}
(async () => {
  const context = { window: { AudioContext } };
  vm.runInNewContext(code, context);
  context.ding();
  await new Promise(setImmediate);
  assert.equal(starts, 1); assert.equal(stops, 1);
  blocked = true;
  context.ding();
  await new Promise(setImmediate);
  assert.equal(starts, 1);
  const unavailable = { window: {} };
  vm.runInNewContext(code, unavailable);
  assert.doesNotThrow(() => unavailable.ding());
  assert(source.includes("result?.ok && !result.skipped && result.alertMode === 'toast'"));
  assert.equal((source.match(/    playDing\(\);/g) || []).length, 1);
  console.log('PASS: short tone starts/stops, autoplay rejection isolated, missing audio API tolerated, ding only in success-gated page toast.');
})().catch(error => { console.error(error); process.exitCode = 1; });
