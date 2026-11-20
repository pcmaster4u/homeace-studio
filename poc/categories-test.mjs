// POC step 1: can HA categories carry a nesting path like "Haus/Terrasse"?
//
// Usage (from the project root, Node 22+):
//   node --env-file=.env poc/categories-test.mjs            list only (read-only)
//   node --env-file=.env poc/categories-test.mjs --write    create, rename and delete test categories
//   node --env-file=.env poc/categories-test.mjs --keep     like --write, but keep them to look at in the HA UI
//   node --env-file=.env poc/categories-test.mjs --cleanup  delete leftover test categories
//
// Test categories always start with "HomeAce-Test". Nothing else is touched.

const SCOPES = ['automation', 'script', 'scene', 'helpers'];
const PREFIX = 'HomeAce-Test';
const args = new Set(process.argv.slice(2));
const mode = args.has('--cleanup') ? 'cleanup' : args.has('--keep') ? 'keep' : args.has('--write') ? 'write' : 'list';

const { HA_URL, HA_TOKEN } = process.env;
if (!HA_URL || !HA_TOKEN) {
  console.error('HA_URL and HA_TOKEN missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

let failures = 0;
const check = (ok, label, detail = '') => {
  if (!ok) failures++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
};

// ---- minimal HA WebSocket client -------------------------------------------
function connect() {
  const wsUrl = HA_URL.replace(/^http/, 'ws').replace(/\/$/, '') + '/api/websocket';
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  let nextId = 1;
  let haVersion = '?';

  const ready = new Promise((resolve, reject) => {
    ws.onerror = () => reject(new Error(`Cannot connect to ${wsUrl}`));
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'auth_required') ws.send(JSON.stringify({ type: 'auth', access_token: HA_TOKEN }));
      else if (msg.type === 'auth_ok') {
        haVersion = msg.ha_version;
        resolve();
      } else if (msg.type === 'auth_invalid') reject(new Error('Token rejected: ' + msg.message));
      else if (msg.type === 'result' && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.success ? res(msg.result) : rej(new Error(`${msg.error?.code}: ${msg.error?.message}`));
      }
    };
  });

  const call = (type, data = {}) =>
    new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, type, ...data }));
    });

  return { ready, call, close: () => ws.close(), version: () => haVersion };
}

// ---- category registry helpers ----------------------------------------------
const list = (ha, scope) => ha.call('config/category_registry/list', { scope });
const create = (ha, scope, name) => ha.call('config/category_registry/create', { scope, name });
const rename = (ha, scope, category_id, name) => ha.call('config/category_registry/update', { scope, category_id, name });
const remove = (ha, scope, category_id) => ha.call('config/category_registry/delete', { scope, category_id });

async function showExisting(ha) {
  console.log('\nExisting categories:');
  for (const scope of SCOPES) {
    const cats = await list(ha, scope);
    const names = cats.map((c) => c.name).sort((a, b) => a.localeCompare(b, 'de'));
    const nested = names.filter((n) => n.includes('/')).length;
    console.log(`  ${scope.padEnd(10)} ${cats.length} total, ${nested} with "/": ${names.join(', ') || '(none)'}`);
  }
}

async function cleanup(ha) {
  let n = 0;
  for (const scope of SCOPES) {
    for (const c of await list(ha, scope)) {
      if (c.name.startsWith(PREFIX)) {
        await remove(ha, scope, c.category_id);
        n++;
      }
    }
  }
  console.log(`\nCleanup: ${n} test categories deleted.`);
}

async function writeTest(ha) {
  for (const scope of SCOPES) {
    console.log(`\nScope "${scope}":`);
    const parent = await create(ha, scope, PREFIX);
    const child = await create(ha, scope, `${PREFIX}/Terrasse`);
    const grandchild = await create(ha, scope, `${PREFIX}/Terrasse/Beleuchtung`);
    check(child.name === `${PREFIX}/Terrasse`, 'name with one "/" stored unchanged', child.name);
    check(grandchild.name === `${PREFIX}/Terrasse/Beleuchtung`, 'name with two "/" stored unchanged', grandchild.name);

    const names = (await list(ha, scope)).map((c) => c.name);
    check([parent, child, grandchild].every((c) => names.includes(c.name)), 'all three appear in the list');

    // Renaming the parent means renaming every path below it, like the tree does.
    const to = `${PREFIX}-Neu`;
    await rename(ha, scope, parent.category_id, to);
    await rename(ha, scope, child.category_id, `${to}/Terrasse`);
    await rename(ha, scope, grandchild.category_id, `${to}/Terrasse/Beleuchtung`);
    const after = (await list(ha, scope)).find((c) => c.category_id === grandchild.category_id);
    check(after?.name === `${to}/Terrasse/Beleuchtung`, 'rename of a nested path keeps its id', after?.name);

    // A duplicate name must be refused, otherwise the tree could get two identical nodes.
    let duplicateRefused = false;
    try {
      const dup = await create(ha, scope, `${to}/Terrasse`);
      await remove(ha, scope, dup.category_id);
    } catch {
      duplicateRefused = true;
    }
    check(duplicateRefused, 'duplicate name is refused by HA');
  }
}

// ---- main -------------------------------------------------------------------
const ha = connect();
try {
  await ha.ready;
  console.log(`Connected to Home Assistant ${ha.version()}, mode: ${mode}`);
  await showExisting(ha);
  if (mode === 'cleanup') await cleanup(ha);
  if (mode === 'write' || mode === 'keep') {
    try {
      await writeTest(ha);
    } finally {
      if (mode === 'write') await cleanup(ha);
      else console.log(`\nTest categories kept. Look at them in HA, then run with --cleanup.`);
    }
    console.log(failures ? `\n${failures} check(s) failed.` : '\nAll checks passed.');
  }
} catch (err) {
  console.error('\nError:', err.message);
  failures++;
} finally {
  ha.close();
  process.exitCode = failures ? 1 : 0;
}
