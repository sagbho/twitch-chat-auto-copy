const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const roots = [];
let timer;
function element(tag) {
  return { tag, style: {}, children: [], textContent: '',
    append(...nodes) { this.children.push(...nodes); },
    setAttribute() {}, remove() { this.removed = true; },
    attachShadow() { this.shadow = element('shadow'); return this.shadow; }
  };
}
const root = element('html');
root.append = node => roots.push(node);
const text = ' <img src=x onerror=alert(1)>\nKappa ' + 'long '.repeat(300);
const source = fs.readFileSync('content.js', 'utf8');
vm.runInNewContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.showToast = showCopiedToast; })();'), {
  chrome: { storage: { local: { get: async x => x }, onChanged: { addListener() {} } } },
  document: { createElement: element, documentElement: root, querySelectorAll: () => [] },
  MutationObserver: class { observe() {} },
  clearTimeout() {}, setTimeout: fn => { timer = fn; return 1; },
  globalThis: global.toastTest = {}
});
global.toastTest.showToast(text);
const toast = roots[0].shadow.children[1];
assert.equal(toast.children[0].textContent, 'Copied message');
assert.equal(toast.children[1].textContent, text);
assert(roots[0].shadow.children[0].textContent.includes('overflow: auto'));
global.toastTest.showToast('next');
assert.equal(roots[0].removed, true);
timer();
assert.equal(roots[1].removed, true);
assert(source.includes('if (result?.ok && !result.skipped) showCopiedToast(text)'));
console.log('PASS: toast literal text, long-message scrolling, replacement, dismissal, success-only guard.');

