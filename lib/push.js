// إشعارات الويب (Web Push) لدار روضة المحبين.
// يخزّن اشتراكات الزوار في Upstash Redis ويرسل إليهم عبر web-push.
//
// متغيّرات البيئة المطلوبة على Vercel:
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY  (مفاتيح الإشعارات)
//   VAPID_SUBJECT                          (بريد أو رابط للتواصل، اختياري)
//   KV_REST_API_URL / KV_REST_API_TOKEN    (أو UPSTASH_REDIS_REST_URL / _TOKEN)

import * as webpush from 'web-push';
import { createHash } from 'node:crypto';

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SUBS_KEY = 'rm:push:subs';

export const pushConfigured = () =>
  !!(KV_URL && KV_TOKEN && process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

async function kv(cmds) {
  const r = await fetch(KV_URL + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KV_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds),
  });
  if (!r.ok) throw new Error('storage ' + r.status);
  return (await r.json()).map((x) => x.result);
}

const fieldOf = (endpoint) => createHash('sha256').update(String(endpoint)).digest('hex').slice(0, 40);

function configureVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@rawdat-almuhibbin.vercel.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const publicKey = () => process.env.VAPID_PUBLIC_KEY || '';

export async function listSubs() {
  const [rows] = await kv([['HGETALL', SUBS_KEY]]);
  const out = [];
  for (let i = 0; i < (rows || []).length; i += 2) {
    try { out.push({ id: rows[i], sub: JSON.parse(rows[i + 1]) }); } catch { /* تجاهل السجلّ التالف */ }
  }
  return out;
}

export async function countSubs() {
  const [n] = await kv([['HLEN', SUBS_KEY]]);
  return Number(n) || 0;
}

export async function saveSub(sub) {
  const endpoint = sub && sub.endpoint;
  if (!endpoint || !/^https:\/\//.test(endpoint)) throw new Error('bad-endpoint');
  if (!sub.keys || !sub.keys.p256dh || !sub.keys.auth) throw new Error('bad-keys');
  await kv([['HSET', SUBS_KEY, fieldOf(endpoint), JSON.stringify(sub)]]);
  return true;
}

export async function removeSub(endpoint) {
  if (!endpoint) return false;
  await kv([['HDEL', SUBS_KEY, fieldOf(endpoint)]]);
  return true;
}

const withTimeout = (p, ms) => Promise.race([
  p,
  new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
]);

export async function sendToAll(payload, timeoutMs = 8000) {
  if (!pushConfigured()) return { sent: 0, total: 0, skipped: 'not-configured' };
  configureVapid();
  const subs = await listSubs();
  if (!subs.length) return { sent: 0, total: 0, removed: 0 };

  const body = JSON.stringify(payload);
  const dead = [];
  let sent = 0;

  const results = await Promise.allSettled(subs.map(async ({ sub }) => {
    await withTimeout(
      webpush.sendNotification(sub, body, { TTL: 3600, urgency: 'normal' }),
      timeoutMs
    );
    sent++;
  }));

  results.forEach((r, i) => {
    if (r.status !== 'rejected') return;
    const code = r.reason && r.reason.statusCode;
    if (code === 404 || code === 410) dead.push(subs[i].id);
  });

  if (dead.length) {
    try { await kv(dead.map((id) => ['HDEL', SUBS_KEY, id])); } catch { /* التنظيف غير حرج */ }
  }
  return { sent, total: subs.length, removed: dead.length };
}
