/* ============ NOVA — логика окна ============ */
"use strict";

(() => {
  const TOKEN = window.NOVA_TOKEN;
  const MD = window.NovaMarkdown;

  // ---------- иконки ----------

  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    panel: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    square: '<rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.5 6.3L3 16M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    pencil: '<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    sparkles: '<path d="M12 3l1.9 5.8L20 10.7l-6.1 1.9L12 18.5l-1.9-5.9L4 10.7l6.1-1.9z"/><path d="M19 3v4M17 5h4"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6Z"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>',
    bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4"/>',
    paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    fileCode: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M10 13l-2 2 2 2M14 17l2-2-2-2"/>',
    fileText: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    dots: '<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>',
    mask: '<path d="M4 5c3 1.6 13 1.6 16 0v6a8 8 0 0 1-16 0Z"/><path d="M9 10h.01M15 10h.01M9.5 14.5a3.5 3.5 0 0 0 5 0"/>',
    musicNote: '<circle cx="8" cy="18" r="4"/><path d="M12 18V2l7 4"/>',
    musicChord: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    musicSymphony: '<path d="M9 18V5l12-2v13"/><path d="m9 9 12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    musicSonata: '<circle cx="7" cy="18" r="3"/><path d="M10 18V4c2 2.2 6 2.6 8 5.5"/><path d="M10 9.5c2 2.2 6 2.6 8 5.5"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
  };

  const icon = (name, size = 18) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" ` +
    `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;

  const ORBIT = {
    mini:
      '<svg viewBox="0 0 230 230" aria-hidden="true">' +
      '<ellipse cx="115" cy="115" rx="98" ry="38" fill="none" stroke="#8b5cf6" stroke-width="14"/>' +
      '<ellipse cx="115" cy="115" rx="38" ry="98" fill="none" stroke="#a78bfa" stroke-width="10"/>' +
      '<circle cx="115" cy="115" r="40" fill="#17112c" stroke="#a78bfa" stroke-width="8"/>' +
      '<circle cx="115" cy="115" r="26" fill="#8b5cf6"/><circle cx="115" cy="115" r="11" fill="#fff"/>' +
      '<circle cx="201" cy="97" r="14" fill="#fff"/></svg>',
    big:
      '<svg viewBox="0 0 230 230" aria-hidden="true"><defs>' +
      '<radialGradient id="novaGlow"><stop offset="0" stop-color="#c4b5fd" stop-opacity=".85"/>' +
      '<stop offset=".55" stop-color="#8b5cf6" stop-opacity=".22"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="novaRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/>' +
      '<stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6366f1"/></linearGradient></defs>' +
      '<circle class="orbit-glow" cx="115" cy="115" r="78" fill="url(#novaGlow)"/>' +
      '<circle cx="115" cy="115" r="60" fill="none" stroke="#a78bfa" stroke-opacity=".14" stroke-width="1.5"/>' +
      '<circle cx="115" cy="115" r="47" fill="none" stroke="#a78bfa" stroke-opacity=".22" stroke-width="1.5"/>' +
      '<ellipse cx="115" cy="115" rx="90" ry="33" fill="none" stroke="url(#novaRing)" stroke-width="3.2"/>' +
      '<ellipse cx="115" cy="115" rx="33" ry="90" fill="none" stroke="#a78bfa" stroke-opacity=".8" stroke-width="2"/>' +
      '<circle cx="115" cy="115" r="33" fill="#17112c" stroke="#a78bfa" stroke-width="2"/>' +
      '<circle cx="115" cy="115" r="21" fill="#8b5cf6"/><circle cx="115" cy="115" r="9" fill="#fff"/>' +
      '<circle r="6" fill="#fff"><animateMotion dur="5.5s" repeatCount="indefinite" ' +
      'path="M205 115 A90 33 0 1 1 25 115 A90 33 0 1 1 205 115"/></circle>' +
      '<circle r="3.6" fill="#c4b5fd"><animateMotion dur="8s" repeatCount="indefinite" ' +
      'path="M115 25 A33 90 0 1 1 115 205 A33 90 0 1 1 115 25"/></circle></svg>',
  };

  const CARDS = window.NOVA_CARDS || [ // версия для телефона подставляет свои подсказки
    { icon: "cloud", title: "Погода", text: "Что сейчас в Москве и что будет завтра",
      prompt: "Какая сейчас погода в Москве и что будет завтра?" },
    { icon: "news", title: "Главные новости", text: "Коротко о том, что случилось сегодня",
      prompt: "Что главного в новостях сегодня? Кратко, 5 пунктов." },
    { icon: "coins", title: "Курсы валют", text: "Доллар, евро и юань по курсу ЦБ",
      prompt: "Какой сегодня курс доллара, евро и юаня по ЦБ? Покажи таблицей." },
    { icon: "bulb", title: "Идея для игры", text: "Придумать что-нибудь необычное",
      prompt: "Придумай необычную идею для игры и опиши её в 5 пунктах." },
  ];

  // ---------- помощники ----------

  const $ = (sel, root = document) => root.querySelector(sel);
  const div = (cls) => Object.assign(document.createElement("div"), { className: cls });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("nova." + key);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem("nova." + key, JSON.stringify(value)); } catch { /* не страшно */ }
    },
  };

  const els = {
    app: $("#app"), history: $("#history"), search: $("#searchInput"), status: $("#statusBox"),
    theme: $("#themeBtn"), title: $("#chatTitle"), modes: $("#modeSwitch"), scroller: $("#scroller"),
    welcome: $("#welcome"), greeting: $("#greeting"), problem: $("#problem"), cards: $("#cards"),
    thread: $("#thread"), toBottom: $("#toBottom"), input: $("#input"), send: $("#sendBtn"),
    mic: $("#micBtn"), newChat: $("#newChatBtn"), collapse: $("#collapseBtn"),
    openSidebar: $("#openSidebarBtn"), scrim: $("#scrim"), toasts: $("#toasts"), modal: $("#modal"),
    tray: $("#tray"), fileInput: $("#fileInput"), attach: $("#attachBtn"), drop: $("#drop"),
    lightbox: $("#lightbox"), lightboxImg: $("#lightboxImg"),
    settings: $("#settings"), settingsBtn: $("#settingsBtn"), settingsClose: $("#settingsClose"),
    savedMark: $("#savedMark"), setName: $("#setName"), setCity: $("#setCity"), setCustom: $("#setCustom"),
    personas: $("#personas"), setAutoSpeak: $("#setAutoSpeak"), setVoiceSend: $("#setVoiceSend"),
    setVoice: $("#setVoice"), setRate: $("#setRate"), rateValue: $("#rateValue"), testVoice: $("#testVoice"),
    themeSeg: $("#themeSeg"), deleteAll: $("#deleteAll"),
    roleBadge: $("#roleBadge"), chatMenuBtn: $("#chatMenuBtn"), chatMenu: $("#chatMenu"),
    roleModal: $("#roleModal"), roleClose: $("#roleClose"), rolePresets: $("#rolePresets"), roleText: $("#roleText"),
    roleClear: $("#roleClear"), roleSave: $("#roleSave"), importBtn: $("#importBtn"), importInput: $("#importInput"),
    voiceStrip: $("#voiceStrip"), voiceWave: $("#voiceWave"), recTime: $("#recTime"),
    keyStatus: $("#keyStatus"), keyInput: $("#keyInput"), keySave: $("#keySave"),
    dsSection: $("#dsSection"), dsStatus: $("#dsStatus"), dsInput: $("#dsInput"), dsSave: $("#dsSave"),
  };

  const ROLE_PRESETS = [
    { emoji: "🐍", title: "Строгий питонист",
      text: "Ты строгий и опытный Python-разработчик. Пиши чистый идиоматичный код с аннотациями типов, прямо указывай на ошибки и плохие практики, без смягчений. Объясняй коротко и по делу." },
    { emoji: "🎬", title: "Сценарист игр",
      text: "Ты сценарист видеоигр. Придумываешь сюжеты, персонажей, диалоги и квесты; предлагаешь смелые идеи и всегда думаешь о геймплее и атмосфере." },
    { emoji: "🧱", title: "Roblox-разработчик",
      text: "Ты опытный разработчик игр в Roblox Studio. Помогаешь со скриптами на Luau, механиками, интерфейсом и оптимизацией; даёшь готовый код и объясняешь, куда его вставить." },
    { emoji: "🗣", title: "Учитель английского",
      text: "Ты учитель английского. Общайся на простом английском, мягко исправляй ошибки пользователя и объясняй их по-русски." },
    { emoji: "✍️", title: "Редактор текстов",
      text: "Ты внимательный редактор. Улучшай тексты пользователя — стиль, грамматику, структуру — и коротко объясняй главные правки." },
  ];

  function roleLabel(role) {
    const preset = ROLE_PRESETS.find((p) => p.text === role);
    if (preset) return preset.emoji + " " + preset.title;
    const first = role.replace(/\s+/g, " ").trim();
    return "🎭 " + (first.length > 26 ? first.slice(0, 25) + "…" : first);
  }

  const S = {
    ready: true, problem: "", mode: "fast", modes: {}, model: null, chats: [], current: null,
    busy: false, controller: null, results: null, follow: true, offline: false,
    settings: {}, personas: {}, pending: [],
  };

  const PERSONA_EMOJI = { friendly: "😊", brief: "⚡", fun: "🎉", teacher: "🎓" };

  async function api(path, body) {
    const res = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "X-Nova-Token": TOKEN, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      let msg = "ошибка " + res.status;
      try { msg = (await res.json()).error || msg; } catch { /* нет тела */ }
      throw new Error(msg);
    }
    return res.json();
  }

  function fmtTime(iso) {
    const d = iso ? new Date(iso) : new Date();
    if (isNaN(d)) return "";
    const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    const today = new Date().toDateString() === d.toDateString();
    return today ? time : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " + time;
  }

  const hostOf = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
  };

  function greetingText() {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Доброе утро";
    if (h >= 12 && h < 18) return "Добрый день";
    if (h >= 18 && h < 23) return "Добрый вечер";
    return "Доброй ночи";
  }

  function statusIcon(text) {
    if (/погод/i.test(text)) return "cloud";
    if (/новост/i.test(text)) return "news";
    if (/курс/i.test(text)) return "coins";
    if (/чита/i.test(text)) return "globe";
    if (/ищу|поиск/i.test(text)) return "search";
    return "sparkles";
  }

  // ---------- уведомления и подтверждение ----------

  function toast(text, kind = "", action = null) {
    const t = div("toast " + kind);
    t.innerHTML = icon(kind === "error" ? "alert" : "check", 16) + "<span></span>";
    $("span", t).textContent = text;
    if (action) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "toast-action";
      b.textContent = action.label;
      b.addEventListener("click", action.onClick);
      t.append(b);
    }
    els.toasts.append(t);
    setTimeout(() => {
      t.classList.add("out");
      setTimeout(() => t.remove(), 300);
    }, action ? 7000 : kind === "error" ? 4200 : 2400);
  }

  let modalResolve = null;
  function confirmModal(title, text, okText = "Удалить", { cancelText = "Отмена", danger = true } = {}) {
    $("#modalTitle").textContent = title;
    $("#modalText").textContent = text;
    $("#modalOk").textContent = okText;
    $("#modalOk").className = "btn " + (danger ? "danger" : "primary");
    $("#modalCancel").textContent = cancelText;
    els.modal.hidden = false;
    $("#modalOk").focus();
    return new Promise((resolve) => (modalResolve = resolve));
  }
  function closeModal(value) {
    els.modal.hidden = true;
    if (modalResolve) {
      modalResolve(value);
      modalResolve = null;
    }
  }

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
      if (btn) {
        const old = btn.innerHTML;
        const svg = btn.querySelector("svg");
        const size = svg ? svg.getAttribute("width") : 15;
        if (btn.classList.contains("code-copy")) {
          btn.innerHTML = icon("check", 14) + "<span>Скопировано</span>";
        } else {
          btn.innerHTML = icon("check", size);
        }
        setTimeout(() => (btn.innerHTML = old), 1400);
      } else {
        toast("Скопировано", "ok");
      }
    } catch {
      toast("Не получилось скопировать", "error");
    }
  }

  // ---------- тема, панель, звёзды ----------

  let redrawStars = () => {};
  const REDUCE_MOTION = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    els.theme.innerHTML = icon(theme === "dark" ? "sun" : "moon");
    els.theme.title = theme === "dark" ? "Светлая тема" : "Тёмная тема";
    store.set("theme", theme);
    redrawStars();
  }

  // Смена темы растекается кругом от кнопки, на которую нажали.
  function switchTheme(theme, fromEl) {
    if (theme === document.documentElement.dataset.theme) return;
    if (REDUCE_MOTION || !document.startViewTransition || !fromEl) return applyTheme(theme);
    const r = fromEl.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(theme));
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 620, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
  }

  const isNarrow = () => matchMedia("(max-width: 860px)").matches;

  function setSidebar(open) {
    if (isNarrow()) {
      els.app.classList.toggle("mobile-open", open);
    } else {
      els.app.classList.toggle("collapsed", !open);
      store.set("sidebar", open);
      setTimeout(positionPill, 300);
    }
  }
  const closeMobileSidebar = () => els.app.classList.remove("mobile-open");

  // Живой фон: звёзды мерцают и медленно плывут, ближние — быстрее дальних (глубина),
  // чуть смещаются за мышью, иногда пролетает метеор. Пока NOVA пишет ответ, небо оживляется.
  function startStars() {
    const canvas = $("#stars");
    const ctx = canvas.getContext("2d");
    let stars = [];
    let W = 0;
    let H = 0;
    let last = 0;
    let energy = 0; // 0 — покой, 1 — NOVA пишет
    let mx = 0, my = 0, px = 0, py = 0; // мышь и плавный параллакс
    const meteors = [];
    let nextMeteor = performance.now() + 5000 + Math.random() * 7000;

    // мягкая светящаяся звезда: рисуется один раз, потом только копируется
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 32;
    const sctx = sprite.getContext("2d");
    const grad = sctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.16, "rgba(255,255,255,0.92)");
    grad.addColorStop(0.4, "rgba(196,181,253,0.3)");
    grad.addColorStop(1, "rgba(196,181,253,0)");
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 32, 32);

    const isLight = () => document.documentElement.dataset.theme === "light";

    function resize() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      canvas.width = W * d;
      canvas.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.round((W * H) / 7200);
      stars = Array.from({ length: n }, () => {
        const z = Math.random() ** 1.7; // дальних звёзд больше, чем ближних
        return {
          x: Math.random() * W, y: Math.random() * H, z,
          r: 0.45 + z * 1.5, p: Math.random() * 6.283, s: 0.35 + Math.random() * 1.2,
          b: 0.35 + Math.random() * 0.65, tint: Math.random() < 0.18,
        };
      });
      draw(performance.now(), 0);
    }

    function drawMeteors(t, dt) {
      if (t > nextMeteor) {
        meteors.push({
          x: W * (0.35 + Math.random() * 0.75), y: Math.random() < 0.7 ? -20 : H * Math.random() * 0.35,
          vx: -(560 + Math.random() * 380), vy: 250 + Math.random() * 210, life: 0, max: 850 + Math.random() * 550,
        });
        nextMeteor = t + (S.busy ? 3500 : 9000) + Math.random() * 12000;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life += dt;
        m.x += (m.vx * dt) / 1000;
        m.y += (m.vy * dt) / 1000;
        const k = m.life / m.max;
        if (k >= 1) {
          meteors.splice(i, 1);
          continue;
        }
        const fade = Math.sin(Math.PI * k); // разгорается и гаснет
        const tx = m.x - m.vx * 0.15;
        const ty = m.y - m.vy * 0.15;
        const g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, `rgba(255,255,255,${0.95 * fade})`);
        g.addColorStop(0.25, `rgba(196,181,253,${0.5 * fade})`);
        g.addColorStop(1, "rgba(196,181,253,0)");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
      }
    }

    function draw(t, dt) {
      ctx.clearRect(0, 0, W, H);
      const light = isLight();
      energy += ((S.busy ? 1 : 0) - energy) * Math.min(1, dt / 900);
      px += (mx - px) * Math.min(1, dt / 450);
      py += (my - py) * Math.min(1, dt / 450);
      const move = ((5 + 26 * energy) * dt) / 1000;
      const glow = 1 + 0.45 * energy;
      for (const s of stars) {
        const v = 0.25 + s.z;
        s.x -= move * v;
        s.y += move * 0.35 * v;
        if (s.x < -6) s.x += W + 12;
        if (s.y > H + 6) s.y -= H + 12;
        const tw = 0.55 + 0.45 * Math.sin((t / 1000) * s.s + s.p);
        const a = Math.min(1, (0.1 + 0.68 * s.b * tw) * glow);
        const x = s.x + px * s.z * 16;
        const y = s.y + py * s.z * 11;
        if (light) {
          ctx.globalAlpha = a * 0.32;
          ctx.fillStyle = s.tint ? "#8b5cf6" : "#9d98c4";
          ctx.beginPath();
          ctx.arc(x, y, s.r * 0.9, 0, 6.283);
          ctx.fill();
        } else if (s.z > 0.5) {
          const size = s.r * 5.5;
          ctx.globalAlpha = a;
          ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
        } else {
          ctx.globalAlpha = a;
          ctx.fillStyle = s.tint ? "#d9ceff" : "#ffffff";
          ctx.beginPath();
          ctx.arc(x, y, s.r * 0.75, 0, 6.283);
          ctx.fill();
        }
      }
      if (!light && dt) drawMeteors(t, dt);
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      const dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      if (!document.hidden) draw(t, dt);
      requestAnimationFrame(loop);
    }
    addEventListener("resize", resize);
    addEventListener("mousemove", (e) => {
      mx = e.clientX / innerWidth - 0.5;
      my = e.clientY / innerHeight - 0.5;
    }, { passive: true });
    resize();
    if (!REDUCE_MOTION) requestAnimationFrame(loop);
    redrawStars = () => draw(performance.now(), 0);
  }

  // ---------- отрисовка: панель, шапка, статус ----------

  function applyState(st, { thread = true } = {}) {
    Object.assign(S, {
      ready: st.ready, problem: st.problem, mode: st.mode, modes: st.modes,
      model: st.model, chats: st.chats, current: st.current,
      settings: st.settings || S.settings, personas: st.personas || S.personas, key: st.key || S.key,
      dskey: st.dskey || S.dskey, groups: st.groups || S.groups,
    });
    setTimers(st.timers);
    renderTimers();
    pickVoice();
    renderSidebar();
    renderHeader();
    renderModes();
    renderStatus();
    if (thread) renderThread();
  }

  function groupLabel(text) {
    const g = div("history-group");
    g.textContent = text;
    return g;
  }

  // какие чаты уже показаны в списке — новые въезжают, а у переименованных плавно меняется название
  const seenChats = new Map();
  let sidebarReady = false;

  function chatItem(chat, snippet) {
    const item = div("chat-item" + (S.current && chat.id === S.current.id ? " active" : ""));
    if (sidebarReady && !S.results) {
      if (!seenChats.has(chat.id)) item.classList.add("fresh");
      else if (seenChats.get(chat.id) !== chat.title) item.classList.add("retitled");
    }
    item.title = chat.title;
    item.innerHTML =
      '<div class="ci-main"><span class="ci-title"></span>' + (snippet ? '<span class="ci-snippet"></span>' : "") + "</div>" +
      '<div class="ci-actions">' +
      `<button class="icon-btn" type="button" data-act="rename" title="Переименовать">${icon("pencil", 14)}</button>` +
      `<button class="icon-btn del" type="button" data-act="delete" title="Удалить">${icon("trash", 14)}</button></div>`;
    $(".ci-title", item).textContent = chat.title;
    if (snippet) $(".ci-snippet", item).textContent = snippet;
    if (chat.role) {
      const badge = document.createElement("span");
      badge.className = "ci-role";
      badge.title = "У этого чата своя роль";
      badge.textContent = "🎭";
      item.prepend(badge);
    }
    item.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]");
      if (act && act.dataset.act === "rename") startRename(item, chat);
      else if (act && act.dataset.act === "delete") deleteChat(chat);
      else if (!item.querySelector("input.rename")) openChat(chat.id);
    });
    return item;
  }

  function renderSidebar() {
    const box = els.history;
    box.replaceChildren();
    if (S.results) {
      if (!S.results.length) {
        box.innerHTML = '<div class="history-empty">Ничего не нашлось</div>';
        return;
      }
      box.append(groupLabel("Найдено"));
      S.results.forEach((c) => box.append(chatItem(c, c.snippet !== c.title ? c.snippet : "")));
      return;
    }
    if (!S.chats.length) {
      box.innerHTML = '<div class="history-empty">Здесь появятся твои чаты.<br>Они сохраняются сами.</div>';
      sidebarReady = true;
      return;
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const DAY = 86400000;
    const groups = [["Сегодня", []], ["Вчера", []], ["На этой неделе", []], ["Раньше", []]];
    for (const c of S.chats) {
      const t = new Date(c.updated).getTime();
      groups[t >= today ? 0 : t >= today - DAY ? 1 : t >= today - 6 * DAY ? 2 : 3][1].push(c);
    }
    for (const [label, list] of groups) {
      if (!list.length) continue;
      box.append(groupLabel(label));
      list.forEach((c) => box.append(chatItem(c)));
    }
    S.chats.forEach((c) => seenChats.set(c.id, c.title));
    sidebarReady = true;
  }

  function renderHeader() {
    const has = S.current && S.current.messages && S.current.messages.length;
    const title = (S.current && S.current.title) || "Новый чат";
    if (title !== els.title.textContent && els.title.textContent && !REDUCE_MOTION) {
      els.title.animate(
        [{ opacity: 0, transform: "translateY(5px)", filter: "blur(3px)" }, { opacity: 1, transform: "none", filter: "none" }],
        { duration: 420, easing: EASE }
      );
    }
    els.title.textContent = title;
    els.title.title = has ? "Двойной щелчок — переименовать" : "";
    const role = S.current && S.current.role;
    els.roleBadge.hidden = !role;
    if (role) {
      // значок и текст отдельно: на узком экране остаётся только значок
      const label = roleLabel(role);
      const sp = label.indexOf(" ");
      els.roleBadge.innerHTML = '<span class="rb-emoji"></span><span class="rb-text"></span>';
      $(".rb-emoji", els.roleBadge).textContent = label.slice(0, sp);
      $(".rb-text", els.roleBadge).textContent = label.slice(sp + 1);
    }
  }

  // ---------- выбор модели: Note / Chord / Symphony ----------

  const MODE_ICONS = { note: "musicNote", chord: "musicChord", sonata: "musicSonata", symphony: "musicSymphony" };

  function renderModes() {
    const cur = S.modes[S.mode] || { title: "NOVA", kind: "" };
    els.modes.innerHTML =
      '<button class="model-btn" id="modelBtn" type="button" aria-haspopup="true" aria-expanded="false" title="Выбрать модель">' +
      `<span class="model-icon">${icon(MODE_ICONS[S.mode] || "sparkles", 16)}</span>` +
      `<span class="mb-text"><b></b><small></small></span>${icon("chevron", 16)}</button>` +
      '<div class="menu model-menu" id="modelMenu" hidden></div>';
    $(".mb-text b", els.modes).textContent = cur.title;
    $(".mb-text small", els.modes).textContent = cur.kind;
    const menu = $("#modelMenu", els.modes);
    const addItem = ([key, m]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "model-item" + (key === S.mode ? " active" : "");
      b.innerHTML =
        `<span class="model-icon">${icon(MODE_ICONS[key] || "sparkles", 17)}</span>` +
        '<span><b><span class="mi-title"></span><small></small></b><span class="mi-hint"></span>' +
        (m.available ? "" : '<span class="mi-warn"></span>') + "</span>" +
        `<span class="mi-check">${key === S.mode ? icon("check", 16) : ""}</span>`;
      $(".mi-title", b).textContent = m.title;
      $("b small", b).textContent = m.kind;
      $(".mi-hint", b).textContent = m.hint;
      if (!m.available) $(".mi-warn", b).textContent = m.problem;
      b.addEventListener("click", () => {
        closeModelMenu();
        setMode(key);
      });
      menu.append(b);
    };
    // разделы: «Без VPN в России» и «Нужен VPN в России»
    const groups = S.groups || {};
    const buckets = new Map(Object.keys(groups).map((g) => [g, []]));
    const rest = [];
    for (const entry of Object.entries(S.modes)) (buckets.get(entry[1].group) || rest).push(entry);
    for (const [g, items] of buckets) {
      if (!items.length) continue;
      const h = div("model-group " + g);
      h.innerHTML = "<i></i><span></span>";
      $("span", h).textContent = groups[g];
      menu.append(h);
      items.forEach(addItem);
    }
    rest.forEach(addItem);
    if (Object.values(S.modes).some((m) => m.engine === "ollama")) {
      const foot = div("model-menu-foot");
      foot.textContent = "Note и Chord работают прямо на твоём компьютере — без интернета, ключа и лимитов. " +
        "Если выбранная модель недоступна, NOVA сама ответит другой. Картинки и PDF смотрят Symphony и Sonata на GigaChat.";
      menu.append(foot);
    }
    $("#modelBtn", els.modes).addEventListener("click", (e) => {
      e.stopPropagation();
      toggleModelMenu();
    });
    els.modes.classList.toggle("disabled", S.busy);
  }

  const modelMenu = () => $("#modelMenu", els.modes);
  function toggleModelMenu(open) {
    const menu = modelMenu();
    if (!menu) return;
    const show = open === undefined ? menu.hidden : open;
    menu.hidden = !show;
    $("#modelBtn", els.modes).setAttribute("aria-expanded", String(show));
  }
  const closeModelMenu = () => toggleModelMenu(false);

  function positionPill() {} // остался от старого переключателя «Быстрая / Умная»

  function renderStatus() {
    const st = els.status;
    let text;
    if (S.offline) {
      st.className = "status bad";
      text = "NOVA выключена — открой заново";
      st.title = "Окно потеряло связь с NOVA. Закрой его и запусти NOVA ярлыком.";
    } else if (!S.ready) {
      st.className = "status bad";
      text = "ИИ не подключён";
      st.title = S.problem;
    } else {
      const m = S.modes[S.mode];
      st.className = "status ok";
      text = (m ? m.title + " · " : "") + (S.model || "");
      st.title = m ? `${m.title} — ${m.kind}. Внутри: ${S.model}` : "Модель " + S.model;
    }
    $(".status-text", st).textContent = text;
  }

  // ---------- приветствие ----------

  function showWelcome(show) {
    els.welcome.hidden = !show;
    if (!show) return;
    els.greeting.textContent = greetingText() + (S.settings.name ? ", " + S.settings.name : "") + "!";
    els.problem.hidden = S.ready;
    if (!S.ready) {
      els.problem.innerHTML = icon("alert", 18) + "<div><div class='problem-text'></div></div>";
      $(".problem-text", els.problem).textContent = S.problem;
      const engine = (S.modes[S.mode] || {}).engine;
      const addButton = (label, onClick) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "btn primary";
        b.textContent = label;
        b.addEventListener("click", onClick);
        $("div", els.problem).append(b);
      };
      if (engine === "gemini" && S.key && !S.key.set) addButton("Вставить ключ", () => openSettings(true));
      if (engine === "deepseek" && S.dskey && !S.dskey.set) addButton("Вставить ключ для Sonata", () => openSettings("ds"));
      if (engine === "ollama" && /ollama\.com/.test(S.problem)) {
        addButton("Скачать Ollama", () => api("/api/open_url", { url: "https://ollama.com/download" }).catch(() => {}));
      }
    }
    if (!els.cards.children.length) {
      for (const c of CARDS) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "card";
        b.innerHTML = `<span class="card-icon">${icon(c.icon, 19)}</span><span><span class="card-title"></span><span class="card-text"></span></span>`;
        $(".card-title", b).textContent = c.title;
        $(".card-text", b).textContent = c.text;
        b.addEventListener("click", () => send(c.prompt));
        els.cards.append(b);
      }
    }
  }

  // ---------- сообщения ----------

  const fileUrl = (stored) => "/file/" + encodeURIComponent(stored) + "?token=" + encodeURIComponent(TOKEN);

  function fmtSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " Б";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " КБ";
    return (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " МБ";
  }

  const KIND_LABEL = { text: "код / текст", pdf: "PDF", doc: "Word", image: "картинка" };

  function fileChip(f, { removable = false, onRemove = null } = {}) {
    const chip = div("att file");
    chip.title = f.name;
    chip.innerHTML =
      `<span class="att-icon">${icon(f.kind === "text" ? "fileCode" : "fileText", 18)}</span>` +
      '<span class="att-meta"><b></b><small></small></span>';
    $("b", chip).textContent = f.name;
    $("small", chip).textContent = [KIND_LABEL[f.kind] || "файл", fmtSize(f.size)].filter(Boolean).join(" · ");
    if (removable) addRemove(chip, onRemove);
    return chip;
  }

  function addRemove(el, onRemove) {
    const x = document.createElement("button");
    x.type = "button";
    x.className = "x";
    x.title = "Убрать";
    x.innerHTML = icon("x", 12);
    x.addEventListener("click", (e) => {
      e.stopPropagation();
      onRemove();
    });
    el.append(x);
  }

  function openLightbox(src) {
    els.lightboxImg.src = src;
    els.lightbox.hidden = false;
  }

  function userMsg(text, files) {
    const w = div("msg user");
    if (files && files.length) {
      const box = div("msg-files");
      for (const f of files) {
        if (f.kind === "image" && (f.url || f.stored)) {
          const img = document.createElement("img");
          img.alt = f.name;
          img.title = f.name;
          img.src = f.url || fileUrl(f.stored);
          img.addEventListener("click", () => openLightbox(img.src));
          box.append(img);
        } else {
          const chip = fileChip(f);
          chip.title = f.stored ? "Открыть «" + f.name + "»" : f.name;
          chip.addEventListener("click", () => {
            if (f.stored) api("/api/open_file", { stored: f.stored }).catch(() => toast("Файл не найден", "error"));
          });
          box.append(chip);
        }
      }
      w.append(box);
    }
    if (text) {
      const bubble = div("bubble");
      bubble.textContent = text;
      w.append(bubble);
      const actions = div("actions");
      actions.innerHTML = `<button class="icon-btn" type="button" title="Копировать">${icon("copy", 15)}</button>`;
      $("button", actions).addEventListener("click", (e) => copyText(text, e.currentTarget));
      w.append(actions);
    }
    return w;
  }

  // ---------- «чернила»: хвост печатаемого текста проявляется плавно ----------
  // Последние символы чуть прозрачнее предыдущих; с каждым кадром текст растёт, и каждая буква
  // проступает, а не выскакивает. Берём только хвост — работа не зависит от длины ответа.
  const INK = 26;
  const graphemes = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("ru", { granularity: "grapheme" }) : null;
  const splitChars = (s) => (graphemes ? Array.from(graphemes.segment(s), (x) => x.segment) : Array.from(s));

  function tailTextNodes(root, need) {
    const out = [];
    let count = 0;
    (function walk(el) {
      for (let c = el.lastChild; c && count < need; c = c.previousSibling) {
        if (c.nodeType === 3) {
          if (!c.nodeValue) continue;
          out.push(c);
          count += c.nodeValue.length;
        } else if (c.nodeType === 1) walk(c);
      }
    })(root);
    return out; // от конца к началу
  }

  function fadeTail(root, n = INK) {
    if (REDUCE_MOTION) return;
    let d = 0; // сколько символов уже обработано с конца
    for (const node of tailTextNodes(root, n)) {
      if (d >= n) break;
      const text = node.nodeValue;
      let cut = Math.max(0, text.length - n * 3);
      if (cut > 0 && /[\uDC00-\uDFFF]/.test(text[cut])) cut--; // не резать эмодзи пополам
      const chars = splitChars(text.slice(cut));
      const take = Math.min(n - d, chars.length);
      const frag = document.createDocumentFragment();
      const head = text.slice(0, cut) + chars.slice(0, chars.length - take).join("");
      if (head) frag.append(head);
      chars.slice(chars.length - take).forEach((ch, k) => {
        if (!ch.trim()) return frag.append(ch);
        const dist = d + (take - k); // 1 — самый последний символ
        const span = document.createElement("span");
        span.className = "ink";
        span.style.opacity = (0.1 + (0.9 * (dist - 1)) / n).toFixed(3);
        span.textContent = ch;
        frag.append(span);
      });
      node.replaceWith(frag);
      d += take;
    }
  }

  // Ответ дописан: последние буквы спокойно «досыхают» до полной яркости.
  function settleTail(root) {
    if (REDUCE_MOTION) return;
    fadeTail(root);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.querySelectorAll(".ink").forEach((s) => {
        s.classList.add("settle");
        s.style.opacity = "1";
      });
    }));
  }

  // Таблица или код шире экрана: правый край мягко гаснет — видно, что можно листать вбок.
  function markScrollables(root) {
    requestAnimationFrame(() => root.querySelectorAll(".table-wrap, .code-block pre").forEach((el) => {
      const more = el.scrollWidth > el.clientWidth + 2;
      el.classList.toggle("scrollable", more);
      el.classList.toggle("at-end", !more || el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
    }));
  }

  function aiMsg() {
    const w = div("msg ai");
    w.innerHTML =
      `<div class="avatar">${ORBIT.mini}</div>` +
      '<div class="body"><div class="meta"><span class="name">NOVA</span><span class="when"></span></div>' +
      '<div class="status-line" hidden></div><div class="md"></div><div class="sources"></div>' +
      '<div class="actions"></div></div>';
    const md = $(".md", w);
    const statusEl = $(".status-line", w);
    let target = "";
    let shown = 0;
    let shownF = 0; // дробная часть: сколько символов «натекло» между кадрами
    let lastT = 0;
    let raf = 0;
    let streamed = false;
    let onDone = null;
    let thinking = null;

    const removeThinking = () => {
      if (thinking) {
        thinking.remove();
        thinking = null;
      }
    };

    // Текст печатается ровным потоком: скорость считается по времени и подстраивается под запас
    // ещё не показанного текста — куски от модели приходят рывками, а на экране рывков нет.
    function step(t) {
      raf = 0;
      const dt = lastT ? Math.min(64, t - lastT) : 16;
      lastT = t;
      const left = target.length - shown;
      if (left > 0) {
        let cps = 55 + left * 3.2; // символов в секунду
        if (onDone) cps = Math.max(cps, 260 + left * 6); // ответ уже весь пришёл — дописываем быстрее
        shownF = Math.min(target.length, Math.max(shownF, shown) + (cps * dt) / 1000);
        const next = Math.floor(shownF);
        if (next > shown) {
          shown = next;
          md.innerHTML = MD.render(target.slice(0, shown), { caret: true });
          fadeTail(md);
          follow();
        }
      }
      if (shown < target.length) kick();
      else {
        lastT = 0;
        if (onDone) {
          const f = onDone;
          onDone = null;
          f();
        }
      }
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };

    function setSources(list) {
      const box = $(".sources", w);
      box.replaceChildren();
      (list || []).forEach((s, i) => {
        const [label, url, site] = s;
        const a = document.createElement("a");
        a.className = "source";
        a.href = url;
        a.title = url;
        a.style.setProperty("--i", i); // источники появляются по очереди
        const img = document.createElement("img");
        img.alt = "";
        img.loading = "lazy";
        img.src = "https://www.google.com/s2/favicons?sz=32&domain=" + encodeURIComponent(site || hostOf(url));
        img.addEventListener("error", () => {
          const n = document.createElement("span");
          n.className = "src-num";
          n.textContent = i + 1;
          img.replaceWith(n);
        });
        const name = document.createElement("span");
        name.textContent = label;
        a.append(img, name);
        box.append(a);
      });
    }

    function setActions(text, isCommand) {
      const box = $(".actions", w);
      box.replaceChildren();
      const add = (name, title, handler, cls = "") => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "icon-btn " + cls;
        b.title = title;
        b.innerHTML = icon(name, 15);
        b.addEventListener("click", () => handler(b));
        box.append(b);
      };
      add("copy", "Копировать", (b) => copyText(text, b));
      if (isCommand) return;
      if (window.speechSynthesis) add("volume", "Озвучить", (b) => speak(text, b), "act-speak");
      add("refresh", "Ответить заново", () => regenerate(w), "act-regen");
    }

    function note(text) {
      const n = div("note");
      n.textContent = text;
      $(".sources", w).before(n);
    }

    function rememberNote(list) {
      if (!list || !list.length) return;
      const n = div("note mem-note");
      n.innerHTML = icon("brain", 14) + "<span></span>";
      $("span", n).textContent = "Запомнила: " + list.join("; ");
      n.title = "Долгая память — посмотреть и удалить можно в ⚙ Настройках";
      n.addEventListener("click", () => openSettings());
      $(".sources", w).before(n);
    }

    // Кнопки подтверждения для компьютера: «Закрыть Roblox» / «Не надо». Без нажатия ничего не случится.
    function setPcActions(list) {
      const old = $(".pc-actions", w);
      if (old) old.remove();
      if (!list || !list.length) return;
      const box = div("pc-actions");
      for (const a of list) {
        const row = div("pc-action");
        const settle = (state, text) => {
          row.className = "pc-action " + state;
          row.innerHTML = icon(state === "done" ? "check" : state === "declined" ? "x" : "alert", 15) + "<span></span>";
          $("span", row).textContent = text;
        };
        if (a.state && a.state !== "pending") {
          settle(a.state, a.result || (a.state === "declined" ? "Отменено." : a.label));
          box.append(row);
          continue;
        }
        const yes = document.createElement("button");
        yes.type = "button";
        yes.className = "btn " + (a.danger ? "danger" : "primary");
        yes.textContent = a.label;
        const no = document.createElement("button");
        no.type = "button";
        no.className = "btn";
        no.textContent = "Не надо";
        const press = async (ok) => {
          yes.disabled = no.disabled = true;
          if (ok) yes.textContent = "Выполняю…";
          try {
            const r = await api("/api/action", { id: a.id, yes: ok });
            settle(r.ok ? (ok ? "done" : "declined") : "failed", r.text || (ok ? "Готово." : "Отменено."));
          } catch (e) {
            settle("failed", "Не получилось: " + e.message);
          }
          follow();
        };
        yes.addEventListener("click", () => press(true));
        no.addEventListener("click", () => press(false));
        row.append(yes, no);
        box.append(row);
      }
      $(".sources", w).before(box);
    }

    function showError(text) {
      const card = div("error-card");
      card.innerHTML = icon("alert", 18) + '<div><div class="err-text"></div><button class="retry" type="button">Повторить</button></div>';
      $(".err-text", card).textContent = text;
      $(".retry", card).addEventListener("click", () => regenerate(w));
      md.after(card);
    }

    const when = (iso, model) => {
      const el = $(".when", w);
      el.textContent = fmtTime(iso);
      if (model) el.title = "Модель: " + model;
    };

    return {
      wrap: w,
      working() {
        w.classList.add("working");
        thinking = div("thinking");
        thinking.innerHTML = "<i></i><i></i><i></i>";
        md.before(thinking);
      },
      status(text) {
        removeThinking();
        statusEl.hidden = false;
        statusEl.innerHTML = icon(statusIcon(text), 15) + '<span class="shimmer"></span>';
        $(".shimmer", statusEl).textContent = text + "…";
        follow();
      },
      push(text) {
        removeThinking();
        statusEl.hidden = true;
        streamed = true;
        target += text;
        kick();
      },
      reset() {
        target = "";
        shown = 0;
        shownF = 0;
        lastT = 0;
        md.innerHTML = "";
      },
      fill(m) {
        md.innerHTML = MD.render(m.text);
        markScrollables(md);
        setSources(m.sources);
        when(m.time);
        setActions(m.text, m.local);
        if (m.stopped) note("Ответ был остановлен");
        if (m.note) note(m.note); // «Symphony недоступна — ответила Sonata»
        if (m.actions) setPcActions(m.actions);
        rememberNote(m.remembered);
      },
      finish(ev) {
        removeThinking();
        w.classList.remove("working");
        statusEl.hidden = true;
        const kind = ev.kind;
        if (kind === "error") {
          md.innerHTML = "";
          when();
          showError(ev.text || "Что-то пошло не так.");
          follow();
          return;
        }
        const finalText = kind === "stopped" ? target : ev.text != null ? ev.text : target;
        const complete = () => {
          md.innerHTML = MD.render(finalText);
          if (streamed) settleTail(md);
          markScrollables(md);
          setSources(ev.sources);
          when(null, ev.by || ev.model); // by — модель, которая ответила на самом деле
          if (finalText) setActions(finalText, kind === "command");
          if (kind === "stopped") note(finalText ? "Ответ остановлен" : "Остановлено");
          if (ev.note) note(ev.note);
          if (ev.actions && ev.actions.length) setPcActions(ev.actions);
          rememberNote(ev.remembered);
          follow();
          if (kind === "ai" && S.settings.auto_speak && !call.on) {
            const btn = $(".act-speak", w);
            if (btn) speak(finalText, btn);
          }
        };
        if (kind !== "ai" || !streamed || document.hidden) {
          target = finalText;
          shown = finalText.length;
          complete();
          return;
        }
        target = finalText;
        shown = Math.min(shown, finalText.length);
        shownF = shown;
        onDone = complete;
        kick();
      },
    };
  }

  function renderThread() {
    stopSpeaking();
    els.thread.replaceChildren();
    const msgs = (S.current && S.current.messages) || [];
    if (!msgs.length) {
      showWelcome(true);
      els.toBottom.classList.remove("show");
      els.scroller.scrollTop = 0;
      return;
    }
    showWelcome(false);
    els.thread.classList.add("no-anim");
    for (const m of msgs) {
      if (m.role === "user") els.thread.append(userMsg(m.text, m.files));
      else {
        const a = aiMsg();
        a.fill(m);
        els.thread.append(a.wrap);
      }
    }
    requestAnimationFrame(() => {
      scrollBottom(false);
      els.thread.classList.remove("no-anim");
    });
    if (!REDUCE_MOTION) {
      els.thread.animate(
        [{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }],
        { duration: 340, easing: EASE }
      );
    }
  }

  // ---------- прокрутка ----------

  const nearBottom = () => els.scroller.scrollHeight - els.scroller.scrollTop - els.scroller.clientHeight < 60;

  // Пока ответ растёт, чат не прыгает вниз, а плавно доезжает за текстом.
  let glideRaf = 0;
  let progTop = -1; // куда прокрутили мы сами — чтобы не принять это за прокрутку пользователем
  function follow() {
    if (!S.follow) return;
    if (REDUCE_MOTION) {
      els.scroller.scrollTop = els.scroller.scrollHeight;
      progTop = els.scroller.scrollTop;
      return;
    }
    if (!glideRaf) glideRaf = requestAnimationFrame(glide);
  }
  function glide() {
    glideRaf = 0;
    if (!S.follow) return;
    const sc = els.scroller;
    const diff = sc.scrollHeight - sc.clientHeight - sc.scrollTop;
    if (diff <= 1) return;
    sc.scrollTop += diff > 900 ? diff - 600 : Math.max(1, diff * 0.2);
    progTop = sc.scrollTop;
    glideRaf = requestAnimationFrame(glide);
  }

  function scrollBottom(smooth) {
    S.follow = true;
    els.scroller.scrollTo({ top: els.scroller.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }

  // ---------- отправка и потоковый ответ ----------

  function setBusy(busy) {
    S.busy = busy;
    document.body.classList.toggle("nova-writing", busy); // фон оживает, пока NOVA пишет
    els.send.classList.toggle("stop", busy);
    els.send.innerHTML = icon(busy ? "square" : "arrowUp", busy ? 18 : 20);
    els.send.title = busy ? "Остановить (Esc)" : "Отправить (Enter)";
    els.newChat.disabled = busy;
    els.modes.classList.toggle("disabled", busy);
    updateSendButton();
  }

  function updateSendButton() {
    els.send.disabled = !S.busy && !els.input.value.trim() && !S.pending.length;
  }

  // ---------- вложения: выбор, перетаскивание, вставка ----------

  const TEXT_EXT = new Set(("txt md markdown rst log csv tsv json jsonl xml yaml yml toml ini cfg conf env properties " +
    "html htm css scss sass less js mjs cjs ts tsx jsx vue svelte py pyw ipynb java kt kts c h cpp hpp cc cs go rs php rb " +
    "swift lua luau gd gdshader tscn tres sql sh bash bat cmd ps1 psm1 r m dart scala pl srt vtt tex svg gradle dockerfile").split(" "));
  const extOf = (name) => (name.includes(".") ? name.split(".").pop().toLowerCase() : "");

  async function looksLikeText(file) {
    try {
      const head = new Uint8Array(await file.slice(0, 4096).arrayBuffer());
      if (head.includes(0)) return false;
      new TextDecoder("utf-8", { fatal: true }).decode(head);
      return true;
    } catch {
      return false;
    }
  }

  async function kindOf(file) {
    const ext = extOf(file.name);
    const type = file.type || "";
    if (/^image\/(jpeg|png|webp|gif|bmp|avif)$/.test(type) || ["jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"].includes(ext)) return "image";
    if (ext === "heic" || ext === "heif") return "heic";
    if (ext === "pdf" || type === "application/pdf") return "pdf";
    if (ext === "docx") return "doc";
    if (TEXT_EXT.has(ext) || type.startsWith("text/") || /json|xml|javascript/.test(type)) return "text";
    if (file.size < 3e6 && (await looksLikeText(file))) return "text";
    return null;
  }

  // Картинки уменьшаются до 2048 px и пересохраняются в JPEG: быстрее отправка, меньше расход лимита.
  async function shrinkImage(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("картинка не читается"))), "image/jpeg", 0.9)
    );
  }

  async function addFiles(list) {
    for (const file of list) {
      if (S.pending.length >= 5) {
        toast("Можно прикрепить не больше 5 файлов за раз", "error");
        break;
      }
      const kind = await kindOf(file);
      if (!kind) {
        toast(`«${file.name}» NOVA пока не читает. Подойдут картинки, PDF, Word, код и тексты.`, "error");
        continue;
      }
      if (kind !== "image" && file.size > 15e6) {
        toast(`«${file.name}» слишком большой — до 15 МБ`, "error");
        continue;
      }
      const item = { id: Math.random().toString(36).slice(2), name: file.name, size: file.size, kind, mime: file.type };
      if (kind === "image") {
        item.url = URL.createObjectURL(file);
        item.name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        item.mime = "image/jpeg";
        item.ready = shrinkImage(file);
        item.ready.catch(() => {
          toast(`Не получилось открыть картинку «${file.name}»`, "error");
          S.pending = S.pending.filter((p) => p !== item);
          renderTray();
        });
      } else {
        if (kind === "heic") {
          item.kind = "image";
          item.mime = "image/heic";
        }
        item.ready = Promise.resolve(file);
      }
      S.pending.push(item);
    }
    renderTray();
    els.input.focus();
  }

  function renderTray() {
    els.tray.replaceChildren();
    els.tray.hidden = !S.pending.length;
    for (const item of S.pending) {
      const remove = () => {
        S.pending = S.pending.filter((p) => p !== item);
        renderTray();
      };
      let el;
      if (item.url) {
        el = div("att img loading");
        el.title = item.name;
        const img = document.createElement("img");
        img.src = item.url;
        img.alt = item.name;
        el.append(img);
        item.ready.then(() => el.classList.remove("loading"), () => {});
        addRemove(el, remove);
      } else {
        el = fileChip(item, { removable: true, onRemove: remove });
      }
      els.tray.append(el);
    }
    updateSendButton();
  }

  function autosize() {
    els.input.style.height = "auto";
    els.input.style.height = Math.min(els.input.scrollHeight, 220) + "px";
  }

  async function readLines(res, onEvent) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let ev;
        try { ev = JSON.parse(line); } catch { continue; }
        onEvent(ev);
      }
    }
  }

  function touchChat(summary) {
    if (!summary) return;
    if (S.current && S.current.id === summary.id) S.current.title = summary.title;
    S.chats = [summary, ...S.chats.filter((c) => c.id !== summary.id)];
    renderSidebar();
    renderHeader();
  }

  // ---------- таймеры и напоминания: значок в шапке с обратным отсчётом ----------
  function fmtLeft(sec) {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    const two = (n) => String(n).padStart(2, "0");
    return h ? `${h}:${two(m)}:${two(s)}` : `${m}:${two(s)}`;
  }
  function timerWhen(at) {
    const d = new Date(at * 1000), now = new Date();
    const hm = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === now.toDateString()) return "в " + hm;
    const tmr = new Date(now.getTime() + 864e5);
    return (d.toDateString() === tmr.toDateString() ? "завтра в " : d.toLocaleDateString("ru-RU") + " в ") + hm;
  }
  function renderTimers() {
    const wrap = $("#timerWrap");
    if (!wrap) return;
    const now = Date.now() / 1000;
    const list = (S.timers || []).filter((t) => t.at > now - 1);
    wrap.hidden = !list.length;
    const menu = $("#timerMenu");
    if (!list.length) {
      menu.hidden = true;
      return;
    }
    const t = list[0];
    const pill = $("#timerPill");
    pill.classList.toggle("soon", t.at - now < 60);
    pill.innerHTML = icon("bell", 15) + "<b></b><span></span>";
    $("b", pill).textContent = fmtLeft(t.at - now);
    $("span", pill).textContent = (t.text ? " · " + t.text : "") + (list.length > 1 ? `  +${list.length - 1}` : "");
    if (menu.hidden) return;
    menu.replaceChildren();
    for (const x of list) {
      const row = div("timer-row");
      row.innerHTML = '<div><b></b><small></small></div><button class="icon-btn" type="button" title="Отменить"></button>';
      $("b", row).textContent = x.text || "Таймер";
      $("small", row).textContent = `${timerWhen(x.at)} · через ${fmtLeft(x.at - now)}`;
      const del = $("button", row);
      del.innerHTML = icon("x", 14);
      del.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          const r = await api("/api/timer_cancel", { id: x.id });
          S.timers = r.timers || [];
          toast("Отменено: " + (x.text || "таймер"));
        } catch (err) {
          toast("Не получилось отменить: " + err.message, "error");
        }
        renderTimers();
      });
      menu.append(row);
    }
  }
  // Новый список таймеров (с сервера или из телефона). Если какой-то пропал, потому что уже сработал, — сказать.
  function setTimers(list) {
    const now = Date.now() / 1000;
    const fresh = new Set((list || []).map((t) => t.id));
    for (const t of S.timers || []) {
      if (!fresh.has(t.id) && t.at <= now + 1.5) toast("⏰ " + (t.text || "Таймер: время вышло!"));
    }
    S.timers = list || [];
  }

  function tickTimers() {
    const now = Date.now() / 1000;
    const due = (S.timers || []).filter((t) => t.at <= now);
    if (due.length) {
      S.timers = S.timers.filter((t) => t.at > now);
      due.forEach((t) => toast("⏰ " + (t.text || "Таймер: время вышло!")));
      setTimeout(syncState, 2000); // «Ещё 5 минут» в окошке — новый таймер придёт с сервера
    }
    if (S.timers && S.timers.length) renderTimers();
  }

  async function syncState() {
    try {
      const st = await api("/api/state");
      Object.assign(S, { chats: st.chats, current: st.current, model: st.model });
      setTimers(st.timers);
      renderSidebar();
      renderHeader();
      renderStatus();
      renderTimers();
    } catch { /* связь пропала — покажет пинг */ }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
      reader.onerror = () => reject(new Error("не получилось прочитать файл"));
      reader.readAsDataURL(blob);
    });
  }

  // «Кто это?» про картинку. GigaChat (Sonata) плохо узнаёт персонажей и людей — на такой вопрос
  // NOVA предлагает спросить Symphony (Gemini) один раз, не меняя выбранную модель.
  const WHO_RE = new RegExp(
    "(?:^|[^а-яёa-z])(?:" +
      "кто\\s+(?:это|эт[оа]|там|он|она|так(?:ой|ая|ие)|изображ|нарисован|на\\s+(?:фото|фотк|картинк|изображ|скрин|аватар|рисунк|арт))" +
      "|как\\s+(?:его|её|ее|их)\\s+зовут|(?:его|её|ее)\\s+имя|имя\\s+(?:его|её|ее|персонажа)" +
      "|что\\s+за\\s+(?:персонаж|перс|чел|человек|герой)|из\\s+какого\\s+(?:аниме|мульт|сериал|фильм|игр|фандом|комикс)" +
      "|откуда\\s+(?:он|она|этот|эта|персонаж)|узна[её]шь|who\\s+is|who's)",
    "i"
  );
  function lastUserHadImage() {
    const msgs = (S.current && S.current.messages) || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "user" && !msgs[i].local) return (msgs[i].files || []).some((f) => f.kind === "image");
    }
    return false;
  }
  function whoAsksSymphony(text) {
    const son = S.modes.sonata, sym = S.modes.symphony;
    if (S.mode !== "sonata" || !son || !son.sees || !sym || !sym.available) return false;
    if (!WHO_RE.test((text || "").toLowerCase())) return false;
    return S.pending.some((f) => f.kind === "image") || lastUserHadImage();
  }

  async function send(text, { regenerate = false, voice = false } = {}) {
    text = (text || "").trim();
    if (S.busy || S.asking || (!text && !S.pending.length && !regenerate)) return;
    let once = "";
    if (!regenerate && !voice && whoAsksSymphony(text)) {
      S.asking = true;
      try {
        const yes = await confirmModal(
          "Кто на картинке?",
          "Sonata плохо узнаёт персонажей и людей. Symphony (Gemini) узнаёт намного лучше — спросить её " +
            "только про это сообщение? Выбранная модель не поменяется, а если Symphony недоступна, ответит Sonata.",
          "Спросить Symphony",
          { cancelText: "Пусть ответит Sonata", danger: false }
        );
        if (yes) once = "symphony";
      } finally {
        S.asking = false;
      }
    }
    const files = regenerate ? [] : S.pending.splice(0);
    renderTray();
    stopSpeaking();
    showWelcome(false);
    let userEl = null;
    if (!regenerate) {
      userEl = userMsg(text, files);
      els.thread.append(userEl);
      els.input.value = "";
      autosize();
    }
    const ai = aiMsg();
    ai.working();
    els.thread.append(ai.wrap);
    scrollBottom(true);
    setBusy(true);

    const controller = new AbortController();
    S.controller = controller;
    let finished = false;
    let result = null; // чем кончился ответ — голосовому разговору нужно, что сказать вслух
    const done = (ev) => {
      if (!finished) {
        finished = true;
        result = ev;
        ai.finish(ev);
      }
    };

    try {
      if (files.length) ai.status("Загружаю вложения");
      const attachments = await Promise.all(
        files.map(async (f) => ({ name: f.name, mime: f.mime, data: await blobToBase64(await f.ready) }))
      );
      const res = await fetch(regenerate ? "/api/regenerate" : "/api/send", {
        method: "POST",
        headers: { "X-Nova-Token": TOKEN, "Content-Type": "application/json" },
        body: JSON.stringify({ text, attachments, once, voice }),
        signal: controller.signal,
      });
      if (!res.ok) {
        let msg = "ошибка " + res.status;
        try { msg = (await res.json()).error || msg; } catch { /* нет тела */ }
        throw new Error(msg);
      }
      await readLines(res, (ev) => {
        if (ev.t === "chat") touchChat(ev.chat);
        else if (ev.t === "attach" && userEl) {
          // NOVA сама приложила скриншот экрана — показать его в сообщении пользователя
          const shot = $(".msg-files", userMsg("", ev.files));
          if (shot) userEl.prepend(shot);
        }
        else if (ev.t === "status") ai.status(ev.text);
        else if (ev.t === "delta") ai.push(ev.text);
        else if (ev.t === "reset") {
          ai.reset();
          ai.status("Пробую ещё раз");
        } else if (ev.t === "done") {
          if (ev.chat) touchChat(ev.chat);
          if (ev.model) {
            S.model = ev.model;
            renderStatus();
          }
          done(ev);
        }
      });
      if (!finished) done({ kind: "error", text: "Связь с NOVA прервалась. Попробуй ещё раз." });
    } catch (e) {
      if (e.name === "AbortError") done({ kind: "stopped" });
      else done({ kind: "error", text: "Не получилось получить ответ: " + e.message });
    } finally {
      S.controller = null;
      setBusy(false);
      await syncState();
      // после первого ответа NOVA в фоне придумывает чату короткое название — подхватим его
      const answers = S.current ? S.current.messages.filter((m) => m.role === "ai" && !m.local).length : 0;
      if (answers === 1) setTimeout(syncState, 2500);
    }
    return result;
  }

  function stop() {
    if (S.controller) S.controller.abort();
  }

  function regenerate(msgEl) {
    if (S.busy) return;
    msgEl.remove();
    send("", { regenerate: true });
  }

  // ---------- чаты ----------

  async function openChat(id) {
    if (S.busy) return toast("Подожди, NOVA ещё отвечает");
    closeMobileSidebar();
    if (S.current && id === S.current.id) return;
    try {
      applyState(await api("/api/open", { id }));
      els.input.focus();
    } catch (e) {
      toast("Не открылся чат: " + e.message, "error");
    }
  }

  async function newChat() {
    if (S.busy) return;
    closeMobileSidebar();
    if (!S.current || !S.current.messages.length) {
      els.input.focus();
      return;
    }
    try {
      applyState(await api("/api/new", {}));
      els.input.focus();
    } catch (e) {
      toast("Не получилось: " + e.message, "error");
    }
  }

  async function deleteChat(chat) {
    if (S.busy) return toast("Подожди, NOVA ещё отвечает");
    const ok = await confirmModal("Удалить чат?", `«${chat.title}» исчезнет навсегда.`);
    if (!ok) return;
    try {
      const wasCurrent = S.current && S.current.id === chat.id;
      const st = await api("/api/delete", { id: chat.id });
      if (S.results) S.results = S.results.filter((c) => c.id !== chat.id);
      applyState(st, { thread: wasCurrent });
      toast("Чат удалён", "ok");
    } catch (e) {
      toast("Не получилось удалить: " + e.message, "error");
    }
  }

  async function rename(id, title) {
    try {
      const st = await api("/api/rename", { id, title });
      if (S.results) S.results = S.results.map((c) => (c.id === id ? { ...c, title } : c));
      applyState(st, { thread: false });
    } catch (e) {
      toast("Не получилось переименовать: " + e.message, "error");
      renderSidebar();
      renderHeader();
    }
  }

  function startRename(item, chat) {
    const main = $(".ci-main", item);
    const input = document.createElement("input");
    input.className = "rename";
    input.value = chat.title;
    input.maxLength = 80;
    main.replaceChildren(input);
    input.focus();
    input.select();
    let finished = false;
    const finish = (save) => {
      if (finished) return;
      finished = true;
      const title = input.value.trim();
      if (save && title && title !== chat.title) rename(chat.id, title);
      else renderSidebar();
    };
    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") finish(true);
      else if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
    input.addEventListener("click", (e) => e.stopPropagation());
  }

  function renameFromHeader() {
    if (!S.current || !S.current.messages.length) return;
    const t = els.title;
    t.contentEditable = "true";
    t.textContent = S.current.title;
    t.focus();
    getSelection().selectAllChildren(t);
    let finished = false;
    const finish = (save) => {
      if (finished) return;
      finished = true;
      t.contentEditable = "false";
      t.removeEventListener("keydown", onKey);
      const title = t.textContent.replace(/\s+/g, " ").trim();
      if (save && title && title !== S.current.title) rename(S.current.id, title);
      else renderHeader();
    };
    const onKey = (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    };
    t.addEventListener("keydown", onKey);
    t.addEventListener("blur", () => finish(true), { once: true });
  }

  async function setMode(mode) {
    if (S.busy || mode === S.mode) return;
    try {
      applyState(await api("/api/mode", { mode }), { thread: false });
      if (!els.welcome.hidden) showWelcome(true);
      const m = S.modes[S.mode];
      if (m.available) toast(`${m.title} — ${m.kind}`, "ok");
      else toast(m.problem, "error");
    } catch (e) {
      toast("Не получилось сменить режим: " + e.message, "error");
    }
  }

  // ---------- голос: озвучка и микрофон ----------

  const synth = window.speechSynthesis;
  let voice = null;
  let speakingBtn = null;

  function pickVoice() {
    if (!synth) return;
    const all = synth.getVoices();
    const chosen = S.settings.voice && all.find((v) => v.name === S.settings.voice);
    const ru = all.filter((v) => v.lang && v.lang.toLowerCase().startsWith("ru"));
    voice = chosen || ru.find((v) => /natural/i.test(v.name)) || ru.find((v) => /online/i.test(v.name)) || ru[0] || null;
  }
  if (synth) {
    pickVoice();
    synth.addEventListener("voiceschanged", () => {
      pickVoice();
      if (!els.settings.hidden) fillVoices();
    });
  }

  function setSpeakBtn(btn, on) {
    if (!btn) return;
    btn.classList.toggle("on", on);
    if (btn.classList.contains("btn")) return; // кнопка «Проверить голос» в настройках
    btn.innerHTML = icon(on ? "square" : "volume", 15);
    btn.title = on ? "Остановить" : "Озвучить";
  }

  function stopSpeaking() {
    if (!synth) return;
    synth.cancel();
    if (speakingBtn) setSpeakBtn(speakingBtn, false);
    speakingBtn = null;
  }

  function speak(text, btn) {
    if (!synth) return;
    if (speakingBtn === btn) return stopSpeaking();
    stopSpeaking();
    // длинный текст — по предложениям: так браузер не обрывает озвучку на середине
    const chunks = speechChunks(text);
    if (!chunks.length) return;
    speakingBtn = btn;
    setSpeakBtn(btn, true);
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk);
      u.lang = voice ? voice.lang : "ru-RU";
      if (voice) u.voice = voice;
      u.rate = S.settings.rate || 1.05;
      if (i === chunks.length - 1) {
        u.onend = () => {
          if (speakingBtn === btn) {
            speakingBtn = null;
            setSpeakBtn(btn, false);
          }
        };
      }
      u.onerror = (e) => {
        if (e.error !== "interrupted" && e.error !== "canceled") toast("Не получилось озвучить", "error");
        if (speakingBtn === btn) {
          speakingBtn = null;
          setSpeakBtn(btn, false);
        }
      };
      synth.speak(u);
    });
  }

  // ---------- живая волна микрофона ----------
  // Пока идёт запись, звук с микрофона раскладывается на частоты (AnalyserNode), и полоски
  // прыгают в такт голосу: низкие частоты — в центре, высокие — по краям.

  const BARS = 44;
  const viz = { ctx: null, stream: null, analyser: null, data: null, raf: 0, started: 0, smooth: [] };

  async function startWave() {
    els.voiceStrip.hidden = false;
    viz.started = performance.now();
    viz.smooth = new Array(BARS).fill(0);
    try {
      viz.ctx = new AudioContext(); // создаём сразу по нажатию — так браузер не «усыпит» звук
      viz.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!rec) return stopWave(); // запись успела закончиться
      viz.analyser = viz.ctx.createAnalyser();
      viz.analyser.fftSize = 512;
      viz.analyser.smoothingTimeConstant = 0.72;
      viz.ctx.createMediaStreamSource(viz.stream).connect(viz.analyser);
      viz.data = new Uint8Array(viz.analyser.frequencyBinCount);
      if (viz.ctx.state === "suspended") await viz.ctx.resume();
      els.mic.classList.add("live");
    } catch {
      viz.analyser = null; // нет доступа к звуку — рисуем спокойную «дышащую» волну
    }
    if (!viz.raf) viz.raf = requestAnimationFrame(drawWave);
  }

  function stopWave() {
    cancelAnimationFrame(viz.raf);
    viz.raf = 0;
    if (viz.stream) viz.stream.getTracks().forEach((t) => t.stop());
    if (viz.ctx) viz.ctx.close().catch(() => {});
    Object.assign(viz, { ctx: null, stream: null, analyser: null, data: null });
    els.voiceStrip.hidden = true;
    els.mic.classList.remove("live");
    els.mic.style.removeProperty("--level");
  }

  function voiceLevels() {
    if (!viz.analyser) return null;
    viz.analyser.getByteFrequencyData(viz.data);
    const binHz = viz.ctx.sampleRate / viz.analyser.fftSize;
    const lo = Math.max(1, Math.floor(80 / binHz));
    const hi = Math.min(viz.data.length - 1, Math.ceil(4000 / binHz)); // голос — примерно 80–4000 Гц
    const half = BARS / 2;
    const levels = [];
    for (let i = 0; i < half; i++) {
      const a = Math.floor(lo * Math.pow(hi / lo, i / half));
      const b = Math.ceil(lo * Math.pow(hi / lo, (i + 1) / half));
      let peak = 0;
      for (let k = a; k <= b; k++) peak = Math.max(peak, viz.data[k] || 0);
      levels.push(peak / 255);
    }
    return levels;
  }

  function drawWave(t) {
    viz.raf = 0;
    if (els.voiceStrip.hidden) return;
    const c = els.voiceWave;
    const d = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (c.width !== Math.round(w * d) || c.height !== Math.round(h * d)) {
      c.width = Math.round(w * d);
      c.height = Math.round(h * d);
    }
    const g = c.getContext("2d");
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, w, h);

    const levels = voiceLevels();
    const time = (t - viz.started) / 1000;
    const half = BARS / 2;
    const gap = 3;
    const bw = Math.max(2, (w - gap * (BARS - 1)) / BARS);
    const grad = g.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "#6366f1");
    grad.addColorStop(0.5, "#c4b5fd");
    grad.addColorStop(1, "#6366f1");
    g.fillStyle = grad;

    let total = 0;
    for (let i = 0; i < BARS; i++) {
      const k = i < half ? half - 1 - i : i - half; // зеркально от центра
      const voice = levels ? Math.pow(levels[k], 1.35) : 0;
      const idle = 0.07 + 0.05 * Math.sin(time * 3.2 + i * 0.55); // лёгкое «дыхание» в тишине
      const target = Math.max(voice, idle);
      const s = viz.smooth[i];
      viz.smooth[i] = s + (target - s) * (target > s ? 0.55 : 0.16); // вверх быстро, вниз плавно
      const bh = Math.max(3, viz.smooth[i] * h);
      g.beginPath();
      g.roundRect(i * (bw + gap), (h - bh) / 2, bw, bh, bw / 2);
      g.fill();
      total += levels ? voice : 0;
    }
    els.mic.style.setProperty("--level", Math.min(1, (total / BARS) * 2.4).toFixed(3));
    const sec = Math.floor(time);
    els.recTime.textContent = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
    viz.raf = requestAnimationFrame(drawWave);
  }

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;

  function toggleMic() {
    if (rec) return rec.stop();
    rec = new Recognition();
    rec.lang = "ru-RU";
    rec.interimResults = true;
    rec.continuous = false;
    const before = els.input.value.trim() ? els.input.value.trim() + " " : "";
    let heard = false;
    rec.onresult = (e) => {
      let said = "";
      for (const r of e.results) said += r[0].transcript;
      heard = heard || e.results[e.results.length - 1].isFinal;
      els.input.value = before + said;
      autosize();
      updateSendButton();
    };
    rec.onerror = (e) => {
      const msg = {
        "not-allowed": "Нет доступа к микрофону — разреши его вверху окна.",
        "service-not-allowed": "Нет доступа к микрофону — разреши его вверху окна.",
        "no-speech": "Ничего не услышала — попробуй ещё раз.",
        "network": "Распознавание речи сейчас недоступно — нужен интернет.",
        "audio-capture": "Не нашла микрофон.",
      }[e.error];
      if (msg) toast(msg, "error");
    };
    rec.onend = () => {
      rec = null;
      stopWave();
      els.mic.classList.remove("listening");
      els.mic.title = "Сказать голосом";
      els.input.focus();
      if (heard && S.settings.voice_send && els.input.value.trim() && !S.busy) send(els.input.value);
    };
    try {
      rec.start();
      els.mic.classList.add("listening");
      els.mic.title = "Остановить запись";
      startWave();
    } catch {
      rec = null;
      toast("Не получилось включить микрофон", "error");
    }
  }

  // ---------- голосовой разговор («звонок»): слушает → отвечает голосом → снова слушает ----------

  const call = { on: false, state: "", rec: null, quiet: 0, meter: null, err: null };

  function callUI(state, text) {
    call.state = state;
    const box = $("#call");
    box.dataset.state = state;
    $("#callState").textContent = text;
  }

  function localVoice() {
    const ru = synth ? synth.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("ru")) : [];
    return ru.find((v) => v.localService) || null;
  }

  function speechChunks(text) {
    const chunks = [];
    let cur = "";
    // эмодзи голос читает словами («улыбающееся лицо») — убираем
    const plain = MD.plain(text).replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}]/gu, "").replace(/[ \t]{2,}/g, " ");
    for (const part of plain.split(/(?<=[.!?…])\s+/)) {
      if ((cur + " " + part).length > 220 && cur) {
        chunks.push(cur);
        cur = part;
      } else cur = cur ? cur + " " + part : part;
    }
    if (cur) chunks.push(cur);
    return chunks;
  }

  // Прочитать вслух по кусочкам; без интернета онлайн-голос не работает — тогда голос Windows.
  function sayAloud(text) {
    return new Promise((resolve) => {
      synth.cancel();
      const chunks = speechChunks(text);
      let i = 0;
      const next = (useLocal) => {
        if (!call.on || i >= chunks.length) return resolve();
        const v = useLocal ? localVoice() : voice;
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = v ? v.lang : "ru-RU";
        if (v) u.voice = v;
        u.rate = S.settings.rate || 1.05;
        u.onend = () => {
          i++;
          next(useLocal);
        };
        u.onerror = (e) => {
          if (e.error === "interrupted" || e.error === "canceled") return resolve();
          if (!useLocal && localVoice() && localVoice() !== voice) return next(true);
          i++;
          next(useLocal);
        };
        synth.speak(u);
      };
      next(false);
    });
  }

  async function startMeter() {
    try {
      const ctx = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (!call.on) {
        stream.getTracks().forEach((t) => t.stop());
        ctx.close();
        return;
      }
      const an = ctx.createAnalyser();
      an.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      const m = (call.meter = { ctx, stream, raf: 0, s: 0 });
      const loop = () => {
        if (call.meter !== m) return;
        an.getByteFrequencyData(data);
        let sum = 0;
        for (let k = 2; k < 48; k++) sum += data[k];
        const lvl = call.state === "listening" ? Math.min(1, sum / 46 / 120) : 0;
        m.s += (lvl - m.s) * (lvl > m.s ? 0.5 : 0.12);
        $("#call").style.setProperty("--lvl", m.s.toFixed(3));
        m.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch { /* нет доступа к звуку — шар просто дышит */ }
  }

  function stopMeter() {
    const m = call.meter;
    call.meter = null;
    if (!m) return;
    cancelAnimationFrame(m.raf);
    m.stream.getTracks().forEach((t) => t.stop());
    m.ctx.close().catch(() => {});
  }

  function openCall() {
    if (!Recognition || !synth) return toast("Голосовой разговор здесь не работает — нужен браузер Edge или Chrome", "error");
    if (S.busy) return toast("Подожди, NOVA ещё отвечает");
    stopSpeaking();
    if (rec) rec.stop();
    Object.assign(call, { on: true, quiet: 0, err: null });
    $("#callHeard").textContent = "";
    $("#callSaid").textContent = "";
    $("#call").hidden = false;
    startMeter();
    callListen();
  }

  function closeCall() {
    call.on = false;
    if (call.rec) {
      try { call.rec.abort(); } catch { /* уже остановлено */ }
      call.rec = null;
    }
    if (synth) synth.cancel();
    stopMeter();
    if (S.busy && S.controller) S.controller.abort();
    $("#call").hidden = true;
    els.input.focus();
  }

  function callListen() {
    if (!call.on) return;
    callUI("listening", "Слушаю…");
    const r = new Recognition();
    call.rec = r;
    r.lang = "ru-RU";
    r.interimResults = true;
    r.continuous = false;
    let final = "", interim = "";
    r.onresult = (e) => {
      final = "";
      interim = "";
      for (const x of e.results) {
        if (x.isFinal) final += x[0].transcript;
        else interim += x[0].transcript;
      }
      $("#callHeard").textContent = (final + interim).trim();
    };
    r.onerror = (e) => {
      if (["not-allowed", "service-not-allowed", "audio-capture", "network"].includes(e.error)) call.err = e.error;
    };
    r.onend = () => {
      if (call.rec !== r) return;
      call.rec = null;
      if (!call.on) return;
      if (call.err) {
        const msg = {
          "not-allowed": "Нет доступа к микрофону — разреши его вверху окна",
          "service-not-allowed": "Нет доступа к микрофону — разреши его вверху окна",
          "audio-capture": "Не нашла микрофон",
          "network": "Распознавание речи без интернета не работает",
        }[call.err];
        call.err = null;
        return callUI("paused", msg + ". Нажми на шар, чтобы попробовать ещё раз");
      }
      const said = (final || interim).trim();
      if (said) {
        call.quiet = 0;
        callThink(said);
      } else if (++call.quiet >= 4) callUI("paused", "Я тут. Нажми на шар, когда захочешь продолжить");
      else callListen();
    };
    try {
      r.start();
    } catch {
      callUI("paused", "Не получилось включить микрофон. Нажми на шар, чтобы попробовать ещё раз");
    }
  }

  async function callThink(text) {
    callUI("thinking", "Думаю…");
    $("#callHeard").textContent = text;
    $("#callSaid").textContent = "";
    const ev = await send(text, { voice: true });
    if (!call.on) return;
    let answer = ev && ev.text ? ev.text : "";
    if (!ev || ev.kind === "error") answer = "Не получилось ответить. " + (answer || "Попробуй ещё раз.");
    if (ev && ev.kind === "stopped") return callListen();
    callUI("speaking", "Говорю… нажми на шар, чтобы перебить");
    $("#callSaid").textContent = MD.plain(answer).slice(0, 260);
    await sayAloud(answer);
    if (call.on) callListen();
  }

  function callOrbClick() {
    if (call.state === "speaking") synth.cancel(); // перебили — сразу слушаем
    else if (call.state === "listening" && call.rec) call.rec.stop(); // договорил — отправить сразу
    else if (call.state === "paused") {
      call.quiet = 0;
      callListen();
    }
  }

  // ---------- настройки ----------

  let savePatch = {};
  let saveTimer = 0;
  let savedTimer = 0;

  function queueSave(patch, delay = 0) {
    Object.assign(S.settings, patch);
    Object.assign(savePatch, patch);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flushSave, delay);
  }

  async function flushSave() {
    const patch = savePatch;
    savePatch = {};
    if (!Object.keys(patch).length) return;
    try {
      const st = await api("/api/settings", patch);
      Object.assign(S, { settings: st.settings, mode: st.mode, model: st.model });
      pickVoice();
      renderModes();
      renderStatus();
      if (!els.welcome.hidden) showWelcome(true);
      els.savedMark.innerHTML = icon("check", 14) + "Сохранено";
      els.savedMark.classList.add("show");
      clearTimeout(savedTimer);
      savedTimer = setTimeout(() => els.savedMark.classList.remove("show"), 1600);
    } catch (e) {
      toast("Не получилось сохранить настройки: " + e.message, "error");
    }
  }

  function fillVoices() {
    const sel = els.setVoice;
    sel.replaceChildren();
    const auto = new Option("Автоматически (лучший русский)", "");
    sel.append(auto);
    if (!synth) {
      sel.disabled = true;
      return;
    }
    const voices = synth.getVoices().slice().sort((a, b) => {
      const ra = a.lang.toLowerCase().startsWith("ru") ? 0 : 1;
      const rb = b.lang.toLowerCase().startsWith("ru") ? 0 : 1;
      return ra - rb || a.name.localeCompare(b.name);
    });
    for (const v of voices) {
      const label = v.name.replace(/^Microsoft\s+/, "").replace(/\s*-\s*.*$/, "") + ` (${v.lang})`;
      sel.append(new Option(label, v.name));
    }
    sel.value = S.settings.voice || "";
  }

  function fillSettings() {
    const s = S.settings;
    els.setName.value = s.name || "";
    els.setCity.value = s.city || "";
    els.setCustom.value = s.custom || "";
    els.setAutoSpeak.checked = !!s.auto_speak;
    els.setVoiceSend.checked = !!s.voice_send;
    els.setRate.value = s.rate || 1.05;
    els.rateValue.textContent = Number(els.setRate.value).toFixed(2).replace(".", ",") + "×";
    els.personas.replaceChildren();
    for (const [key, p] of Object.entries(S.personas)) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "persona" + (key === s.persona ? " active" : "");
      b.innerHTML = `<span class="emoji">${PERSONA_EMOJI[key] || "✨"}</span><span><b></b><small></small></span>`;
      $("b", b).textContent = p.title;
      $("small", b).textContent = p.desc;
      b.addEventListener("click", () => {
        els.personas.querySelectorAll(".persona").forEach((x) => x.classList.toggle("active", x === b));
        queueSave({ persona: key });
      });
      els.personas.append(b);
    }
    fillVoices();
    const theme = document.documentElement.dataset.theme;
    els.themeSeg.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b.dataset.themeOpt === theme));
    if (!Recognition) els.setVoiceSend.closest(".toggle-row").hidden = true;
  }

  function renderKeyStatus() {
    const k = S.key || {};
    els.keyStatus.className = "key-status " + (k.set ? "ok" : "missing");
    els.keyStatus.innerHTML = icon(k.set ? "check" : "alert", 15) + "<span></span>";
    $("span", els.keyStatus).textContent = !k.set
      ? "Ключ не задан — NOVA не может отвечать"
      : k.source === "env" ? `Ключ берётся из переменной среды GEMINI_API_KEY (${k.hint})` : `Ключ сохранён (${k.hint})`;
  }

  async function saveKey() {
    const key = els.keyInput.value.trim();
    if (!key) return els.keyInput.focus();
    els.keySave.disabled = true;
    els.keySave.textContent = "Проверяю…";
    try {
      const st = await api("/api/api_key", { key });
      applyState(st, { thread: false });
      if (!els.welcome.hidden) showWelcome(true);
      els.keyInput.value = "";
      renderKeyStatus();
      toast(st.message || "Ключ сохранён", "ok");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      els.keySave.disabled = false;
      els.keySave.textContent = "Проверить и сохранить";
    }
  }

  // ---------- ключ для Sonata (GigaChat, DeepSeek или OpenRouter) ----------

  const SONATA_PROVIDERS = { gigachat: "GigaChat от Сбера", openrouter: "DeepSeek через OpenRouter", deepseek: "DeepSeek" };

  function renderDsStatus() {
    const k = S.dskey || {};
    els.dsStatus.className = "key-status " + (k.set ? "ok" : "missing");
    els.dsStatus.innerHTML = icon(k.set ? "check" : "alert", 15) + "<span></span>";
    $("span", els.dsStatus).textContent = !k.set
      ? "Ключ не задан — Sonata не работает"
      : `Ключ сохранён (${k.hint}) · ${SONATA_PROVIDERS[k.provider] || "DeepSeek"}`;
  }

  async function saveDsKey() {
    const key = els.dsInput.value.trim();
    if (!key) return els.dsInput.focus();
    els.dsSave.disabled = true;
    els.dsSave.textContent = "Проверяю…";
    try {
      const st = await api("/api/deepseek_key", { key });
      applyState(st, { thread: false });
      if (!els.welcome.hidden) showWelcome(true);
      els.dsInput.value = "";
      renderDsStatus();
      toast(st.message || "Ключ сохранён", "ok");
    } catch (e) {
      toast(e.message, "error");
    } finally {
      els.dsSave.disabled = false;
      els.dsSave.textContent = "Проверить и сохранить";
    }
  }

  // ---------- долгая память в настройках ----------
  async function loadMemory() {
    const box = $("#memList");
    if (!box) return;
    let r;
    try {
      r = await api("/api/memory");
    } catch {
      return;
    }
    $("#setMemory").checked = r.enabled !== false;
    box.replaceChildren();
    const list = r.facts || [];
    $("#memClearRow").hidden = !list.length;
    if (!list.length) {
      const empty = div("mem-empty");
      empty.textContent = "Пока пусто. Расскажи NOVA о себе или напиши «запомни, что …».";
      box.append(empty);
      return;
    }
    for (const f of list.slice().reverse()) {
      const row = div("mem-row");
      row.innerHTML = icon("brain", 15) + '<span></span><button class="icon-btn" type="button" title="Забыть"></button>';
      $("span", row).textContent = f.text;
      const del = $("button", row);
      del.innerHTML = icon("x", 14);
      del.addEventListener("click", async () => {
        try {
          await api("/api/memory_delete", { id: f.id });
          row.remove();
          if (!box.querySelector(".mem-row")) loadMemory();
        } catch (e) {
          toast("Не получилось: " + e.message, "error");
        }
      });
      box.append(row);
    }
  }

  function openSettings(focusKey = false) {
    closeMobileSidebar();
    fillSettings();
    loadMemory();
    renderKeyStatus();
    renderDsStatus();
    els.settings.hidden = false;
    if (focusKey === "ds") {
      els.dsInput.focus();
      els.dsSection.scrollIntoView({ block: "start" });
    } else if (focusKey === true || !(S.key && S.key.set)) els.keyInput.focus();
    else els.setName.focus();
  }

  function closeSettings() {
    els.settings.hidden = true;
    flushSave();
    els.input.focus();
  }

  function bindSettings() {
    els.settingsBtn.addEventListener("click", () => openSettings());
    els.keySave.addEventListener("click", saveKey);
    els.keyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveKey();
    });
    els.dsSave.addEventListener("click", saveDsKey);
    els.dsInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveDsKey();
    });
    els.settingsClose.addEventListener("click", closeSettings);
    els.settings.addEventListener("mousedown", (e) => {
      if (e.target === els.settings) closeSettings();
    });
    els.setName.addEventListener("input", () => queueSave({ name: els.setName.value.trim() }, 600));
    els.setCity.addEventListener("input", () => queueSave({ city: els.setCity.value.trim() }, 600));
    els.setCustom.addEventListener("input", () => queueSave({ custom: els.setCustom.value }, 800));
    els.setAutoSpeak.addEventListener("change", () => queueSave({ auto_speak: els.setAutoSpeak.checked }));
    $("#setMemory").addEventListener("change", (e) => queueSave({ memory: e.target.checked }));
    $("#memClear").addEventListener("click", async () => {
      if (!(await confirmModal("Забыть всё?", "NOVA забудет всё, что запомнила о тебе. Чаты останутся.", "Забыть всё"))) return;
      try {
        await api("/api/memory_delete", { all: true });
        toast("Память очищена");
      } catch (e) {
        toast("Не получилось: " + e.message, "error");
      }
      loadMemory();
    });
    els.setVoiceSend.addEventListener("change", () => queueSave({ voice_send: els.setVoiceSend.checked }));
    els.setVoice.addEventListener("change", () => {
      queueSave({ voice: els.setVoice.value });
      pickVoice();
    });
    els.setRate.addEventListener("input", () => {
      els.rateValue.textContent = Number(els.setRate.value).toFixed(2).replace(".", ",") + "×";
      queueSave({ rate: Number(els.setRate.value) }, 400);
    });
    els.testVoice.addEventListener("click", () => {
      pickVoice();
      const name = S.settings.name ? ", " + S.settings.name : "";
      speak(`Привет${name}! Я NOVA. Вот так звучит мой голос.`, els.testVoice);
    });
    els.themeSeg.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      switchTheme(b.dataset.themeOpt, b);
      els.themeSeg.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
    });
    els.deleteAll.addEventListener("click", async () => {
      if (S.busy) return toast("Подожди, NOVA ещё отвечает");
      const ok = await confirmModal("Удалить все чаты?", "Все чаты и вложения исчезнут навсегда.", "Удалить всё");
      if (!ok) return;
      try {
        S.results = null;
        applyState(await api("/api/delete_all", {}));
        toast("Все чаты удалены", "ok");
      } catch (e) {
        toast("Не получилось: " + e.message, "error");
      }
    });
  }

  // ---------- меню чата: роль, переименование, скачивание, удаление ----------

  function openChatMenu() {
    const has = !!(S.current && S.current.messages.length);
    els.chatMenu.querySelectorAll("[data-needs-messages]").forEach((b) => (b.disabled = !has));
    els.chatMenu.hidden = false;
  }
  const closeChatMenu = () => (els.chatMenu.hidden = true);

  async function exportChat(format) {
    try {
      const r = await api("/api/export", { id: S.current.id, format });
      toast(`Сохранено в «Загрузки»: ${r.name}`, "ok", r.path ? {
        label: "Показать",
        onClick: () => api("/api/reveal", { path: r.path }).catch(() => toast("Файл не найден", "error")),
      } : undefined);
    } catch (e) {
      toast("Не получилось сохранить: " + e.message, "error");
    }
  }

  function openRoleModal() {
    const role = (S.current && S.current.role) || "";
    els.roleText.value = role;
    els.rolePresets.replaceChildren();
    for (const p of ROLE_PRESETS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "preset" + (p.text === role ? " active" : "");
      b.textContent = p.emoji + " " + p.title;
      b.title = p.text;
      b.addEventListener("click", () => {
        els.roleText.value = p.text;
        els.rolePresets.querySelectorAll(".preset").forEach((x) => x.classList.toggle("active", x === b));
        els.roleText.focus();
      });
      els.rolePresets.append(b);
    }
    els.roleClear.hidden = !role;
    els.roleModal.hidden = false;
    els.roleText.focus();
  }

  function closeRoleModal() {
    els.roleModal.hidden = true;
    els.input.focus();
  }

  async function saveRole(role) {
    try {
      const had = !!(S.current && S.current.role);
      applyState(await api("/api/chat_role", { id: S.current.id, role }), { thread: false });
      closeRoleModal();
      toast(role ? "Роль чата сохранена — NOVA уже в образе" : had ? "Роль убрана" : "Роль не задана", "ok");
    } catch (e) {
      toast("Не получилось сохранить роль: " + e.message, "error");
    }
  }

  async function importChat(file) {
    let data;
    try {
      data = JSON.parse(await file.text());
    } catch {
      return toast("Это не файл .json — выбери копию чата, сохранённую NOVA", "error");
    }
    try {
      S.results = null;
      applyState(await api("/api/import", { data }));
      closeSettings();
      toast(`Чат «${S.current.title}» импортирован`, "ok");
    } catch (e) {
      toast("Не получилось импортировать: " + e.message, "error");
    }
  }

  function bindChatTools() {
    els.chatMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (els.chatMenu.hidden) openChatMenu();
      else closeChatMenu();
    });
    document.addEventListener("click", (e) => {
      if (!els.chatMenu.hidden && !e.target.closest(".chat-menu-wrap")) closeChatMenu();
    });
    els.chatMenu.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b || b.disabled) return;
      closeChatMenu();
      const act = b.dataset.act;
      if (act === "role") openRoleModal();
      else if (act === "rename") renameFromHeader();
      else if (act === "md" || act === "json") exportChat(act);
      else if (act === "delete") {
        const summary = S.chats.find((c) => c.id === S.current.id) || { id: S.current.id, title: S.current.title };
        deleteChat(summary);
      }
    });
    els.roleBadge.addEventListener("click", openRoleModal);
    els.roleClose.addEventListener("click", closeRoleModal);
    els.roleModal.addEventListener("mousedown", (e) => {
      if (e.target === els.roleModal) closeRoleModal();
    });
    els.roleText.addEventListener("input", () => {
      const v = els.roleText.value.trim();
      els.rolePresets.querySelectorAll(".preset").forEach((x) => x.classList.toggle("active", x.title === v));
    });
    els.roleSave.addEventListener("click", () => saveRole(els.roleText.value.trim()));
    els.roleClear.addEventListener("click", () => saveRole(""));
    els.roleText.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.ctrlKey) saveRole(els.roleText.value.trim());
    });
    els.importBtn.addEventListener("click", () => els.importInput.click());
    els.importInput.addEventListener("change", () => {
      const file = els.importInput.files[0];
      els.importInput.value = "";
      if (file) importChat(file);
    });
  }

  // ---------- связь с NOVA ----------

  async function ping() {
    try {
      await api("/api/ping", {});
      if (S.offline) {
        S.offline = false;
        renderStatus();
      }
    } catch {
      S.offline = true;
      renderStatus();
    }
  }

  // ---------- события ----------

  function bind() {
    document.querySelectorAll("[data-icon]").forEach((e) => {
      e.innerHTML = icon(e.dataset.icon, e.classList.contains("send") ? 20 : 18);
    });
    document.querySelectorAll("[data-orbit]").forEach((e) => (e.innerHTML = ORBIT[e.dataset.orbit]));

    els.input.addEventListener("input", () => {
      autosize();
      updateSendButton();
    });
    els.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (!S.busy) send(els.input.value);
      }
    });
    els.send.addEventListener("click", () => (S.busy ? stop() : send(els.input.value)));
    els.newChat.addEventListener("click", newChat);
    els.collapse.addEventListener("click", () => setSidebar(false));
    els.openSidebar.addEventListener("click", () => setSidebar(true));
    els.scrim.addEventListener("click", closeMobileSidebar);
    els.theme.addEventListener("click", () =>
      switchTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", els.theme)
    );
    els.title.addEventListener("dblclick", renameFromHeader);
    els.toBottom.addEventListener("click", () => scrollBottom(true));
    els.scroller.addEventListener("scroll", () => {
      if (Math.abs(els.scroller.scrollTop - progTop) > 2) S.follow = nearBottom();
      els.toBottom.classList.toggle("show", !S.follow && els.welcome.hidden);
    });

    if (Recognition) els.mic.addEventListener("click", toggleMic);
    else els.mic.hidden = true;

    let searchTimer = 0;
    els.search.addEventListener("input", () => {
      clearTimeout(searchTimer);
      const q = els.search.value.trim();
      if (!q) {
        S.results = null;
        renderSidebar();
        return;
      }
      searchTimer = setTimeout(async () => {
        try {
          const r = await api("/api/search?q=" + encodeURIComponent(q));
          if (els.search.value.trim() === q) {
            S.results = r.results;
            renderSidebar();
          }
        } catch { /* не страшно */ }
      }, 160);
    });
    els.search.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        els.search.value = "";
        S.results = null;
        renderSidebar();
        els.input.focus();
      }
    });

    $("#modalOk").addEventListener("click", () => closeModal(true));
    $("#modalCancel").addEventListener("click", () => closeModal(false));
    els.modal.addEventListener("click", (e) => {
      if (e.target === els.modal) closeModal(false);
    });

    // ссылки — в обычном браузере пользователя, а не в окне NOVA
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-ext], a.source");
      if (a) {
        e.preventDefault();
        api("/api/open_url", { url: a.href }).catch(() => toast("Не получилось открыть ссылку", "error"));
        return;
      }
      const copyBtn = e.target.closest(".code-copy");
      if (copyBtn) copyText(copyBtn.closest(".code-block").querySelector("code").textContent, copyBtn);
    });

    // вложения: скрепка, перетаскивание в окно, вставка из буфера (Ctrl+V)
    els.attach.addEventListener("click", () => els.fileInput.click());
    els.fileInput.addEventListener("change", () => {
      addFiles([...els.fileInput.files]);
      els.fileInput.value = "";
    });
    const hasFiles = (e) => [...((e.dataTransfer && e.dataTransfer.types) || [])].includes("Files");
    let dragDepth = 0;
    addEventListener("dragenter", (e) => {
      if (!hasFiles(e)) return;
      dragDepth++;
      els.drop.hidden = false;
    });
    addEventListener("dragleave", (e) => {
      if (!hasFiles(e)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (!dragDepth) els.drop.hidden = true;
    });
    addEventListener("dragover", (e) => {
      if (hasFiles(e)) e.preventDefault();
    });
    addEventListener("drop", (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      els.drop.hidden = true;
      addFiles([...e.dataTransfer.files]);
    });
    els.input.addEventListener("paste", (e) => {
      const files = [...((e.clipboardData && e.clipboardData.files) || [])];
      if (files.length) {
        e.preventDefault();
        addFiles(files);
      }
    });
    els.lightbox.addEventListener("click", () => (els.lightbox.hidden = true));

    bindSettings();
    bindChatTools();
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".mode-switch")) closeModelMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (!els.lightbox.hidden) return (els.lightbox.hidden = true);
        if (!els.modal.hidden) return closeModal(false);
        if (call.on) return closeCall();
        if (modelMenu() && !modelMenu().hidden) return closeModelMenu();
        if (!els.chatMenu.hidden) return closeChatMenu();
        if (!els.roleModal.hidden) return closeRoleModal();
        if (!els.settings.hidden) return closeSettings();
        if (S.busy) return stop();
        if (rec) return rec.stop();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
        e.preventDefault();
        setSidebar(true);
        els.search.focus();
        els.search.select();
        return;
      }
      // начал печатать, когда фокус не в поле — сразу в поле ввода
      const a = document.activeElement;
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1 && els.modal.hidden &&
          els.settings.hidden && els.lightbox.hidden && els.roleModal.hidden &&
          (!a || a === document.body || a.tagName === "BUTTON")) {
        els.input.focus();
      }
    });

    addEventListener("resize", positionPill);
    addEventListener("pagehide", () => navigator.sendBeacon("/api/bye?token=" + encodeURIComponent(TOKEN)));
  }

  async function init() {
    bind();
    startStars();
    applyTheme(store.get("theme", "dark"));
    if (!isNarrow()) setSidebar(store.get("sidebar", true));
    setBusy(false);
    showWelcome(true);
    try {
      applyState(await api("/api/state"));
    } catch (e) {
      S.offline = true;
      renderStatus();
      toast("Не получилось связаться с NOVA: " + e.message, "error");
    }
    ping();
    setInterval(ping, 15000);
    setInterval(tickTimers, 1000);
    if (Recognition && synth) {
      $("#callBtn").addEventListener("click", openCall);
      $("#callOrb").addEventListener("click", callOrbClick);
      $("#callEnd").addEventListener("click", closeCall);
    } else $("#callBtn").hidden = true;
    $("#timerPill").addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = $("#timerMenu");
      menu.hidden = !menu.hidden;
      renderTimers();
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#timerWrap")) $("#timerMenu").hidden = true;
    });
    // версия для телефона сообщает, что что-то поменялось само (например, пришло название чата)
    addEventListener("nova:refresh", () => { if (!S.busy) syncState(); });
    // таблицы и код, которые листаются вбок: гасим край, пока не долистали до конца
    els.thread.addEventListener("scroll", (e) => {
      const el = e.target;
      if (el.classList && el.classList.contains("scrollable")) {
        el.classList.toggle("at-end", el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
      }
    }, true);
    let resizeTimer = 0;
    addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => markScrollables(els.thread), 200);
    });
    const q = new URLSearchParams(location.search).get("q");
    if (q) send(q);
    els.input.focus();
  }

  init();
})();
