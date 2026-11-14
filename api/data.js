// خادم صغير على Vercel: يحفظ البيانات في Redis (Upstash) ويتحقق من كلمة سر المشرف
const U = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const T = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const C = ['graduates', 'posts', 'events', 'settings'];
const kv = async (cmds) => {
  const r = await fetch(U + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + T }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('storage ' + r.status);
  return (await r.json()).map((x) => x.result);
};
const parse = (a) => { const o = []; for (let i = 0; i < (a || []).length; i += 2) { try { o.push(JSON.parse(a[i + 1])); } catch (e) {} } return o; };
const load = async () => { const r = await kv(C.map((c) => ['HGETALL', 'rm:' + c])); const d = {}; C.forEach((c, i) => (d[c] = parse(r[i]))); return d; };
const pub = (d) => ({ graduates: d.graduates || [], posts: d.posts || [], events: d.events || [], settings: (d.settings || []).find((s) => s.id === 'site') || {} });
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!U || !T) return res.status(500).json({ error: 'storage-not-connected' });
    if (req.method === 'GET') return res.json(pub(await load()));
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const AP = process.env.ADMIN_PASSWORD;
    if (!(b.who === 'admin' && AP && b.pass === AP)) return res.status(401).json({ error: 'auth' });
    if (b.op === 'login') return res.json({ role: 'admin' });
    const c = b.coll;
    if (!C.includes(c)) return res.status(400).json({ error: 'coll' });
    if (b.op === 'del') { await kv([['HDEL', 'rm:' + c, b.id]]); return res.json({ ok: 1 }); }
    if (b.op === 'put') {
      const it = b.item || {};
      it.id = it.id || (c === 'settings' ? 'site' : Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
      const s = JSON.stringify(it);
      if (s.length > 900000) return res.status(413).json({ error: 'too-large' });
      await kv([['HSET', 'rm:' + c, it.id, s]]);
      return res.json({ ok: 1, id: it.id });
    }
    res.status(400).json({ error: 'op' });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
