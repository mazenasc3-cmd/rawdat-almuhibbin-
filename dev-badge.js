/**
 * شارة المطوّر (Dev Badge) — مكوّن قابل لإعادة الاستخدام في أي مشروع.
 * تظهر كزر عائم في الرُكن، وعند الضغط تُفتح بطاقة تعريف بالبروتوفوليو.
 *
 * طريقة التركيب: أضف قبل </body> مباشرةً:
 *   <script src="dev-badge.js" defer></script>
 *
 * للتخصيص: عرّف window.DEV_BADGE قبل السكربت، مثل:
 *   <script>window.DEV_BADGE={accent:"#0d4a3e", portfolio:"https://..."}</script>
 */
(function () {
  "use strict";

  var DEFAULT = {
    name: "مازن مدحت",
    nameEn: "MAZEN MEDHAT",
    role: "طالب حاسبات وذكاء اصطناعي · مطوّر ويب",
    note: "صُمّم وطُوّر هذا الموقع بعناية.",
    avatar: "assets/dev-mazen.png",
    portfolio: "https://mazenasc3-cmd.github.io/My-Private-Space/",
    github: "https://github.com/mazenasc3-cmd",
    email: "mazen@example.com",
    whatsapp: "",
    accent: "#d9b96f",
    position: "right",
  };

  var CFG = Object.assign({}, DEFAULT, window.DEV_BADGE || {});
  if (document.querySelector(".dev-badge")) return;

  var ICON = {
    portfolio:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.5a15 15 0 0 0-1.3-3.4A8 8 0 0 1 18.9 8zM12 4.2c.7 1 1.3 2.3 1.7 3.8h-3.4c.4-1.5 1-2.8 1.7-3.8zM4.3 14a8 8 0 0 1 0-4h2.9a17 17 0 0 0 0 4H4.3zm.8 2h2.5c.3 1.2.8 2.4 1.3 3.4A8 8 0 0 1 5.1 16zm2.5-8H5.1a8 8 0 0 1 3.8-3.4A15 15 0 0 0 7.6 8zM12 19.8c-.7-1-1.3-2.3-1.7-3.8h3.4c-.4 1.5-1 2.8-1.7 3.8zM14.1 14H9.9a15 15 0 0 1 0-4h4.2a15 15 0 0 1 0 4zm.9 5.4c.5-1 1-2.2 1.3-3.4h2.5a8 8 0 0 1-3.8 3.4zm1.8-5.4a17 17 0 0 0 0-4h2.9a8 8 0 0 1 0 4h-2.9z"/></svg>',
    github:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.75.4-1.27.73-1.56-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18.5v-13zm2.2-.5 7.8 5.6L19.8 5H4.2zM20 7.3l-7.4 5.3a1 1 0 0 1-1.2 0L4 7.3v11.2c0 .3.2.5.5.5h15c.3 0 .5-.2.5-.5V7.3z"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.1-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.8-.1 1.4z"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z"/></svg>',
  };

  var wa = CFG.whatsapp ? "https://wa.me/" + String(CFG.whatsapp).replace(/\D/g, "") : "";

  var css =
    ".dev-badge{position:fixed;z-index:2147483000;bottom:calc(20px + env(safe-area-inset-bottom,0px));font-family:'Cairo',system-ui,-apple-system,'Segoe UI',Tahoma,sans-serif;direction:rtl}" +
    ".dev-badge[data-pos=right]{right:12px}.dev-badge[data-pos=left]{left:12px}" +
    ".dev-badge.above-fab{bottom:calc(78px + env(safe-area-inset-bottom,0px))}" +
    ".dev-badge *{box-sizing:border-box}" +
    ".dev-badge__fab{width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,.65);padding:0;cursor:pointer;overflow:hidden;background:#111;box-shadow:0 8px 24px rgba(0,0,0,.35);transition:transform .25s ease,box-shadow .25s ease;position:relative;display:block}" +
    ".dev-badge__fab:hover{transform:translateY(-3px) scale(1.04);box-shadow:0 14px 30px rgba(0,0,0,.45)}" +
    ".dev-badge__fab img{width:100%;height:100%;object-fit:cover;display:block}" +
    ".dev-badge__fab:after{content:'';position:absolute;inset:-2px;border-radius:50%;border:2px solid var(--dev-accent);opacity:.9;animation:devPulse 2.6s ease-out infinite}" +
    "@keyframes devPulse{0%{transform:scale(1);opacity:.75}70%{transform:scale(1.28);opacity:0}100%{opacity:0}}" +
    ".dev-badge__tip{position:absolute;bottom:64px;background:#111c;color:#fff;font-size:12px;font-weight:600;padding:6px 10px;border-radius:8px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s;backdrop-filter:blur(6px)}" +
    ".dev-badge[data-pos=right] .dev-badge__tip{right:0}.dev-badge[data-pos=left] .dev-badge__tip{left:0}" +
    ".dev-badge__fab:hover+.dev-badge__tip{opacity:1}" +
    ".dev-badge__card{position:absolute;bottom:70px;width:300px;max-width:calc(100vw - 24px);background:#12100cd9;color:#f6f1e6;border:1px solid rgba(217,185,111,.35);border-radius:18px;padding:18px;box-shadow:0 24px 60px rgba(0,0,0,.55);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);transform-origin:bottom;transition:opacity .24s ease,transform .24s ease,visibility .24s;overflow:hidden}" +
    ".dev-badge[data-pos=right] .dev-badge__card{right:0}.dev-badge[data-pos=left] .dev-badge__card{left:0}" +
    ".dev-badge.open .dev-badge__card{opacity:1;visibility:visible;transform:translateY(0) scale(1)}" +
    ".dev-badge__card:before{content:'';position:absolute;inset:0;background:radial-gradient(120% 80% at 100% 0,rgba(217,185,111,.18),transparent 60%);pointer-events:none}" +
    ".dev-badge__head{display:flex;align-items:center;gap:12px;position:relative}" +
    ".dev-badge__head img{width:56px;height:56px;border-radius:14px;object-fit:cover;border:2px solid var(--dev-accent);flex-shrink:0}" +
    ".dev-badge__name{font-weight:800;font-size:16px;line-height:1.3;margin:0}" +
    ".dev-badge__role{font-size:11.5px;opacity:.8;margin:2px 0 0;line-height:1.5}" +
    ".dev-badge__x{position:absolute;top:-4px;left:-4px;width:30px;height:30px;border:0;border-radius:50%;background:#ffffff1a;color:#f6f1e6;cursor:pointer;display:grid;place-items:center;padding:0}" +
    ".dev-badge__x:hover{background:#ffffff2e}" +
    ".dev-badge__x svg{width:16px;height:16px;fill:currentColor}" +
    ".dev-badge__note{font-size:12.5px;opacity:.85;margin:14px 0;position:relative;line-height:1.7}" +
    ".dev-badge__cta{display:flex;align-items:center;justify-content:center;gap:8px;background:var(--dev-accent);color:#191308;text-decoration:none;font-weight:800;font-size:13.5px;padding:11px 14px;border-radius:12px;position:relative;transition:filter .2s,transform .2s}" +
    ".dev-badge__cta:hover{filter:brightness(1.08);transform:translateY(-1px)}" +
    ".dev-badge__cta svg{width:18px;height:18px;fill:currentColor}" +
    ".dev-badge__links{display:flex;gap:8px;margin-top:12px;position:relative}" +
    ".dev-badge__links a{flex:1;display:grid;place-items:center;height:40px;border-radius:11px;background:#ffffff12;color:#f6f1e6;border:1px solid #ffffff1f;transition:background .2s}" +
    ".dev-badge__links a:hover{background:var(--dev-accent);color:#191308}" +
    ".dev-badge__links svg{width:20px;height:20px;fill:currentColor}" +
    ".dev-badge__brand{display:block;text-align:center;font-size:10px;letter-spacing:.16em;opacity:.45;margin-top:12px;position:relative}" +
    "@media(max-width:420px){.dev-badge__card{width:calc(100vw - 24px)}}";

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var links = [
    CFG.github ? { href: CFG.github, icon: ICON.github, label: "GitHub" } : "",
    CFG.email ? { href: "mailto:" + CFG.email, icon: ICON.mail, label: "البريد" } : "",
    wa ? { href: wa, icon: ICON.whatsapp, label: "واتساب" } : "",
  ].filter(Boolean);

  var root = document.createElement("div");
  root.className = "dev-badge";
  root.setAttribute("data-pos", CFG.position === "left" ? "left" : "right");
  root.style.setProperty("--dev-accent", CFG.accent);
  root.innerHTML =
    '<div class="dev-badge__card" role="dialog" aria-label="بطاقة المطوّر">' +
    '<button class="dev-badge__x" type="button" aria-label="إغلاق">' + ICON.close + "</button>" +
    '<div class="dev-badge__head">' +
    '<img src="' + CFG.avatar + '" alt="' + CFG.name + '" loading="lazy">' +
    '<div><p class="dev-badge__name">' + CFG.name + "</p><p class=\"dev-badge__role\">" + CFG.role + "</p></div>" +
    "</div>" +
    '<p class="dev-badge__note">' + CFG.note + "</p>" +
    '<a class="dev-badge__cta" href="' + CFG.portfolio + '" target="_blank" rel="noopener">' + ICON.portfolio + " زيارة ملفّي (Portfolio)</a>" +
    (links.length
      ? '<div class="dev-badge__links">' +
        links.map(function (l) {
          return '<a href="' + l.href + '" target="_blank" rel="noopener" aria-label="' + l.label + '" title="' + l.label + '">' + l.icon + "</a>";
        }).join("") +
        "</div>"
      : "") +
    '<span class="dev-badge__brand">' + CFG.nameEn + "</span>" +
    "</div>" +
    '<button class="dev-badge__fab" type="button" aria-label="بطاقة المطوّر" aria-expanded="false">' +
    '<img src="' + CFG.avatar + '" alt="" loading="lazy">' +
    "</button>" +
    '<span class="dev-badge__tip">طُوّر بواسطة ' + CFG.name + "</span>";

  function mount() {
    document.body.appendChild(root);
    if (document.querySelector(".loc-fab")) root.classList.add("above-fab");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  var fab = root.querySelector(".dev-badge__fab");
  function setOpen(open) {
    root.classList.toggle("open", open);
    fab.setAttribute("aria-expanded", open ? "true" : "false");
  }
  fab.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!root.classList.contains("open"));
  });
  root.querySelector(".dev-badge__x").addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(false);
  });
  document.addEventListener("click", function (e) {
    if (!root.contains(e.target)) setOpen(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();
