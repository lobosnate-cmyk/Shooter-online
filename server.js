// Trance Royale public server.
// Serves the game page and relays every player's live state over WebSockets,
// so anyone with the link can join the same trading floor. No login needed.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS || 16);
const TICK_MS = 50; // 20 snapshots a second

// The game file is a page fragment (it also runs as a claude.ai artifact).
// Wrap it in a full document and tell it to use this server for multiplayer.
function buildPage() {
  const frag = fs.readFileSync(path.join(__dirname, 'public', 'game.html'), 'utf8');
  const titleMatch = frag.match(/<title>[\s\S]*?<\/title>/i);
  const title = titleMatch ? titleMatch[0] : '<title>Trance Royale</title>';
  const body = frag.replace(title, '');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
    '<meta name="theme-color" content="#0b1022">' + title +
    '<meta property="og:title" content="Trance Royale"><meta property="og:description" content="First-person trading-floor battle royale. Kills are profit, three stop-outs and you\'re in a Trance.">' +
    '<style>:root{color-scheme:dark;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>' +
    '<script>window.__TR_SERVER=1</script></head><body>' + body + '</body></html>';
}
const DEV = process.env.NODE_ENV !== 'production';
let page = buildPage();

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  if (url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, players: clients.size }));
    return;
  }
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache' });
    if (DEV) { try { page = buildPage(); } catch (e) {} } // pick up edits while developing
    res.end(page);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain' });
  res.end('Not found');
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024, perMessageDeflate: { threshold: 512 } });
const clients = new Map();
let seq = 0;

wss.on('connection', (ws) => {
  if (clients.size >= MAX_PLAYERS) {
    ws.send(JSON.stringify({ type: 'full' }));
    ws.close(1013, 'full');
    return;
  }
  const id = 'p' + (++seq).toString(36) + Math.random().toString(36).slice(2, 6);
  const c = { id, ws, p: null, alive: true, win: Date.now(), count: 0 };
  clients.set(id, c);
  ws.send(JSON.stringify({ type: 'welcome', id, t: Date.now() }));

  ws.on('pong', () => { c.alive = true; });
  ws.on('message', (buf) => {
    // simple flood guard: at most 60 messages a second per player
    const t = Date.now();
    if (t - c.win > 1000) { c.win = t; c.count = 0; }
    if (++c.count > 60) return;
    let m;
    try { m = JSON.parse(buf); } catch (e) { return; }
    if (!m || typeof m !== 'object') return;
    if (m.type === 'state' && m.p && typeof m.p === 'object' && !Array.isArray(m.p)) c.p = m.p;
    else if (m.type === 'ping') ws.send(JSON.stringify({ type: 'pong', c: Number(m.c) || 0, t: Date.now() }));
  });
  ws.on('close', () => clients.delete(id));
  ws.on('error', () => {});
});

// broadcast everyone's latest state
setInterval(() => {
  if (!clients.size) return;
  const peers = [];
  for (const c of clients.values()) if (c.p) peers.push({ id: c.id, p: c.p });
  const msg = JSON.stringify({ type: 'snap', t: Date.now(), n: clients.size, peers });
  for (const c of clients.values()) {
    if (c.ws.readyState === 1 && c.ws.bufferedAmount < 512 * 1024) c.ws.send(msg);
  }
}, TICK_MS);

// drop connections that stopped answering
setInterval(() => {
  for (const c of clients.values()) {
    if (!c.alive) { c.ws.terminate(); clients.delete(c.id); continue; }
    c.alive = false;
    try { c.ws.ping(); } catch (e) {}
  }
}, 15000);

server.listen(PORT, () => console.log('Trance Royale floor open on port ' + PORT));
