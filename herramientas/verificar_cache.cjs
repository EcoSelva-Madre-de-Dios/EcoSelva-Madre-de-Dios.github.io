/* Regresión: una publicación nueva no debe recibir recursos de otra versión. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const handlers = {};
const stored = new Map();
let offline = false;
const removed = [];
const key = request => typeof request === 'string' ? request : request.url;
const cache = {
  async put(request, response) { stored.set(key(request), await response.text()); },
};
vm.runInNewContext(fs.readFileSync('service-worker.js', 'utf8'), {
  URL, Response,
  self: {
    location: { origin: 'https://example.com' },
    addEventListener(type, handler) { handlers[type] = handler; },
    clients: { async claim() {} },
  },
  caches: {
    async open() { return cache; },
    async keys() { return ['ecoselva-old', 'other-app']; },
    async delete(name) { removed.push(name); },
    async match(request, options) {
      let entry = key(request);
      if (options?.ignoreSearch) entry = [...stored.keys()].find(value => value.split('?')[0] === entry.split('?')[0]);
      return stored.has(entry) ? new Response(stored.get(entry)) : undefined;
    },
  },
  async fetch(request) {
    if (offline) throw new Error('offline');
    return new Response('actual: ' + key(request));
  },
});
async function load(url) {
  const pending = [];
  let result;
  handlers.fetch({
    request: new Request(url),
    waitUntil(promise) { pending.push(promise); },
    respondWith(promise) { result = promise; },
  });
  const response = await result;
  await Promise.all(pending);
  return response.text();
}
(async () => {
  const url = 'https://example.com/assets/eco-base.js';
  stored.set(url, 'versión anterior');
  assert.equal(await load(url + '?v=nueva'), 'actual: ' + url + '?v=nueva');
  offline = true;
  assert.equal(await load(url + '?v=nueva'), 'actual: ' + url + '?v=nueva');
  assert.equal(await load(url + '?v=otra'), 'versión anterior');
  let activation;
  handlers.activate({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(removed, ['ecoselva-old']);
  console.log('Correcto: recursos nuevos, lectura offline y cachés ajenas conservadas.');
})().catch(error => { console.error(error); process.exitCode = 1; });
