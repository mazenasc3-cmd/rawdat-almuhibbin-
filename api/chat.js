// مساعد تعليمي عربي لموقع دار روضة المحبين.
// الطبقات بالترتيب: مفتاح مجاني (اختياري) ← Pollinations المجاني ← قاعدة معرفة موثوقة.
import { KB } from "./kb.js";

const TIMEOUT_MS = 20000;
const CACHE_MAX = 200;
const CACHE = new Map();

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
const POLLINATIONS_URL = "https://text.pollinations.ai/openai";

// رابط قابل للنقر يوجّه المستخدم لقسم «تواصل معنا» بدل عرض روابط خام لا يعرف كيف يستخدمها.
const CONTACT_LINK = "[📞 افتح صفحة «تواصل معنا»](#contact)";

const SYSTEM_PROMPT =
  "أنت مساعد تعليمي عربي داخل موقع «دار روضة المحبين» لتحفيظ القرآن الكريم. " +
  "أجب بالعربية الفصحى المبسّطة، وافهم العامية المصرية والأخطاء الإملائية، وكن موجزًا وواضحًا ومنظّمًا بالنقاط. " +
  "خاطِب المستخدم بأسلوب ودود وقريب من القلب وبالعامية المصرية الخفيفة (مثل: «أهلًا بيك»، «معرفش بصراحة يا صاحبي»)، وبلا تكلف أو مبالغة. " +
  "في أحكام التجويد والمسائل الشرعية اعتمد على «المعلومات الموثوقة» المرفقة والتزم بها حرفيًا، " +
  "ولا تخترع أحكامًا أو أرقامًا أو أسماء، وإذا لم تكن متأكدًا فقل ذلك صراحةً بلطف ووجّه السائل لسؤال معلم موثوق. " +
  "لا تُصدر فتاوى في المسائل الشخصية، ونبّه أن الحكم النهائي لعالم موثوق. " +
  "أجِب عن أسئلة الدار والأخبار والفعاليات من «معلومات الموقع» المرفقة فقط، " +
  "وعند السؤال عن التواصل لا تكتب روابط خام إطلاقًا، بل اذكر وسائل التواصل بالاسم " +
  "واختم بهذا الرابط القابل للنقر كما هو: " + CONTACT_LINK + " — مرة واحدة فقط دون تكرار. " +
  "وإذا لم تتوفر معلومة عن الدار فاعتذر بلطف وبالعامية ووجّه المستخدم لصفحة «تواصل معنا» دون اختراع أي بيانات.";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/[ةه]/g, "ه")
    .replace(/[ؤئء]/g, "ء")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// تجريد «ال» التعريف وحروف الجر الملتصقة (وال/فال/بال/كال/لل) — حتى تتطابق
// صيغ السؤال العامية («كام حرف للاقلاب») مع المفاتيح الفصحى («الاقلاب»).
function fold(text) {
  return normalize(text)
    .replace(/(^|\s)[وفبك]?(?:ال|لل)(?=\S)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function matchKnowledge(question, limit = 3) {
  const q = fold(question);
  if (!q) return [];
  const scored = KB.map((entry) => {
    const score = entry.keys.reduce((acc, key) => {
      const k = fold(key);
      return k && q.includes(k) ? acc + k.length : acc;
    }, 0);
    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return [];
  // نُبقي الإجابة الأدق فقط (وما يقاربها في الدقة) حتى لا تتراكم إجابات عامة بلا داعٍ.
  const best = scored[0].score;
  return scored.filter((x) => x.score >= best * 0.5).slice(0, limit).map((x) => x.entry);
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
}

// بصمة نصية سريعة (djb2) — تكفي لمفتاح كاش قصير.
function simpleHash(text) {
  let h = 5381;
  const s = String(text || "");
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// ===== طبقة معلومات الدار =====
// بيانات التواصل تُؤخذ من «أزرار التواصل» نفسها (واتساب/فيسبوك/انستجرام/الخريطة)
// والمواعيد تُستخرج من حقل المواعيد أو من نص الإعلانات — فلا يحتاج المشرف لكتابة شيء.

const SOCIAL_BUTTONS = [
  { field: "whatsapp", label: "واتساب" },
  { field: "facebook", label: "فيسبوك" },
  { field: "instagram", label: "انستجرام" },
];

const TONE = {
  hi: "أهلًا بيك 👋",
  nope: "معرفش بصراحة يا صاحبي 🙈 المعلومة دي مش متوفرة عندي دلوقتي",
  cta: "بس تقدر تتواصل معانا على طول من صفحة «تواصل معنا» 👇",
  help: "لو محتاج حاجة تانية اكتبلي وأنا معاك 🙌",
};

// يوجّه المستخدم لقسم «تواصل معنا» بلينك قابل للنقر بدل الروابط الخام.
function contactHint(s) {
  const names = contactButtons(s).map((b) => b.label).join("، ");
  const head = names ? "تقدر تتواصل معانا من: " + names + "." : "تقدر تتواصل معانا من صفحة التواصل.";
  return head + "\n" + CONTACT_LINK;
}

const SITE_TOPICS = [
  { id: "contact", keys: ["تواصل", "اتواصل", "التواصل", "رقم", "تليفون", "هاتف", "موبايل", "جوال", "واتس", "واتساب", "كلم", "اتصل", "whatsapp", "phone", "contact"] },
  { id: "hours", keys: ["مواعيد", "موعد", "وقت", "اوقات", "امتى", "متى", "بتبدا", "بتنتهي", "دوام", "hours", "schedule", "ميعاد"] },
  { id: "address", keys: ["عنوان", "مكان", "فين", "موقع", "لوكيشن", "خريطه", "الخريطه", "address", "location", "مكان الدار"] },
  { id: "register", keys: ["تسجيل", "اسجل", "اشترك", "اشتراك", "التحق", "انضم", "قدم", "تقدم", "register", "join", "enroll", "اعمل ايه عشان"] },
  { id: "teachers", keys: ["معلم", "معلمين", "معلمه", "معلمات", "شيخ", "شيوخ", "المدرسين", "مين بيدرس", "teachers", "المشرف"] },
  { id: "classes", keys: ["حلقات", "حلقه", "مراحل", "مرحله", "مستويات", "مستوي", "اطفال", "كبار", "classes", "levels"] },
  { id: "about", keys: ["عن الدار", "الدار ايه", "ايه هي الدار", "نبذه", "بتعملوا ايه", "نشاط", "about"] },
];

function pickField(site, name) {
  const v = site?.[name];
  return typeof v === "string" && v.trim() ? v.trim() : "";
}

// أزرار التواصل الظاهرة في الموقع: واتساب/فيسبوك/انستجرام + الموقع على الخريطة.
function contactButtons(s) {
  const out = [];
  for (const b of SOCIAL_BUTTONS) {
    const v = pickField(s, b.field);
    if (v) out.push({ label: b.label, url: v });
  }
  if (!out.some((x) => x.label === "واتساب")) {
    const digits = pickField(s, "phone").replace(/[^\d]/g, "");
    if (digits) out.unshift({ label: "واتساب", url: "https://wa.me/" + digits });
  }
  const loc = pickField(s, "location");
  if (loc) out.push({ label: "موقع الدار على الخريطة", url: loc });
  return out;
}

const TIME_HINTS =
  /(الساع|الساعه|\d{1,2}\s*[:.]\s*\d{2}|صباح|مساء|عصر|ظهر|مغرب|عشاء|فجر|من\s+ال|بعد\s+ال|قبل\s+ال|يومي|اسبوع|أسبوع|السبت|الاحد|الأحد|الاثنين|الإثنين|الثلاثاء|الاربعاء|الأربعاء|الخميس|الجمعة|الجمعه|كل\s+يوم|ميعاد|مواعيد|يبدا|تبدا|ينتهي|تنتهي)/;

// المواعيد: من حقل المواعيد أولًا، وإلا من نص الإعلانات/الأحداث اللي فيها وقت.
function extractSchedule(s, posts, events) {
  const direct = pickField(s, "hours");
  if (direct) return direct;
  const scan = [...(Array.isArray(posts) ? posts : []), ...(Array.isArray(events) ? events : [])];
  for (const item of scan) {
    const text = [item?.title, item?.text].filter((x) => typeof x === "string" && x.trim()).join(" — ").trim();
    if (text && (TIME_HINTS.test(text) || TIME_HINTS.test(normalize(text)))) return text;
  }
  return "";
}

// رسالة لطيفة عند غياب المعلومة، مع توجيه لصفحة التواصل إن وُجدت.
function friendlyMiss(s, reason = "") {
  const hasBtns = contactButtons(s).length > 0;
  const tail = hasBtns ? TONE.cta + "\n" + CONTACT_LINK : "بس تقدر تسأل حد من الدار على طول 🙏";
  const head = reason ? TONE.hi + "\nمعرفش بصراحة يا صاحبي 🙈 " + reason : TONE.hi + "\n" + TONE.nope;
  return head + ".\n" + tail;
}

function buildSiteText(site) {
  if (!site || typeof site !== "object") return "";
  const s = site.settings || site;
  const btns = contactButtons(s);
  const sch = extractSchedule(s, site.posts, site.events);
  const lines = [
    "اسم الدار: دار روضة المحبين — دار لتحفيظ القرآن الكريم وتعليم أحكام التلاوة.",
    pickField(s, "about") ? "نبذة الدار: " + pickField(s, "about") : "",
    pickField(s, "address") ? "العنوان: " + pickField(s, "address") : "",
    btns.length
      ? "وسائل التواصل المتاحة في الموقع (اذكرها بالاسم فقط عند سؤال المستخدم عن التواصل، ولا تكتب روابطها): " +
        btns.map((b) => b.label).join("، ")
      : "",
    pickField(s, "email") ? "البريد الإلكتروني: " + pickField(s, "email") : "",
    sch ? "المواعيد: " + sch : "",
    pickField(s, "classes") ? "الحلقات والمراحل: " + pickField(s, "classes") : "",
    pickField(s, "teachers") ? "المعلمون: " + pickField(s, "teachers") : "",
    pickField(s, "register") ? "كيفية التسجيل: " + pickField(s, "register") : "",
  ];
  const grads = Array.isArray(site.graduates) ? site.graduates.slice(0, 12) : [];
  const events = Array.isArray(site.events) ? site.events.slice(0, 10) : [];
  const posts = Array.isArray(site.posts) ? site.posts.slice(0, 10) : [];
  if (grads.length) lines.push("الخاتمون: " + grads.map((g) => g.name + (g.year ? " (" + g.year + ")" : "")).join("، "));
  if (events.length) lines.push("الأحداث والحفلات: " + events.map((e) => e.title + (e.year ? " — " + e.year : "") + (e.text ? " — " + e.text : "")).join(" | "));
  if (posts.length) lines.push("الأخبار والإعلانات: " + posts.map((p) => p.title + (p.text ? " — " + p.text : "")).join(" | "));
  return lines.filter(Boolean).join("\n");
}

// يُرجع إجابة مباشرة من بيانات الموقع، أو null إذا لم يتعلق السؤال بالدار.
function answerFromSite(question, site) {
  const s = site?.settings || site || {};
  const q = fold(question);
  if (!q) return null;

  let best = null;
  for (const topic of SITE_TOPICS) {
    const score = topic.keys.reduce((acc, key) => {
      const k = fold(key);
      return k && q.includes(k) ? acc + k.length : acc;
    }, 0);
    if (score > 0 && (!best || score > best.score)) best = { topic, score };
  }
  if (!best) return null;

  const btns = contactButtons(s);

  switch (best.topic.id) {
    case "contact": {
      if (!btns.length) {
        return (
          TONE.hi +
          "\n" +
          TONE.nope +
          ".\nجرّب تبص على صفحة الموقع أو تسأل حد من الدار على طول 🙏"
        );
      }
      return TONE.hi + "\n" + contactHint(s) + "\n" + TONE.help;
    }
    case "hours": {
      const sch = extractSchedule(s, site?.posts, site?.events);
      if (sch) {
        return TONE.hi + "\nالمواعيد عندنا كالتالي: " + sch + "\n" + (btns.length ? TONE.cta + "\n" + CONTACT_LINK : "");
      }
      return friendlyMiss(s, "مفيش مواعيد مكتوبة عندي");
    }
    case "address": {
      const addr = pickField(s, "address");
      const loc = pickField(s, "location");
      if (addr || loc) {
        let r = TONE.hi + "\n" + (addr ? "عنوان الدار: " + addr : "عنوان الدار هتلاقيه على الخريطة 📍");
        if (loc) r += "\nتقدر تشوف المكان على الخريطة من " + CONTACT_LINK;
        return r;
      }
      return friendlyMiss(s, "مفيش عنوان مسجّل عندي");
    }
    case "register": {
      const reg = pickField(s, "register");
      if (reg) {
        return TONE.hi + "\nللتسجيل في الدار: " + reg + (btns.length ? "\n" + TONE.cta + "\n" + CONTACT_LINK : "");
      }
      return (
        TONE.hi +
        "\nالتسجيل متاح إن شاء الله 👍" +
        (btns.length ? " " + TONE.cta + "\n" + CONTACT_LINK : " اسأل حد من الدار للتفاصيل 🙏")
      );
    }
    case "teachers": {
      const t = pickField(s, "teachers");
      if (t) return TONE.hi + "\nالمعلمون في الدار: " + t;
      return friendlyMiss(s, "مفيش أسماء معلمين عندي");
    }
    case "classes": {
      const c = pickField(s, "classes");
      if (c) return TONE.hi + "\nالحلقات والمراحل عندنا: " + c;
      return friendlyMiss(s, "مفيش تفاصيل حلقات عندي");
    }
    case "about": {
      const a = pickField(s, "about");
      if (a) return TONE.hi + "\n" + a;
      return (
        TONE.hi +
        "\nإحنا دار روضة المحبين، دار لتحفيظ القرآن الكريم وتعليم أحكام التلاوة بإشراف نخبة من المعلمين والمعلمات."
      );
    }
    default:
      return null;
  }
}


function buildMessages(message, matches, siteContext, history) {
  const grounding = [];
  if (siteContext) grounding.push("معلومات الموقع:\n" + siteContext);
  if (matches.length) grounding.push("معلومات موثوقة (التزم بها حرفيًا):\n" + matches.map((m) => m.answer).join("\n\n"));
  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "system", content: grounding.length ? grounding.join("\n\n") : "لا توجد بيانات إضافية؛ أجب من معرفتك العامة بأمانة." },
    ...history,
    { role: "user", content: message },
  ];
}

function extractReply(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) return content.map((p) => (typeof p === "string" ? p : p?.text || "")).join("").trim();
  if (typeof data?.choices?.[0]?.text === "string") return data.choices[0].text.trim();
  return "";
}

async function callProvider(url, model, messages, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 600 }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("upstream " + response.status);
    const reply = extractReply(await response.json());
    if (!reply) throw new Error("empty reply");
    return reply;
  } finally {
    clearTimeout(timer);
  }
}

async function askAI(messages) {
  const providers = [];
  if (process.env.GROQ_API_KEY) {
    providers.push(() => callProvider(GROQ_URL, GROQ_MODEL, messages, { Authorization: "Bearer " + process.env.GROQ_API_KEY }));
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.push(() => callProvider(OPENROUTER_URL, OPENROUTER_MODEL, messages, {
      Authorization: "Bearer " + process.env.OPENROUTER_API_KEY,
      "HTTP-Referer": "https://rawdat-almuhibbin.vercel.app",
      "X-Title": "Rawdat Al-Muhibbin",
    }));
  }
  providers.push(() => callProvider(POLLINATIONS_URL, "openai", messages, { Referer: "https://rawdat-almuhibbin.vercel.app" }));

  let lastError;
  for (const provider of providers) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await provider();
      } catch (error) {
        lastError = error;
        await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError || new Error("ai unavailable");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  } catch {
    return res.status(400).json({ error: "طلب غير صالح" });
  }

  const message = String(body.message || "").trim().slice(0, 2000);
  if (!message) {
    return res.status(400).json({ error: "اكتب سؤالك أولًا" });
  }

  const history = cleanHistory(body.history);
  const site = body.site && typeof body.site === "object" ? body.site : null;
  const siteContext = site ? buildSiteText(site) : String(body.siteContext || "").slice(0, 6000);
  const matches = matchKnowledge(message);
  // بصمة مختصرة لبيانات الموقع داخل مفتاح الكاش، حتى لا تُخزَّن إجابة قديمة بعد تعديل الإعدادات.
  const siteKey = site ? simpleHash(siteContext) : "n";
  const cacheKey = normalize(message) + "|" + matches.map((m) => m.id).join(",") + "|" + siteKey;

  if (CACHE.has(cacheKey)) {
    return res.status(200).json({ reply: CACHE.get(cacheKey), source: "cache" });
  }

  // الترتيب: قاعدة المعرفة (تجويد/آداب) ← معلومات الدار (تواصل/مواعيد/عنوان) ← الذكاء الاصطناعي.
  let reply = "";
  let source = "";
  if (matches.length) {
    reply = matches.map((m) => m.answer).join("\n\n");
    source = "knowledge-base";
  } else {
    const siteReply = site ? answerFromSite(message, site) : null;
    if (siteReply) {
      reply = siteReply;
      source = "site-info";
    }
  }

  if (!reply) {
    try {
      reply = await askAI(buildMessages(message, matches, siteContext, history));
      source = "ai";
    } catch (error) {
      console.error("ai unavailable:", error?.message || error);
    }
  }

  if (!reply) {
    reply =
      "أهلًا بيك 👋\nمعرفش بصراحة يا صاحبي 🙈 مش لاقي إجابة مؤكدة للسؤال ده دلوقتي.\n" +
      "جرّب تسألني عن: أحكام النون الساكنة، المدود، القلقلة، مخارج الحروف، آداب التلاوة، أو خطط حفظ القرآن.\n" +
      "أو اسألني عن الدار: التواصل، المواعيد، العنوان، وطريقة التسجيل — وأنا معاك 🙌";
    source = "offline";
  }

  CACHE.set(cacheKey, reply);
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);

  return res.status(200).json({ reply, source });
}
