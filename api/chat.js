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

const SYSTEM_PROMPT =
  "أنت مساعد تعليمي عربي داخل موقع «دار روضة المحبين» لتحفيظ القرآن الكريم. " +
  "أجب بالعربية الفصحى المبسّطة، وافهم العامية المصرية والأخطاء الإملائية، وكن موجزًا وواضحًا ومنظّمًا بالنقاط. " +
  "في أحكام التجويد والمسائل الشرعية اعتمد على «المعلومات الموثوقة» المرفقة والتزم بها حرفيًا، " +
  "ولا تخترع أحكامًا أو أرقامًا أو أسماء، وإذا لم تكن متأكدًا فقل ذلك صراحةً ووجّه السائل لسؤال معلم موثوق. " +
  "لا تُصدر فتاوى في المسائل الشخصية، ونبّه أن الحكم النهائي لعالم موثوق. " +
  "أجِب عن أسئلة الدار والأخبار والفعاليات من «معلومات الموقع» المرفقة فقط.";

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

function matchKnowledge(question, limit = 3) {
  const q = normalize(question);
  if (!q) return [];
  return KB.map((entry) => {
    const score = entry.keys.reduce((acc, key) => {
      const k = normalize(key);
      return k && q.includes(k) ? acc + k.length : acc;
    }, 0);
    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.entry);
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));
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
  const siteContext = String(body.siteContext || "").slice(0, 6000);
  const matches = matchKnowledge(message);
  const cacheKey = normalize(message) + "|" + matches.map((m) => m.id).join(",");

  if (CACHE.has(cacheKey)) {
    return res.status(200).json({ reply: CACHE.get(cacheKey), source: "cache" });
  }

  // أسئلة التجويد والآداب: تُجاب فورًا من قاعدة المعرفة الموثوقة (دقيقة وبلا اعتماد على الشبكة).
  let reply = "";
  let source = "";
  if (matches.length) {
    reply = matches.map((m) => m.answer).join("\n\n");
    source = "knowledge-base";
  } else {
    try {
      reply = await askAI(buildMessages(message, matches, siteContext, history));
      source = "ai";
    } catch (error) {
      console.error("ai unavailable:", error?.message || error);
    }
    if (!reply) {
      reply =
        "لم أجد إجابة مؤكدة لهذا السؤال، وتعذّر الوصول للمساعد الذكي الآن.\n" +
        "جرّب سؤالًا عن: أحكام النون الساكنة، المدود، القلقلة، مخارج الحروف، آداب التلاوة، أو خطط حفظ القرآن.\n" +
        "ويمكنك أيضًا سؤال أحد معلمي الدار مباشرةً.";
      source = "offline";
    }
  }

  CACHE.set(cacheKey, reply);
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value);

  return res.status(200).json({ reply, source });
}
