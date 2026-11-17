// خادم صغير على Vercel: يحفظ البيانات في Redis (Upstash) ويتحقق من كلمة سر المشرف
import { pushConfigured, sendToAll } from '../lib/push.js';

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

const short = (s, n = 90) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// يبني نصّ الإشعار حسب نوع المحتوى الذي أضافه/عدّله المشرف.
function noticeFor(coll, item, isNew) {
  const kind = isNew ? 'جديد' : 'محدّث';
  if (coll === 'posts') {
    return { title: `📢 إعلان ${kind}`, body: short([item.title, item.text].filter(Boolean).join(' — ')) || 'يوجد إعلان جديد على الموقع', url: '/#news', tag: 'rm-post' };
  }
  if (coll === 'events') {
    return { title: `🎉 حفلة ${kind}ة`, body: short([item.title, item.year].filter(Boolean).join(' — ')) || 'يوجد حفل جديد على الموقع', url: '/#events', tag: 'rm-event' };
  }
  if (coll === 'graduates') {
    return { title: `🎓 خاتم/ـة ${kind}`, body: short([item.name, item.year].filter(Boolean).join(' — ')) || 'تم إضافة خاتم جديد', url: '/#grads', tag: 'rm-grad' };
  }
  return null;
}

async function notify(coll, item, isNew) {
  if (!pushConfigured()) return;
  const n = noticeFor(coll, item, isNew);
  if (!n) return;
  try { await sendToAll(n); } catch (e) { /* الإشعار لا يجب أن يعطّل الحفظ */ }
}

export default async (req, res) => {
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
      const isNew = !it.id;
      it.id = it.id || (c === 'settings' ? 'site' : Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
      const s = JSON.stringify(it);
      if (s.length > 900000) return res.status(413).json({ error: 'too-large' });
      await kv([['HSET', 'rm:' + c, it.id, s]]);
      await notify(c, it, isNew);
      return res.json({ ok: 1, id: it.id });
    }
    res.status(400).json({ error: 'op' });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
