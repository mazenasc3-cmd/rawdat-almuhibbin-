// مساعد دار روضة المحبين — أسئلة دينية (قرآن، تجويد، سنة)
// Environment: OPENAI_API_KEY أو XAI_API_KEY
// Optional: OPENAI_MODEL (مثلاً gpt-4o-mini) ، OPENAI_BASE_URL

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

function arError(status, msg) {
  const m = String(msg || '').toLowerCase();
  if (!msg && status === 503) return 'المساعد غير مفعّل: مفتاح OPENAI_API_KEY غير موجود على Vercel أو لم يتم عمل Redeploy.';
  if (status === 401 || m.includes('incorrect api key') || m.includes('invalid api key') || m.includes('authentication'))
    return 'مفتاح OpenAI غير صحيح. تأكد من نسخ المفتاح كاملًا في Value بدون مسافات، ثم Redeploy.';
  if (status === 429 || m.includes('rate limit') || m.includes('quota') || m.includes('billing') || m.includes('insufficient'))
    return 'تم تجاوز الحد أو لا يوجد رصيد في حساب OpenAI. راجع Billing في platform.openai.com.';
  if (m.includes('model') && (m.includes('not found') || m.includes('does not exist') || m.includes('invalid')))
    return 'اسم الموديل غير متاح. احذف OPENAI_MODEL أو ضع gpt-4o-mini ثم Redeploy.';
  if (status === 404) return 'عنوان الـ API غير صحيح. لا تضف OPENAI_BASE_URL إلا إذا كنت تعرف ما تفعل.';
  if (msg) return 'خطأ من OpenAI: ' + String(msg).slice(0, 180);
  return 'تعذر الاتصال بالمساعد الآن. حاول بعد قليل.';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method', reply: 'استخدم POST فقط.' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};
    const msg = String(body.message || '').trim().slice(0, 2000);
    if (!msg) return res.status(400).json({ error: 'empty', reply: 'اكتب سؤالًا أولًا.' });

    const xai = (process.env.XAI_API_KEY || '').trim();
    const oai = (process.env.OPENAI_API_KEY || '').trim();
    const key = xai || oai;
    if (!key) {
      return res.status(503).json({
        error: 'no-key',
        reply: arError(503, '')
      });
    }

    const base = (process.env.OPENAI_BASE_URL || (xai ? 'https://api.x.ai/v1' : 'https://api.openai.com/v1')).replace(/\/$/, '');
    const model = (process.env.OPENAI_MODEL || (xai ? 'grok-3-mini' : 'gpt-4o-mini')).trim();

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
      const errMsg = (j && j.error && (j.error.message || j.error.code)) || ('status ' + r.status);
      return res.status(502).json({
        error: String(errMsg),
        reply: arError(r.status, errMsg)
      });
    }

    const reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || 'لم أستطع إنشاء رد.';
    return res.json({ reply: String(reply).trim() });
  } catch (e) {
    return res.status(500).json({
      error: String(e.message || e),
      reply: 'حدث خطأ في السيرفر: ' + String(e.message || e).slice(0, 120)
    });
  }
};
