// المساعد الذكي: يستخدم مفتاح Groq المخزّن في Vercel (GROQ_API_KEY) ولا يظهر للزائر
const SYS = `أنت مساعد موقع «دار روضة المحبين لتحفيظ القرآن الكريم» بإدارة الشيخ مصطفى محمود الشال.
أجب بالعربية المبسطة وبإيجاز ولطف. تساعد في: التعريف بالدار وأقسام الموقع (الخاتمون، المجموعات، الأخبار)، وإرشادات عامة عن حفظ القرآن ومراجعته وآداب التلاوة.
لا تخترع معلومات عن الدار (مواعيد، أسعار، أسماء) إن لم تكن متأكدًا، وقل: «لا أعلم، تواصل معنا عبر واتساب».
لا تُفتِ في أحكام شرعية بنفسك، وجّه السائل للشيخ أو أهل العلم. لا تطلب ولا تذكر بيانات شخصية عن الطلاب.`;
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const K = process.env.GROQ_API_KEY;
  if (!K) return res.status(500).json({ error: 'GROQ_API_KEY غير مضاف في Vercel' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const msgs = (b.messages || []).slice(-8).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 800) }));
    if (!msgs.length) return res.status(400).json({ error: 'empty' });
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + K },
      body: JSON.stringify({ model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', messages: [{ role: 'system', content: SYS }, ...msgs], max_tokens: 500, temperature: 0.4 })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || String(r.status) });
    res.json({ reply: j.choices[0].message.content });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
};
