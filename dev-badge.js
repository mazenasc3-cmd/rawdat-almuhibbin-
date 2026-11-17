/**
 * بطاقة المطوّر (Dev Card) — مكوّن قابل لإعادة الاستخدام.
 * لا تُضيف أي زر عائم؛ تُفتح برمجيًا عبر window.openDevCard().
 * في موقع دار الروضة تُفتح عند الضغط على شعار الموقع.
 *
 * التركيب:
 *   <script>window.DEV_BADGE={accent:"#d8b45e",portfolio:"https://..."};</script>
 *   <script src="dev-badge.js" defer></script>
 * ثم نادِ window.openDevCard() من أي عنصر تريده.
 */
(function () {
  "use strict";

  var DEFAULT = {
    name: "مازن مدحت",
    nameEn: "MAZEN MEDHAT",
    role: "طالب حاسبات وذكاء اصطناعي · مطوّر ويب",
    note: "صُمّم وطُوّر هذا الموقع بعناية.",
    avatar: "assets/dev-mazen.png",
    portfolio: "https://my-protfolio-space.vercel.app/",
    github: "https://github.com/mazenasc3-cmd",
    email: "mazen@example.com",
    whatsapp: "",
    accent: "#d9b96f",
  };

  var CFG = Object.assign({}, DEFAULT, window.DEV_BADGE || {});

  var ICON = {
    portfolio:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.5a15 15 0 0 0-1.3-3.4A8 8 0 0 1 18.9 8zM12 4.2c.7 1 1.3 2.3 1.7 3.8h-3.4c.4-1.5 1-2.8 1.7-3.8zM4.3 14a8 8 0 0 1 0-4h2.9a17 17 0 0 0 0 4H4.3zm.8 2h2.5c.3 1.2.8 2.4 1.3 3.4A8 8 0 0 1 5.1 16zm2.5-8H5.1a8 8 0 0 1 3.8-3.4A15 15 0 0 0 7.6 8zM12 19.8c-.7-1-1.3-2.3-1.7-3.8h3.4c-.4 1.5-1 2.8-1.7 3.8zM14.1 14H9.9a15 15 0 0 1 0-4h4.2a15 15 0 0 1 0 4zm.9 5.4c.5-1 1-2.2 1.3-3.4h2.5a8 8 0 0 1-3.8 3.4zm1.8-5.4a17 17 0 0 0 0-4h2.9a8 8 0 0 1 0 4h-2.9z"/></svg>',
    github:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-13zm2.2-.5 7.8 5.6L19.8 5H4.2zM20 7.3l-7.4 5.3a1 1 0 0 1-1.2 0L4 7.3v11.2c0 .3.2.5.5.5h15c.3 0 .5-.2.5-.5V7.3z"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/></svg>',
  };

  var wa = CFG.whatsapp ? "https://wa.me/" + String(CFG.whatsapp).replace(/\D/g, "") : "";

  var css =
    ".devcard{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;direction:rtl;font-family:'Cairo',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;opacity:0;visibility:hidden;transition:opacity .24s ease,visibility .24s}" +
    ".devcard.open{opacity:1;visibility:visible}" +
    ".devcard *{box-sizing:border-box}" +
    ".devcard__ov{position:absolute;inset:0;background:#000a;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}" +
    ".devcard__box{position:relative;width:min(340px,100%);background:#12100cd9;color:#f6f1e6;border:1px solid rgba(217,185,111,.35);border-radius:20px;padding:20px;box-shadow:0 24px 60px rgba(0,0,0,.6);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transform:translateY(14px) scale(.96);transition:transform .28s cubic-bezier(.19,1,.22,1);overflow:hidden}" +
    ".devcard.open .devcard__box{transform:none}" +
    ".devcard__box:before{content:'';position:absolute;inset:0;background:radial-gradient(120% 80% at 100% 0,rgba(217,185,111,.18),transparent 60%);pointer-events:none}" +
    ".devcard__head{display:flex;align-items:center;gap:12px;position:relative}" +
    ".devcard__head img{width:58px;height:58px;border-radius:14px;object-fit:cover;border:2px solid var(--dev-accent);flex-shrink:0}" +
    ".devcard__name{font-weight:800;font-size:16px;line-height:1.3;margin:0}" +
    ".devcard__role{font-size:11.5px;opacity:.8;margin:3px 0 0;line-height:1.5}" +
    ".devcard__x{position:absolute;top:-6px;left:-6px;width:30px;height:30px;border:0;border-radius:50%;background:#ffffff1a;color:#f6f1e6;cursor:pointer;display:grid;place-items:center;padding:0;transition:background .2s}" +
    ".devcard__x:hover{background:#ffffff2e}" +
    ".devcard__x svg{width:16px;height:16px;fill:currentColor}" +
    ".devcard__note{font-size:12.5px;opacity:.85;margin:14px 0;position:relative;line-height:1.7}" +
    ".devcard__cta{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--dev-accent);color:#191308;text-decoration:none;font-weight:800;font-size:13.5px;padding:11px 14px;border-radius:12px;position:relative;transition:filter .2s,transform .2s}" +
    ".devcard__cta:hover{filter:brightness(1.08);transform:translateY(-1px)}" +
    ".devcard__cta svg{width:18px;height:18px;fill:currentColor}" +
    ".devcard__links{display:flex;gap:8px;margin-top:12px;position:relative}" +
    ".devcard__links a{flex:1;display:grid;place-items:center;height:40px;border-radius:11px;background:#ffffff12;color:#f6f1e6;border:1px solid #ffffff1f;transition:background .2s,color .2s,transform .2s}" +
    ".devcard__links a:hover{background:var(--dev-accent);color:#191308;transform:translateY(-2px)}" +
    ".devcard__links svg{width:20px;height:20px;fill:currentColor}" +
    ".devcard__brand{display:block;text-align:center;font-size:10px;letter-spacing:.16em;opacity:.45;margin-top:12px;position:relative}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var links = [
    CFG.github ? { href: CFG.github, icon: ICON.github, label: "GitHub" } : "",
    CFG.email ? { href: "mailto:" + CFG.email, icon: ICON.mail, label: "البريد" } : "",
    wa ? { href: wa, icon: ICON.whatsapp, label: "واتساب" } : "",
  ].filter(Boolean);

  var root = document.createElement("div");
  root.className = "devcard";
  root.setAttribute("aria-hidden", "true");
  root.style.setProperty("--dev-accent", CFG.accent);
  root.innerHTML =
    '<div class="devcard__ov"></div>' +
    '<div class="devcard__box" role="dialog" aria-modal="true" aria-label="بطاقة المطوّر">' +
    '<button class="devcard__x" type="button" aria-label="إغلاق">' + ICON.close + "</button>" +
    '<div class="devcard__head">' +
    '<img src="' + CFG.avatar + '" alt="' + CFG.name + '" loading="lazy">' +
    '<div><p class="devcard__name">' + CFG.name + '</p><p class="devcard__role">' + CFG.role + "</p></div>" +
    "</div>" +
    '<p class="devcard__note">' + CFG.note + "</p>" +
    '<a class="devcard__cta" href="' + CFG.portfolio + '" target="_blank" rel="noopener">' + ICON.portfolio + " زيارة ملفّي (Portfolio)</a>" +
    (links.length
      ? '<div class="devcard__links">' +
        links.map(function (l) {
          return '<a href="' + l.href + '" target="_blank" rel="noopener" aria-label="' + l.label + '" title="' + l.label + '">' + l.icon + "</a>";
        }).join("") +
        "</div>"
      : "") +
    '<span class="devcard__brand">' + CFG.nameEn + "</span>" +
    "</div>";

  var lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    root.classList.add("open");
    root.setAttribute("aria-hidden", "false");
    var x = root.querySelector(".devcard__x");
    if (x) x.focus();
  }
  function close() {
    root.classList.remove("open");
    root.setAttribute("aria-hidden", "true");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  window.openDevCard = open;
  window.closeDevCard = close;

  function mount() {
    document.body.appendChild(root);
    root.querySelector(".devcard__ov").addEventListener("click", close);
    root.querySelector(".devcard__x").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("open")) close();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();
})();
