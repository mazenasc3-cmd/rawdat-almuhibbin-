// مساعد دار روضة المحبين — أسئلة دينية (قرآن، تجويد، سنة)
// يحتاج متغير بيئة: OPENAI_API_KEY أو XAI_API_KEY
// اختياري: OPENAI_BASE_URL (افتراضي OpenAI) أو استخدم https://api.x.ai/v1 مع XAI_API_KEY
// اختياري: OPENAI_MODEL مثل gpt-4o-mini أو grok-3-mini

const SYSTEM = `أنت مساعد تعليمي في «دار روضة المحبين لتحفيظ القرآن الكريم».
مهمتك مساعدة الطلاب في:
- القرآن الكريم: معاني الآيات باختصار، أسباب النزول إن عُرفت، الربط بالواقع بلطف.
- التجويد: مخارج الحروف، الصفات، أحكام النون والميم والمدود والوقف والابتداء — بأسلوب مبسّط وأمثلة.
- السنة النبوية: أحاديث صحيحة مشهورة مع ذكر الراوي والمعنى العملي.
- آداب طلب العلم، آداب التلاوة، فضل الحفظ، وأخلاق طالب القرآن.

قواعد مهمة:
1) أجب بالعربية الفصحى الواضحة والمختصرة قدر الإمكان.
2) إن كان السؤال يحتاج فتوى معاصرة أو حكمًا خلافيًا دقيقًا: وضّح أنك مساعد تعليمي، وانصح بسؤال الشيخ المختص في الدار.
3) لا تخرج عن المواضيع الدينية والتعليمية المرتبطة بالقرآن والسنة والتجويد والآداب.
4) إن سُئلت عن غير ذلك بلطف أعد التوجيه: «أنا مخصص لأسئلة القرآن والتجويد والسنة».
5) لا تختلق أحاديث أو آيات. إن لم تكن متأكدًا قل ذلك.
6) شجّع الطالب على الحفظ والمراجعة بلطف.`;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const msg = String(body.message || '').trim().slice(0, 2000);
    if (!msg) return res.status(400).json({ error: 'empty' });

    const xai = process.env.XAI_API_KEY;
    const oai = process.env.OPENAI_API_KEY;
    const key = xai || oai;
    if (!key) {
      return res.status(503).json({
        error: 'no-key',
        reply: 'المساعد غير مفعّل حاليًا. يرجى إضافة مفتاح API في إعدادات Vercel (XAI_API_KEY أو OPENAI_API_KEY).'
      });
    }

    const base = (process.env.OPENAI_BASE_URL || (xai ? 'https://api.x.ai/v1' : 'https://api.openai.com/v1')).replace(/\/$/, '');
    const model = process.env.OPENAI_MODEL || (xai ? 'grok-3-mini' : 'gpt-4o-mini');

    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const messages = [
      { role: 'system', content: SYSTEM },
      ...history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && m.content)
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 1500) })),
      { role: 'user', content: msg }
    ];

    const r = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 900
      })
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const err = (j && (j.error && j.error.message)) || ('api ' + r.status);
      return res.status(502).json({ error: String(err), reply: 'تعذر الاتصال بالمساعد الآن. حاول بعد قليل.' });
    }

    const reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || 'لم أستطع إنشاء رد.';
    return res.json({ reply: String(reply).trim() });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e), reply: 'حدث خطأ. حاول مرة أخرى.' });
  }
};
