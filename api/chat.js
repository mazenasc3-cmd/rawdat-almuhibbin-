// مساعد ذكي محلي على الخادم — بدون GROQ_API_KEY أو API مدفوع
let generatorPromise = null;

const MODEL = "onnx-community/Qwen2.5-0.5B-Instruct";

async function getGenerator() {
  if (!generatorPromise) {
    generatorPromise = import("@huggingface/transformers").then(({ pipeline }) =>
      pipeline("text-generation", MODEL, { dtype: "q4" })
    );
  }
  return generatorPromise;
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (x) =>
        x &&
        (x.role === "user" || x.role === "assistant") &&
        typeof x.content === "string"
    )
    .slice(-8)
    .map((x) => ({
      role: x.role,
      content: x.content.slice(0, 2000),
    }));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const message = String(body.message || "").trim();
    if (!message) {
      return res.status(400).json({ error: "اكتب سؤالك أولًا" });
    }

    const siteContext = String(body.siteContext || "").slice(0, 9000);
    const history = cleanHistory(body.history);

    const messages = [
      {
        role: "system",
        content:
          "أنت مساعد ذكي عربي داخل موقع دار روضة المحبين لتحفيظ القرآن الكريم. " +
          "أجب بالعربية وبأسلوب واضح ومختصر، وافهم العامية المصرية والأخطاء الإملائية. " +
          "أجب عن الأسئلة العامة والتعليمية والدينية البسيطة من معرفتك. " +
          "القرآن الكريم 30 جزءًا و114 سورة. " +
          "إذا كان السؤال عن الدار أو أخبارها أو فعالياتها فاستخدم معلومات الموقع المرفقة فقط. " +
          "لا تقل إنك لا تعرف لمجرد أن السؤال غير موجود في قاعدة ثابتة. " +
          "في الفتاوى الخاصة أو المسائل التي تحتاج معرفة حال السائل، وضّح أن سؤال عالم موثوق أفضل.",
      },
      {
        role: "system",
        content:
          siteContext || "لا توجد بيانات إضافية عن الموقع حاليًا.",
      },
      ...history,
      { role: "user", content: message },
    ];

    const generator = await getGenerator();

    const output = await generator(messages, {
      max_new_tokens: 300,
      temperature: 0.35,
      do_sample: true,
      top_p: 0.9,
      repetition_penalty: 1.05,
    });

    const generated = output?.[0]?.generated_text;
    let reply = "";

    if (Array.isArray(generated)) {
      const last = generated[generated.length - 1];
      reply = typeof last === "string" ? last : String(last?.content || "");
    } else {
      reply = String(generated || "");
    }

    reply = reply.trim() || "لم أستطع تكوين إجابة الآن، جرّب السؤال مرة أخرى.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("chat error:", error);
    return res.status(500).json({
      error: "تعذر تشغيل الذكاء الاصطناعي حاليًا. حاول مرة أخرى.",
    });
  }
};
