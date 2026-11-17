// نقطة نهاية إشعارات الويب (Web Push) — Vercel Serverless Function.
//
//   GET  /api/push                  -> { publicKey, count }        (حالة الإشعارات)
//   POST /api/push  {sub}           -> { ok:1 }                    (تفعيل الاشتراك)
//   POST /api/push  {unsubscribe, endpoint} -> { ok:1 }            (إلغاء الاشتراك)
//   POST /api/push  {test:1, who, pass} -> { sent, total }         (إرسال تجريبي — للمشرف)

import { pushConfigured, publicKey, saveSub, removeSub, countSubs, sendToAll } from '../lib/push.js';

export default async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      const count = pushConfigured() ? await countSubs().catch(() => 0) : 0;
      return res.status(200).json({ publicKey: publicKey(), count, configured: pushConfigured() });
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    if (b.sub) {
      if (!pushConfigured()) return res.status(400).json({ error: 'push-not-configured' });
      await saveSub(b.sub);
      return res.status(200).json({ ok: 1 });
    }

    if (b.unsubscribe) {
      await removeSub(b.endpoint);
      return res.status(200).json({ ok: 1 });
    }

    if (b.test) {
      const AP = process.env.ADMIN_PASSWORD;
      if (!(b.who === 'admin' && AP && b.pass === AP)) return res.status(401).json({ error: 'auth' });
      if (!pushConfigured()) return res.status(400).json({ error: 'push-not-configured' });
      const out = await sendToAll({
        title: 'دار روضة المحبين',
        body: 'إشعار تجريبي ✓ — الإشعارات شغّالة وهيوصلك كل جديد أول بأول.',
        url: '/',
        tag: 'rm-test',
      });
      return res.status(200).json(out);
    }

    return res.status(400).json({ error: 'op' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
