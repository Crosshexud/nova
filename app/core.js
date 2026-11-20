/* ============ NOVA для телефона: «мозг» прямо в браузере ============
   Окно NOVA (app.js) то же самое, что на компьютере, и обращается к /api/… как к своему серверу.
   Здесь эти запросы перехватываются: чаты и вложения хранятся в телефоне (IndexedDB),
   ответы приходят от Gemini напрямую по ключу пользователя. Погода, курсы ЦБ и Википедия —
   инструменты Symphony (эти сайты разрешают запросы из браузера).
   Подключается ДО app.js. */
(() => {
  "use strict";

  // ---------- модели, характер, подсказки ----------

  // На телефоне две модели: Sonata (DeepSeek, в России без VPN) и Symphony (Gemini).
  const MODES = {
    sonata: {
      title: "Sonata", kind: "сильная модель", hint: "DeepSeek через интернет. Нужен ключ DeepSeek или OpenRouter",
      engine: "deepseek", group: "novpn",
    },
    symphony: {
      title: "Symphony", kind: "сильная модель", hint: "Gemini: самая умная, видит картинки и PDF",
      engine: "gemini", group: "vpn",
      // Лимит бесплатного ключа Google считается на каждую модель отдельно, поэтому запасных много.
      // Порядок: основная, быстрая запасная, остальные (см. race).
      models: [
        ["gemini-3.5-flash", "LOW"], ["gemini-flash-lite-latest", null], ["gemma-4-26b-a4b-it", null],
        ["gemini-3.5-flash-lite", null], ["gemini-3.7-flash", "LOW"], ["gemini-3.1-flash-lite", null],
      ],
    },
  };
  const GROUPS = { novpn: "Без VPN в России", vpn: "Нужен VPN в России" };
  const FALLBACK = { symphony: ["sonata"], sonata: ["symphony"] }; // кто отвечает, если выбранная недоступна
  const NO_DOCS = new Set(["gemma-4-26b-a4b-it"]); // эти модели не читают PDF
  const DEFAULT_MODE = "symphony";
  const GEMINI_LIGHT = "gemini-flash-lite-latest"; // проверка ключа и названия чатов — самая быстрая
  const API = "https://generativelanguage.googleapis.com/v1beta/models/";
  const DEEPSEEK_API = "https://api.deepseek.com/chat/completions";
  const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

  const PERSONAS = {
    friendly: { title: "Дружелюбная", desc: "Тёплая, живая, по делу",
      prompt: "Общайся дружелюбно и по-человечески, по делу; лёгкий юмор и эмодзи — к месту и в меру." },
    brief: { title: "Краткая", desc: "Только суть, без воды",
      prompt: "Отвечай максимально коротко и по делу: без вступлений, повторов и лишних слов. Подробности — только если попросят." },
    fun: { title: "Весёлая", desc: "Шутит и не даёт заскучать",
      prompt: "Общайся весело и задорно, как близкий друг: шути, используй эмодзи, но всегда оставайся полезной и точной." },
    teacher: { title: "Учитель", desc: "Объясняет просто и подробно",
      prompt: "Объясняй как терпеливый хороший учитель: просто, по шагам, с примерами и аналогиями; в конце коротко подытожь главное." },
  };

  const DEFAULT_SETTINGS = {
    mode: DEFAULT_MODE, name: "", city: "", persona: "friendly", custom: "",
    auto_speak: false, voice_send: false, voice: "", rate: 1.05, memory: true,
  };

  const BASE_PROMPT = "Ты NOVA — персональный ИИ-ассистент. О себе говоришь в женском роде. Отвечай на языке пользователя.";
  const tierPrompt = (mode) =>
    ` Сейчас ты работаешь как модель NOVA ${MODES[mode].title} (${mode === "sonata" ? "DeepSeek" : "Gemini"}) ` +
    "в версии NOVA для телефона. Всего у NOVA четыре модели: Note и Chord работают на компьютере без интернета, " +
    "Sonata работает в России без VPN (на компьютере — GigaChat от Сбера, на телефоне — DeepSeek), " +
    "Symphony (Gemini) видит картинки и PDF. Управлять телефоном ты не можешь — это умеет только NOVA на компьютере " +
    "(открывать и закрывать программы, громкость, скриншот экрана). Таймеры и напоминания на телефоне срабатывают, " +
    "пока NOVA открыта.";
  const FORMAT_PROMPT =
    "Ответы показываются с Markdown-оформлением: используй его, когда это помогает читать — " +
    "**жирный** для главного, списки, короткие заголовки ###, `код` и блоки ```кода``` с указанием языка, " +
    "таблицы для сравнений. Короткие ответы не перегружай оформлением. Ответ читают с экрана телефона: " +
    "широкие таблицы делай не больше чем из 3–4 столбцов.";
  const FILES_PROMPT =
    "Пользователь может присылать картинки, скриншоты и файлы (код, тексты, PDF, документы). " +
    "Внимательно изучай их содержимое. Если прислали несколько версий одного и того же (например, старую и новую), " +
    "сравнивай их конкретно и по пунктам: что стало лучше, что хуже, что можно улучшить, и дай общую оценку.";
  const TOOLS_PROMPT =
    "У тебя есть инструменты: get_weather (погода), get_exchange_rates (курсы ЦБ РФ) и search_wikipedia " +
    "(статьи Википедии). Обязательно пользуйся ими, когда спрашивают погоду, курсы валют или факты, которые " +
    "стоит проверить. Не выдумывай свежие цифры. Для погоды нужен город: если его не назвали и город " +
    "пользователя неизвестен — спроси. Новостей и поиска по всему интернету в версии NOVA для телефона пока нет: " +
    "если спрашивают про новости, цены или самые свежие события, честно скажи об этом и расскажи, что знаешь сама, " +
    "с оговоркой, что сведения могут быть не самыми свежими. " +
    "Ссылки в текст ответа не вставляй — источники покажутся под ответом автоматически.";
  const WEEKDAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  const NO_KEY =
    "Для Symphony нужен ключ Gemini. Это бесплатно: открой ⚙ Настройки → «Ключ Gemini» " +
    "и вставь ключ с aistudio.google.com.";
  const NO_DS_KEY =
    "Для Sonata нужен ключ DeepSeek: открой ⚙ Настройки → «Ключ DeepSeek». Ключ берут на platform.deepseek.com " +
    "(платно, но дёшево) или на openrouter.ai (там DeepSeek бывает бесплатно).";

  const MAX_HISTORY = 40;        // сколько последних реплик NOVA помнит в одном чате
  const KEEP_ATTACHMENTS = 3;    // вложения скольких последних сообщений модель видит целиком
  const SILENCE_MS = 40000;      // 40 секунд тишины — модель зависла
  const HEDGE_MS = 10000;        // основная модель молчит 10 секунд — параллельно подключаем запасную
  const MAX_FILES = 5;
  const MAX_TOTAL_BYTES = 18 * 1024 * 1024;
  const MAX_TEXT_CHARS = 200000;
  const ROLE_LIMIT = 1500;
  const DEFAULT_ATTACH_PROMPT = "Посмотри вложения и расскажи, что там.";

  const realFetch = window.fetch.bind(window);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- маленькое хранилище: настройки и ключ ----------

  const LS = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem("nova.core." + key);
        return v === null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem("nova.core." + key, JSON.stringify(value)); } catch { /* приватный режим */ }
    },
  };
  const apiKey = () => LS.get("key", "");
  const dsKey = () => LS.get("dskey", "");
  const dsProvider = (key) => (key.startsWith("sk-or-") ? "openrouter" : "deepseek");

  function cleanSettings(data) {
    const s = { ...DEFAULT_SETTINGS };
    if (!data || typeof data !== "object") return s;
    if (MODES[data.mode]) s.mode = data.mode;
    if (PERSONAS[data.persona]) s.persona = data.persona;
    for (const [k, limit] of [["name", 40], ["city", 60], ["voice", 120], ["custom", 1500]]) {
      if (typeof data[k] === "string") s[k] = data[k].trim().slice(0, limit);
    }
    for (const k of ["auto_speak", "voice_send", "memory"]) if (typeof data[k] === "boolean") s[k] = data[k];
    const rate = parseFloat(data.rate);
    if (!isNaN(rate)) s.rate = Math.round(Math.min(1.8, Math.max(0.6, rate)) * 100) / 100;
    return s;
  }
  let settings = cleanSettings(LS.get("settings", {}));

  // ---------- база в телефоне: чаты и файлы ----------

  const dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open("nova", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("chats", { keyPath: "id" });
      req.result.createObjectStore("files");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  async function idb(store, mode, fn) {
    const db = await dbp;
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const r = fn(t.objectStore(store));
      t.oncomplete = () => resolve(r && "result" in r ? r.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }
  const dbAllChats = () => idb("chats", "readonly", (s) => s.getAll());
  const dbPutChat = (chat) => idb("chats", "readwrite", (s) => s.put(chat));
  const dbDeleteChat = (id) => idb("chats", "readwrite", (s) => s.delete(id));
  const dbPutFile = (stored, rec) => idb("files", "readwrite", (s) => s.put(rec, stored));
  const dbGetFile = (stored) => idb("files", "readonly", (s) => s.get(stored));
  const dbDeleteFilesOf = (chatId) =>
    idb("files", "readwrite", (s) => s.delete(IDBKeyRange.bound(chatId + "-", chatId + "-￿")));
  const dbClear = () => Promise.all([idb("chats", "readwrite", (s) => s.clear()), idb("files", "readwrite", (s) => s.clear())]);

  // ---------- состояние ----------

  const pad = (n) => String(n).padStart(2, "0");
  const randHex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => (b % 16).toString(16)).join("");

  function nowIso() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function makeChat() {
    const d = new Date();
    const stamp = nowIso();
    return {
      id: `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${randHex(6)}`,
      title: "Новый чат", created: stamp, updated: stamp, messages: [],
    };
  }

  const chats = new Map();
  let current = makeChat();
  let busy = false;
  let voiceMode = false; // голосовой разговор — отвечать коротко и без оформления
  let lastModel = null;

  const ready = (async () => {
    try {
      for (const c of await dbAllChats()) if (c && c.messages && c.messages.length) chats.set(c.id, c);
    } catch (e) {
      console.error("NOVA: не прочиталась база чатов", e);
    }
  })();

  const summary = (chat) => ({
    id: chat.id, title: chat.title, updated: chat.updated, count: chat.messages.length, role: !!chat.role,
  });

  function saveChat(chat) {
    if (!chat.messages.length) return; // пустые чаты не храним
    dbPutChat(chat).catch((e) => console.error("NOVA: не сохранился чат", e));
  }

  function makeTitle(text, files) {
    if (text && text.trim()) {
      const line = text.trim().split("\n")[0].replace(/\s+/g, " ");
      return line.length <= 60 ? line : line.slice(0, 58).trimEnd() + "…";
    }
    if (files && files.length) return ("📎 " + files.map((f) => f.name).join(", ")).slice(0, 58);
    return "Новый чат";
  }

  function record(chat, role, text, { sources, local, stopped, files, note, remembered } = {}) {
    const stamp = nowIso();
    const msg = { role, text, time: stamp };
    if (remembered && remembered.length) msg.remembered = remembered; // что NOVA запомнила в долгую память
    if (files && files.length) msg.files = files;
    if (sources && sources.length) msg.sources = sources.map((s) => [...s]);
    if (local) msg.local = true;
    if (stopped) msg.stopped = true;
    if (note) msg.note = note; // «Symphony недоступна — ответила Sonata»
    if (!chat.messages.length) chat.title = makeTitle(text, files);
    chat.messages.push(msg);
    chat.updated = stamp;
    chats.set(chat.id, chat);
    saveChat(chat);
  }

  const mode = () => (MODES[settings.mode] ? settings.mode : DEFAULT_MODE);

  // Готова ли модель, а если нет — почему.
  function status(m) {
    if (MODES[m].engine === "deepseek") return dsKey() ? [true, ""] : [false, NO_DS_KEY];
    return apiKey() ? [true, ""] : [false, NO_KEY];
  }

  const model = () => {
    if (MODES[mode()].engine === "deepseek") return lastModel && lastModel.includes("deepseek") ? lastModel : "deepseek-chat";
    const names = MODES.symphony.models.map((m) => m[0]);
    return names.includes(lastModel) ? lastModel : names[0];
  };

  // картинки в переписке: файлы из базы → временные адреса blob:
  const blobUrls = new Map();
  async function blobUrl(stored) {
    if (blobUrls.has(stored)) return blobUrls.get(stored);
    const rec = await dbGetFile(stored).catch(() => null);
    if (!rec) return "";
    const url = URL.createObjectURL(rec.blob);
    blobUrls.set(stored, url);
    return url;
  }

  async function state() {
    await ready;
    const key = apiKey();
    const list = [...chats.values()].sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
    const cur = structuredClone(current);
    for (const m of cur.messages) {
      for (const f of m.files || []) if (f.kind === "image") f.url = await blobUrl(f.stored);
    }
    const ds = dsKey();
    const [ok, problem] = status(mode());
    return {
      ready: ok,
      problem,
      mode: mode(),
      modes: Object.fromEntries(Object.entries(MODES).map(([k, v]) => {
        const [available, why] = status(k);
        return [k, { title: v.title, kind: v.kind, hint: v.hint, engine: v.engine, group: v.group, available, problem: why }];
      })),
      groups: GROUPS,
      settings: { ...settings },
      key: { set: !!key, source: key ? "file" : "", hint: key ? "…" + key.slice(-4) : "" },
      dskey: { set: !!ds, hint: ds ? "…" + ds.slice(-4) : "", provider: ds ? dsProvider(ds) : "" },
      personas: Object.fromEntries(Object.entries(PERSONAS).map(([k, v]) => [k, { title: v.title, desc: v.desc }])),
      model: ok ? model() : null,
      busy,
      timers: timerList(),
      now: Date.now() / 1000,
      current: cur,
      chats: list.map(summary),
    };
  }

  function search(query) {
    const q = (query || "").toLowerCase().trim();
    const found = [];
    const list = [...chats.values()].sort((a, b) => (b.updated || "").localeCompare(a.updated || ""));
    for (const chat of list) {
      let snippet = "";
      if (chat.title.toLowerCase().includes(q)) snippet = chat.title;
      else {
        for (const m of chat.messages) {
          const names = (m.files || []).map((f) => f.name).join(" ");
          if (names && names.toLowerCase().includes(q)) {
            snippet = "📎 " + names;
            break;
          }
          const pos = m.text.toLowerCase().indexOf(q);
          if (pos >= 0) {
            const start = Math.max(0, pos - 30);
            snippet = (start ? "…" : "") + m.text.slice(start, pos + 60).replace(/\n/g, " ") + "…";
            break;
          }
        }
      }
      if (snippet) found.push({ ...summary(chat), snippet });
    }
    return found.slice(0, 50);
  }

  // ---------- вложения ----------

  const IMAGE_TYPES = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" };
  const TEXT_EXT = new Set((
    "txt md markdown rst log csv tsv json jsonl xml yaml yml toml ini cfg conf env properties html htm css scss sass less " +
    "js mjs cjs ts tsx jsx vue svelte py pyw ipynb java kt kts c h cpp hpp cc cs go rs php rb swift lua luau gd gdshader " +
    "tscn tres sql sh bash bat cmd ps1 psm1 r m dart scala pl srt vtt tex svg gradle dockerfile"
  ).split(" "));
  const extOf = (name) => (name.includes(".") ? name.split(".").pop() : name).toLowerCase();

  function looksLikeText(bytes) {
    const head = bytes.subarray(0, 4096);
    if (head.includes(0)) return false;
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(head);
      return true;
    } catch {
      return false;
    }
  }

  function classify(name, mime, bytes) {
    const ext = extOf(name);
    mime = (mime || "").toLowerCase();
    if (IMAGE_TYPES[ext] || Object.values(IMAGE_TYPES).includes(mime)) return ["image", IMAGE_TYPES[ext] || mime];
    if (ext === "pdf" || mime === "application/pdf") return ["pdf", "application/pdf"];
    if (ext === "docx") return ["doc", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (TEXT_EXT.has(ext) || mime.startsWith("text/") || looksLikeText(bytes)) return ["text", "text/plain"];
    throw new Error(`Файл «${name}» NOVA пока не умеет читать. Подойдут картинки, PDF, документы Word, код и тексты.`);
  }

  const b64ToBytes = (b64) => {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  };
  const blobToB64 = (blob) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result).split(",")[1] || "");
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  const safeName = (name) => (name.replace(/[^\p{L}\p{N}_.-]+/gu, "_").replace(/^[._]+|[._]+$/g, "") || "file").slice(-60);

  async function takeAttachments(items, chatId) {
    if (!Array.isArray(items)) throw new Error("неверные вложения");
    if (items.length > MAX_FILES) throw new Error(`Можно прикрепить не больше ${MAX_FILES} файлов за раз.`);
    let total = 0;
    const decoded = [];
    for (const item of items) {
      const name = String(item.name || "файл").slice(0, 120);
      const bytes = b64ToBytes(String(item.data || ""));
      total += bytes.length;
      if (total > MAX_TOTAL_BYTES) throw new Error("Вложения слишком большие: вместе не больше 18 МБ.");
      const [kind, mime] = classify(name, String(item.mime || ""), bytes);
      decoded.push({ name, kind, mime, bytes });
    }
    const files = [];
    for (const d of decoded) {
      const stored = `${chatId}-${randHex(8)}-${safeName(d.name)}`;
      await dbPutFile(stored, { name: d.name, mime: d.mime, blob: new Blob([d.bytes], { type: d.mime }) });
      files.push({ name: d.name, kind: d.kind, mime: d.mime, stored, size: d.bytes.length });
    }
    return files;
  }

  let jszipPromise = null;
  function loadJSZip() {
    if (window.JSZip) return Promise.resolve(window.JSZip);
    jszipPromise = jszipPromise || new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      s.onload = () => resolve(window.JSZip);
      s.onerror = () => {
        jszipPromise = null;
        reject(new Error("не загрузилась библиотека для документов Word"));
      };
      document.head.append(s);
    });
    return jszipPromise;
  }

  function unescapeHtml(text) {
    const t = document.createElement("textarea");
    t.innerHTML = text;
    return t.value;
  }

  async function attachmentText(kind, blob) {
    let text;
    if (kind === "doc") {
      const JSZip = await loadJSZip();
      const zip = await JSZip.loadAsync(blob);
      const xml = await zip.file("word/document.xml").async("string");
      text = unescapeHtml(xml.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "\t").replace(/<[^>]+>/g, "")).trim();
    } else {
      const buf = await blob.arrayBuffer();
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^﻿/, "");
      } catch {
        text = new TextDecoder("windows-1251").decode(buf);
      }
    }
    if (text.length > MAX_TEXT_CHARS) {
      text = text.slice(0, MAX_TEXT_CHARS) + `\n\n[… файл обрезан: показаны первые ${MAX_TEXT_CHARS} символов]`;
    }
    return text;
  }

  const partCache = new Map(); // уже прочитанные вложения
  async function attachmentPart(att) {
    if (partCache.has(att.stored)) return partCache.get(att.stored);
    let part;
    try {
      const rec = await dbGetFile(att.stored);
      if (!rec) throw new Error("нет файла");
      if (att.kind === "image" || att.kind === "pdf") {
        part = { inlineData: { mimeType: att.mime, data: await blobToB64(rec.blob) } };
      } else {
        part = { text: `📎 Файл «${att.name}» — начало:\n${await attachmentText(att.kind, rec.blob)}\n📎 Конец файла «${att.name}».` };
      }
    } catch (e) {
      console.warn("NOVA: вложение", att.stored, e);
      part = { text: `[вложение «${att.name}» не удалось прочитать]` };
    }
    if (partCache.size > 24) partCache.clear();
    partCache.set(att.stored, part);
    return part;
  }

  async function userParts(text, atts, full) {
    const parts = [];
    for (const a of atts) parts.push(full ? await attachmentPart(a) : { text: `[раньше было вложение «${a.name}»]` });
    parts.push({ text: text || DEFAULT_ATTACH_PROMPT });
    return parts;
  }

  const turnsFromMessages = (messages) =>
    messages
      .filter((m) => (m.role === "user" || m.role === "ai") && !m.local)
      .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text || "", atts: m.files || [] }));

  async function historyContents(turns) {
    turns = turns.slice(-MAX_HISTORY);
    while (turns.length && turns[0].role !== "user") turns = turns.slice(1);
    const withAtts = turns.map((t, i) => (t.atts.length ? i : -1)).filter((i) => i >= 0);
    const keep = new Set(withAtts.slice(-KEEP_ATTACHMENTS));
    const contents = [];
    for (let i = 0; i < turns.length; i++) {
      const t = turns[i];
      const parts = t.role === "user" ? await userParts(t.text, t.atts, keep.has(i)) : [{ text: t.text || "…" }];
      const last = contents[contents.length - 1];
      if (last && last.role === t.role) last.parts.push(...parts);
      else contents.push({ role: t.role, parts });
    }
    return contents;
  }

  function systemPrompt(role, m = "symphony") {
    const s = settings;
    const persona = PERSONAS[s.persona] || PERSONAS.friendly;
    const parts = [BASE_PROMPT + " " + persona.prompt + tierPrompt(m), FORMAT_PROMPT, FILES_PROMPT, TOOLS_PROMPT];
    const about = [];
    if (s.name) about.push(`Пользователя зовут ${s.name} — иногда обращайся по имени, но не в каждом ответе.`);
    if (s.city) about.push(`Город пользователя — ${s.city}: если про погоду или местные дела спрашивают без города, имей в виду его.`);
    if (about.length) parts.push(about.join(" "));
    if (memOn()) {
      parts.push(MEM_RULES);
      const known = memBlock();
      if (known) parts.push(known);
    }
    if (s.custom) parts.push("Особые пожелания пользователя — выполняй их:\n" + s.custom);
    if (role) {
      parts.push(
        "РОЛЬ В ЭТОМ ЧАТЕ — она важнее общего характера: веди себя так, как описано ниже " +
        "(ты по-прежнему NOVA, правила оформления и инструменты остаются):\n" + role
      );
    }
    if (voiceMode) {
      parts.push("Сейчас идёт голосовой разговор: твой ответ прочитают вслух. Отвечай коротко (1–3 предложения), живо " +
        "и разговорно, без списков, таблиц, заголовков, ссылок, кода и эмодзи. Если тема большая — скажи главное " +
        "и предложи рассказать подробнее.");
    }
    const d = new Date();
    parts.push(`Сейчас ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${WEEKDAYS[d.getDay()]}, ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())} по времени телефона пользователя.`);
    return parts.join("\n\n");
  }

  // ---------- инструменты: погода, курсы, Википедия ----------

  const TOOL_DECLS = [
    {
      name: "get_weather",
      description: "Погода сейчас и прогноз на 3 дня для указанного города.",
      parameters: { type: "OBJECT", properties: { city: { type: "STRING", description: "название города, например «Москва»" } }, required: ["city"] },
    },
    {
      name: "get_exchange_rates",
      description: "Официальные курсы валют ЦБ РФ к рублю на сегодня (доллар, евро, юань и другие).",
      parameters: { type: "OBJECT", properties: { currencies: { type: "STRING", description: "коды валют через запятую, например «USD,EUR,CNY»" } }, required: ["currencies"] },
    },
    {
      name: "search_wikipedia",
      description: "Поиск в русской Википедии: подходящие статьи и вступление самой подходящей. " +
        "Используй для проверки фактов: люди, места, события, понятия, «что такое…».",
      parameters: { type: "OBJECT", properties: { query: { type: "STRING", description: "поисковый запрос" } }, required: ["query"] },
    },
  ];

  const WEATHER_CODES = {
    0: "ясно", 1: "преимущественно ясно", 2: "переменная облачность", 3: "пасмурно", 45: "туман", 48: "туман с изморозью",
    51: "слабая морось", 53: "морось", 55: "сильная морось", 56: "ледяная морось", 57: "сильная ледяная морось",
    61: "небольшой дождь", 63: "дождь", 65: "сильный дождь", 66: "ледяной дождь", 67: "сильный ледяной дождь",
    71: "небольшой снег", 73: "снег", 75: "сильный снег", 77: "снежная крупа", 80: "небольшой ливень", 81: "ливень",
    82: "сильный ливень", 85: "снегопад", 86: "сильный снегопад", 95: "гроза", 96: "гроза с градом", 99: "сильная гроза с градом",
  };

  async function getJson(url) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const r = await realFetch(url, { signal: ctl.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }
  const q = (params) => new URLSearchParams(params).toString();

  async function getWeather({ city }, ctx) {
    city = String(city || "").trim();
    ctx.report(`Узнаю погоду: ${city}`);
    try {
      const found = (await getJson("https://geocoding-api.open-meteo.com/v1/search?" + q({ name: city, count: 1, language: "ru" }))).results;
      if (!found || !found.length) return { error: `Город «${city}» не найден. Уточни название.` };
      const place = found[0];
      const w = await getJson("https://api.open-meteo.com/v1/forecast?" + q({
        latitude: place.latitude, longitude: place.longitude,
        current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
        daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "auto", forecast_days: 3, wind_speed_unit: "ms",
      }));
      const cur = w.current;
      const day = w.daily;
      ctx.addSource("Open-Meteo", "https://open-meteo.com/");
      return {
        place: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
        now: {
          time: String(cur.time).replace("T", " "), temperature_c: cur.temperature_2m, feels_like_c: cur.apparent_temperature,
          humidity_percent: cur.relative_humidity_2m, wind_m_s: cur.wind_speed_10m, sky: WEATHER_CODES[cur.weather_code] || "?",
        },
        forecast: day.time.map((t, i) => ({
          date: t, min_c: day.temperature_2m_min[i], max_c: day.temperature_2m_max[i],
          sky: WEATHER_CODES[day.weather_code[i]] || "?", precipitation_chance_percent: day.precipitation_probability_max[i],
        })),
      };
    } catch (e) {
      return { error: "Не удалось узнать погоду: " + e.message };
    }
  }

  async function getExchangeRates({ currencies }, ctx) {
    ctx.report("Смотрю курсы ЦБ");
    try {
      const data = await getJson("https://www.cbr-xml-daily.ru/daily_json.js");
      const codes = String(currencies || "").split(/[,\s;]+/).filter(Boolean).map((c) => c.toUpperCase());
      const rates = {};
      for (const code of codes.length ? codes : ["USD", "EUR", "CNY"]) {
        const v = data.Valute[code];
        rates[code] = v
          ? { name: v.Name, rub_for_1: +(v.Value / v.Nominal).toFixed(4), change_since_previous: +((v.Value - v.Previous) / v.Nominal).toFixed(4) }
          : "ЦБ не публикует курс этой валюты";
      }
      ctx.addSource("ЦБ РФ", "https://www.cbr.ru/currency_base/daily/");
      return { date: String(data.Date).slice(0, 10), rates };
    } catch (e) {
      return { error: "Не удалось получить курсы: " + e.message };
    }
  }

  const stripTags = (html) => unescapeHtml(String(html || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

  async function searchWikipedia({ query }, ctx) {
    query = String(query || "").trim();
    ctx.report(`Ищу в Википедии: ${query}`);
    try {
      const found = (await getJson("https://ru.wikipedia.org/w/api.php?" + q({
        action: "query", list: "search", srsearch: query, format: "json", srlimit: 4, origin: "*",
      }))).query.search;
      if (!found.length) return { error: "В Википедии ничего не нашлось. Попробуй другой запрос." };
      const results = found.map((x) => ({
        title: x.title, url: "https://ru.wikipedia.org/wiki/" + encodeURIComponent(x.title.replace(/ /g, "_")), snippet: stripTags(x.snippet),
      }));
      let intro = "";
      try {
        const pages = (await getJson("https://ru.wikipedia.org/w/api.php?" + q({
          action: "query", prop: "extracts", exintro: 1, explaintext: 1, titles: found[0].title, format: "json", origin: "*",
        }))).query.pages;
        intro = String(Object.values(pages)[0].extract || "").slice(0, 3500);
      } catch { /* хватит и кратких описаний */ }
      ctx.addSource("Википедия: " + results[0].title, results[0].url, "ru.wikipedia.org");
      return { results, best_article: { title: results[0].title, intro } };
    } catch (e) {
      return { error: "Википедия сейчас недоступна: " + e.message };
    }
  }

  const TOOLS = { get_weather: getWeather, get_exchange_rates: getExchangeRates, search_wikipedia: searchWikipedia };

  // ---------- долгая память (как на компьютере, но хранится в телефоне) ----------

  const MEM_RULES =
    "У тебя есть долгая память о пользователе (инструменты remember и forget). Когда пользователь рассказывает о себе " +
    "что-то устойчивое и важное — имя, возраст, учёба или работа, город, друзья и родные, питомцы, увлечения, любимые " +
    "игры и музыка, свои проекты, цели, как ему удобнее получать ответы — вызови remember с коротким фактом от третьего " +
    "лица. Один вызов — одна мысль. Если просит «запомни» — тоже remember. Не запоминай разовое и секреты (пароли, " +
    "номера карт, коды). Если факт устарел или просят забыть — forget только этот факт. NOVA сама покажет под ответом, что запомнила.";
  const SECRET_RE = /парол|password|\bpin\b|пин[- ]?код|cvv|cvc|номер карт|карт[аы]\s*\d|\b\d{4}[ -]?\d{4}[ -]?\d{4}|код из смс|ключ api|api key|\bтокен|\btoken|sk-[a-z0-9]/i;
  const MEM_SPECIAL = [
    [/^(возраст|сколько мне лет|мой возраст)/, /\b\d{1,3} (лет|год)|возраст/],
    [/^(имя|как меня зовут|меня зовут|мое имя)/, /зовут|(^|\s)имя(\s|$)/],
  ];
  let memFresh = [];
  const memOn = () => settings.memory !== false;
  const memFacts = () => LS.get("memory", []);
  const normText = (s) => String(s || "").toLowerCase().replace(/ё/g, "е").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  function wordsAlike(a, b) {
    const A = new Set(normText(a).split(" ")), B = new Set(normText(b).split(" "));
    let n = 0;
    for (const w of A) if (B.has(w)) n++;
    return n / Math.max(A.size, B.size, 1);
  }
  function splitFact(text) {
    text = String(text || "").replace(/\s+/g, " ").trim().replace(/^[ .]+|[ .]+$/g, "");
    if (text.startsWith("Со слов пользователя")) return [text];
    const parts = text.split(/;\s+|,\s+(?![^«]*»)/).map((p) => p.trim().replace(/^[ .]+|[ .]+$/g, ""));
    if (parts.length >= 3 && parts.every((p) => p.split(" ").length >= 2)) return parts.map((p) => p[0].toUpperCase() + p.slice(1));
    return [text];
  }
  function memAdd(text) {
    text = String(text || "").replace(/\s+/g, " ").trim().replace(/^[ .]+|[ .]+$/g, "").slice(0, 300);
    if (text.length < 3) return [null, "пусто"];
    if (SECRET_RE.test(text)) return [null, "секрет"];
    text = text[0].toUpperCase() + text.slice(1);
    const list = memFacts();
    for (const x of list) {
      const r = wordsAlike(text, x.text);
      if (r > 0.9) return [x, "same"];
      if (r > 0.65) {
        Object.assign(x, { text, at: Math.round(Date.now() / 1000) });
        LS.set("memory", list);
        return [x, "updated"];
      }
    }
    const item = { id: Math.random().toString(36).slice(2, 12), text, at: Math.round(Date.now() / 1000) };
    LS.set("memory", [...list, item].slice(-80));
    return [item, "new"];
  }
  function memRemove(query) {
    const q = String(query || "").trim();
    const list = memFacts();
    let gone;
    if (["все", "всё", "all", "все факты", "всю память"].includes(normText(q))) gone = list;
    else if (list.some((x) => x.id === q)) gone = list.filter((x) => x.id === q);
    else {
      const nq = normText(q).replace(/^(про|о|об|что|как)\s+/, "");
      const special = MEM_SPECIAL.find(([w]) => w.test(nq));
      if (special) gone = list.filter((x) => special[1].test(normText(x.text)));
      else {
        const stems = (nq.match(/[\p{L}\p{N}]{3,}/gu) || []).map((w) => w.slice(0, Math.max(4, w.length - 2)));
        gone = list.filter((x) => stems.length && stems.every((st) => normText(x.text).includes(st)));
      }
    }
    if (gone.length) LS.set("memory", list.filter((x) => !gone.includes(x)));
    return gone;
  }
  function memBlock() {
    if (!memOn()) return "";
    const lines = [];
    let size = 0;
    for (const x of [...memFacts()].sort((a, b) => (b.at || 0) - (a.at || 0))) {
      if (size + x.text.length > 3500) break;
      lines.unshift("- " + x.text);
      size += x.text.length + 3;
    }
    if (!lines.length) return "";
    return "ДОЛГАЯ ПАМЯТЬ — что ты знаешь о пользователе из прошлых разговоров. Используй, когда это к месту " +
      "(подстраивай советы и примеры), но не пересказывай без повода:\n" + lines.join("\n");
  }
  TOOLS.remember = async ({ fact }) => {
    if (!memOn()) return { error: "Долгая память выключена в настройках NOVA — не запоминаю." };
    const saved = [];
    for (const part of splitFact(fact)) {
      const [item, how] = memAdd(part);
      if (!item) {
        if (how === "секрет") return { error: "Это секрет — такое NOVA не запоминает." };
        continue;
      }
      if (how !== "same" && !memFresh.includes(item.text)) memFresh.push(item.text);
      saved.push(item.text);
    }
    return saved.length ? { ok: true, remembered: saved } : { error: "Пустой факт." };
  };
  TOOLS.forget = async ({ fact }) => {
    const gone = memRemove(fact);
    return gone.length ? { ok: true, forgotten: gone.map((x) => x.text) } : { error: "Не нашла такого в памяти.", memory: memFacts().map((x) => x.text).slice(0, 40) };
  };

  // Подстраховка для моделей, которые не вызывают remember: имя, возраст, город NOVA замечает сама.
  const NOT_NAMES = new Set(["так", "как", "просто", "все", "всё", "никак", "по", "тоже", "также", "иначе", "вроде", "типа"]);
  const AUTO_RULES = [
    [/(?:^|[^\p{L}])меня\s+зовут\s+([\p{L}]{2,15})(?=[\s,.!?)]|$)/iu, "Пользователя зовут "],
    [/(?:^|[^\p{L}])мне\s+(\d{1,2})\s+(?:год|года|лет)(?![\p{L}])/iu, "Возраст пользователя: "],
    [/(?:^|[^\p{L}])я\s+(?:сейчас\s+)?живу\s+в\s+([\p{L}-]{3,20})(?=[\s,.!?)]|$)/iu, "Живёт в городе "],
  ];
  function memAuto(text) {
    if (!memOn() || memFresh.length) return;
    for (const [rx, prefix] of AUTO_RULES) {
      const m = String(text || "").match(rx);
      if (!m || NOT_NAMES.has(m[1].toLowerCase())) continue;
      const [item, how] = memAdd(prefix + m[1][0].toUpperCase() + m[1].slice(1));
      if (item && how !== "same") memFresh.push(item.text);
    }
  }

  function memoryCommand(text) {
    const t = text.replace(/\s+/g, " ").trim();
    const low = t.toLowerCase().replace(/ё/g, "е").replace(/[ .!?]+$/, "");
    if (["что ты обо мне знаешь", "что ты обо мне помнишь", "что ты помнишь обо мне", "что ты знаешь обо мне", "покажи память", "что в памяти"].includes(low)) {
      const list = memFacts();
      if (!list.length) return "Пока я ничего о тебе не запомнила. Расскажи о себе — или напиши «запомни, что …».";
      return "Вот что я о тебе помню:\n" + list.map((x) => "- " + x.text).join("\n") + "\n\nУдалить можно в ⚙ Настройках → «Память» или словами «забудь …».";
    }
    let m = t.match(/^(?:nova,?\s+)?запомни(?:,?\s*что)?[,:]?\s+([\s\S]{3,})$/i);
    if (m && memOn()) {
      let fact = m[1].trim().replace(/^[«»"]+|[«»"]+$/g, "");
      fact = `Со слов пользователя: «${fact[0].toUpperCase() + fact.slice(1)}»`;
      const [item, how] = memAdd(fact);
      if (!item) return how === "секрет" ? "Это похоже на секрет (пароль, карта, код) — такое я не запоминаю. 🔒" : null;
      return { new: "Запомнила! 🧠", updated: "Обновила в памяти! 🧠", same: "Это я уже помню. 🧠" }[how] + "\n\n> " + item.text;
    }
    m = t.match(/^забудь(?:,?\s*что)?[,:]?\s+([\s\S]{2,})$/i);
    if (m) {
      const gone = memRemove(m[1]);
      return gone.length ? "Забыла: " + gone.map((x) => x.text).join("; ") + "." : null;
    }
    return null;
  }

  // ---------- таймеры и напоминания (на телефоне — пока NOVA открыта) ----------

  const NUM_WORDS = { одну: 1, один: 1, одна: 1, две: 2, два: 2, три: 3, четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8,
    девять: 9, десять: 10, пятнадцать: 15, двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50 };
  const UNIT_RE = [[/^(час(?:а|ов)?|ч)$/, 3600], [/^(минут(?:а|у|ы)?|мин|м)$/, 60], [/^(секунд(?:а|у|ы)?|сек|с)$/, 1]];
  const DUR_RE = new RegExp("(?<![\\p{L}\\p{N}])(\\d+(?:[.,]\\d+)?|" + Object.keys(NUM_WORDS).join("|") +
    ")?\\s*(час(?:а|ов)?|ч|минут(?:а|у|ы)?|мин|м|секунд(?:а|у|ы)?|сек|с)(?![\\p{L}])", "gu");
  const timerList = () => LS.get("timers", []);
  function parseWhen(text, now = Date.now() / 1000) {
    let s = String(text || "").toLowerCase().replace(/ё/g, "е").replace(/^[ .!]+|[ .!]+$/g, "").replace(/^(через|на|в течение)\s+/, "");
    if (["полчаса", "пол часа"].includes(s)) return now + 1800;
    if (s === "полтора часа") return now + 5400;
    const m = s.match(/(завтра\s+)?(?:в\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(утра|дня|вечера|ночи)?$/);
    if (m && (m[3] || m[4] || /^(в |завтра)/.test(s))) {
      let h = +m[2];
      const mi = +(m[3] || 0);
      if ((m[4] === "дня" || m[4] === "вечера") && h < 12) h += 12;
      if (m[4] === "ночи" && h === 12) h = 0;
      if (h > 23 || mi > 59) return null;
      const d = new Date(now * 1000);
      d.setHours(h, mi, 0, 0);
      if (m[1] || d.getTime() / 1000 <= now + 5) d.setDate(d.getDate() + 1);
      return d.getTime() / 1000;
    }
    let total = 0, found = false;
    for (const x of s.matchAll(DUR_RE)) {
      const mult = UNIT_RE.find(([re]) => re.test(x[2]))[1];
      const n = x[1] ? (NUM_WORDS[x[1]] || parseFloat(x[1].replace(",", "."))) : 1;
      total += n * mult;
      found = true;
    }
    if (found && total > 0) return now + total;
    if (/^\d+(?:[.,]\d+)?$/.test(s)) return now + parseFloat(s.replace(",", ".")) * 60;
    return null;
  }
  function sayIn(sec) {
    sec = Math.round(sec);
    if (sec < 60) return sec + " сек";
    const h = Math.floor(sec / 3600), mn = Math.floor((sec % 3600) / 60), sc = sec % 60;
    return [h && h + " ч", mn && mn + " мин", sc && !h && sc + " сек"].filter(Boolean).join(" ");
  }
  function clockTime(at) {
    const d = new Date(at * 1000), now = new Date();
    const hm = pad(d.getHours()) + ":" + pad(d.getMinutes()) + (at - Date.now() / 1000 < 120 ? ":" + pad(d.getSeconds()) : "");
    if (d.toDateString() === now.toDateString()) return "в " + hm;
    const tmr = new Date(now.getTime() + 864e5);
    return (d.toDateString() === tmr.toDateString() ? "завтра в " : pad(d.getDate()) + "." + pad(d.getMonth() + 1) + " в ") + hm;
  }
  function timerAdd(at, text) {
    const item = { id: Math.random().toString(36).slice(2, 12), at: Math.round(at * 10) / 10, text: String(text || "").trim().slice(0, 200) };
    LS.set("timers", [...timerList(), item].sort((a, b) => a.at - b.at));
    scheduleTimers();
    askNotify();
    return item;
  }
  function timerCancel(q) {
    q = String(q || "").toLowerCase().trim();
    const list = timerList();
    let gone;
    if (["", "все", "всё", "все таймеры", "все напоминания"].includes(q)) gone = list;
    else if (list.some((x) => x.id === q)) gone = list.filter((x) => x.id === q);
    else if (/^\d+$/.test(q) && +q >= 1 && +q <= list.length) gone = [list[+q - 1]];
    else {
      q = q.replace(/^(таймер|напоминание|про|о|об)\s+/, "");
      const stems = (q.match(/[\p{L}\p{N}]{3,}/gu) || []).map((w) => w.slice(0, Math.max(4, w.length - 2)));
      gone = list.filter((x) => stems.length && stems.every((st) => x.text.toLowerCase().replace(/ё/g, "е").includes(st)));
      if (!gone.length && ["таймер", "напоминание"].includes(q) && list.length === 1) gone = list;
    }
    LS.set("timers", list.filter((x) => !gone.includes(x)));
    scheduleTimers();
    return gone;
  }
  function askNotify() {
    try {
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    } catch { /* нет уведомлений */ }
  }
  function beep() {
    try {
      const ctx = new AudioContext();
      [0, 0.35, 0.7].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.28);
        o.connect(g).connect(ctx.destination);
        o.start(ctx.currentTime + t);
        o.stop(ctx.currentTime + t + 0.3);
      });
      setTimeout(() => ctx.close(), 1500);
    } catch { /* без звука */ }
  }
  function ringTimer(t, late) {
    const title = (t.text ? "Напоминание" : "Таймер") + (late ? " (пропущено)" : "");
    const body = t.text || "Время вышло!";
    beep();
    try { navigator.vibrate && navigator.vibrate([300, 150, 300, 150, 600]); } catch { /* нет вибрации */ }
    try {
      if ("Notification" in window && Notification.permission === "granted" && navigator.serviceWorker) {
        navigator.serviceWorker.ready.then((r) => r.showNotification("NOVA — " + title, { body, tag: "nova-" + t.id, icon: "icon-192.png", vibrate: [300, 150, 300] }));
      }
    } catch { /* без уведомления — останется сообщение в окне */ }
    dispatchEvent(new CustomEvent("nova:refresh"));
  }
  let timerHandle = 0;
  function scheduleTimers() {
    clearTimeout(timerHandle);
    const list = timerList();
    if (!list.length) return;
    const wait = Math.max(0, Math.min(2 ** 31 - 1, (list[0].at - Date.now() / 1000) * 1000));
    timerHandle = setTimeout(fireTimers, wait);
  }
  function fireTimers() {
    const now = Date.now() / 1000;
    const list = timerList();
    const due = list.filter((x) => x.at <= now + 0.5);
    LS.set("timers", list.filter((x) => x.at > now + 0.5));
    for (const t of due) ringTimer(t, now - t.at > 90);
    scheduleTimers();
  }
  // вернулись в приложение — сработать то, что пропустили, пока телефон спал
  document.addEventListener("visibilitychange", () => { if (!document.hidden) fireTimers(); });

  TOOLS.set_timer = async ({ when, text }) => {
    const at = parseWhen(when);
    if (at === null) return { error: `Не поняла время «${when}». Примеры: «5 минут», «1 час 30 минут», «в 18:30», «завтра в 9:00».` };
    if (at - Date.now() / 1000 > 7 * 86400) return { error: "Напоминания — не дальше чем на неделю вперёд." };
    const item = timerAdd(at, text);
    return { ok: true, rings_at: clockTime(at), in: sayIn(at - Date.now() / 1000), text: item.text,
      note: "На телефоне таймер сработает, только пока NOVA открыта — скажи об этом пользователю одной фразой." };
  };
  TOOLS.list_timers = async ({ name }) => {
    const q = String(name || "").toLowerCase().trim();
    const list = timerList().filter((x) => !q || x.text.toLowerCase().includes(q));
    if (!list.length) return { timers: [], note: "Таймеров и напоминаний нет." };
    return { timers: list.map((x, i) => ({ n: i + 1, text: x.text || "таймер", rings_at: clockTime(x.at), left: sayIn(x.at - Date.now() / 1000) })) };
  };
  TOOLS.cancel_timer = async ({ which }) => {
    const gone = timerCancel(which);
    return gone.length ? { ok: true, cancelled: gone.map((x) => x.text || "таймер") } : { error: "Не нашла такого таймера." };
  };

  const DUR_SRC = "(?:\\d+(?:[.,]\\d+)?|" + Object.keys(NUM_WORDS).join("|") + ")?\\s*(?:час(?:а|ов)?|ч|минут(?:а|у|ы)?|мин|м|секунд(?:а|у|ы)?|сек|с)";
  const WHEN_SRC = "(?:через\\s+(?:полчаса|полтора\\s+часа|" + DUR_SRC + "(?:\\s+(?:и\\s+)?" + DUR_SRC + ")*)" +
    "|(?:завтра\\s+)?в\\s+\\d{1,2}(?:[:.]\\d{2})?(?:\\s*(?:утра|дня|вечера|ночи))?)";
  function timerCommand(text) {
    const t = text.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim().replace(/[ .!]+$/, "");
    let m = t.match(/^(?:поставь\s+|заведи\s+|включи\s+|запусти\s+)?таймер\s+(?:на\s+)?(.+)$/);
    if (m) {
      const at = parseWhen(m[1]);
      if (at === null) return null;
      timerAdd(at, "");
      return `⏰ Таймер на **${sayIn(at - Date.now() / 1000)}** — сработает ${clockTime(at)}. На телефоне — пока NOVA открыта.`;
    }
    m = t.match(new RegExp("^напомни(?:\\s+мне)?\\s+(" + WHEN_SRC + ")\\s+(.+)$")) ||
      t.match(new RegExp("^напомни(?:\\s+мне)?\\s+(.+?)\\s+(" + WHEN_SRC + ")$"));
    if (m) {
      const first = /^(через|завтра|в\s+\d)/.test(m[1]);
      const at = parseWhen(first ? m[1] : m[2]);
      let what = (first ? m[2] : m[1]).replace(/^(что(?:бы)?|что нужно)\s+/, "").trim();
      if (at === null || at - Date.now() / 1000 > 7 * 86400) return null;
      const item = timerAdd(at, what[0].toUpperCase() + what.slice(1));
      return `🔔 Напомню **${clockTime(at)}**: ${item.text}. На телефоне — пока NOVA открыта.`;
    }
    if (["какие таймеры", "мои таймеры", "какие напоминания", "мои напоминания", "покажи таймеры", "сколько осталось"].includes(t)) {
      const list = timerList();
      if (!list.length) return "Таймеров и напоминаний нет.";
      return list.map((x) => `- **${clockTime(x.at)}** (через ${sayIn(x.at - Date.now() / 1000)}) — ${x.text || "таймер"}`).join("\n");
    }
    m = t.match(/^(?:отмени|убери|удали|выключи|останови|сбрось)\s+(все\s+)?(таймер(?:ы)?|напоминани(?:е|я))(?:\s+(.+))?$/);
    if (m) {
      const gone = timerCancel(m[1] ? "все" : (m[3] || m[2]));
      if (!gone.length) return timerList().length ? null : "Таймеров и напоминаний и так нет.";
      return "Отменила: " + gone.map((x) => x.text || "таймер").join(", ") + ".";
    }
    return null;
  }

  TOOL_DECLS.push(
    { name: "remember", description: "Запомнить надолго важный факт о пользователе — он будет известен во всех чатах (имя, учёба, увлечения, проекты, друзья, предпочтения). Не для разовых вещей и не для секретов.",
      parameters: { type: "OBJECT", properties: { fact: { type: "STRING", description: "один короткий факт от третьего лица, например «Делает игры в Roblox вместе с друзьями»" } }, required: ["fact"] } },
    { name: "forget", description: "Забыть факт о пользователе из долгой памяти (когда просит забыть или факт устарел).",
      parameters: { type: "OBJECT", properties: { fact: { type: "STRING", description: "что забыть — часть текста факта или «всё»" } }, required: ["fact"] } },
    { name: "set_timer", description: "Поставить таймер или напоминание («напомни…», «таймер на…»). На телефоне сработает, пока NOVA открыта.",
      parameters: { type: "OBJECT", properties: {
        when: { type: "STRING", description: "через сколько или во сколько: «5 минут», «1 час 30 минут», «в 18:30», «завтра в 9:00»" },
        text: { type: "STRING", description: "о чём напомнить, коротко (пустая строка — просто таймер)" } }, required: ["when", "text"] } },
    { name: "list_timers", description: "Какие таймеры и напоминания сейчас поставлены.",
      parameters: { type: "OBJECT", properties: { name: { type: "STRING", description: "часть текста, чтобы найти одно (пустая строка — все)" } }, required: ["name"] } },
    { name: "cancel_timer", description: "Отменить таймер или напоминание.",
      parameters: { type: "OBJECT", properties: { which: { type: "STRING", description: "о чём оно (часть текста), номер из списка или «все»" } }, required: ["which"] } },
  );

  async function runTool(name, args, ctx) {
    const fn = TOOLS[name];
    if (!fn) return { error: "нет инструмента " + name };
    try {
      return await fn(args && typeof args === "object" ? args : {}, ctx);
    } catch (e) {
      return { error: String(e.message || e) };
    }
  }

  // ---------- Gemini ----------

  class GemError extends Error {
    constructor(code, message, status) {
      super(message);
      this.code = code;
      this.status = status || "";
    }
  }

  async function gemErrorFrom(res) {
    let msg = "HTTP " + res.status;
    let status = "";
    try {
      const j = await res.json();
      msg = (j.error && j.error.message) || msg;
      status = (j.error && j.error.status) || "";
    } catch { /* без тела */ }
    return new GemError(res.status, msg, status);
  }

  // Ответ кусочками (SSE). onPart получает каждую часть ответа модели как есть.
  async function geminiStream(modelName, body, signal, onPart) {
    const ctl = new AbortController();
    let timedOut = false;
    let timer = 0;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timedOut = true;
        ctl.abort();
      }, SILENCE_MS);
    };
    const onAbort = () => ctl.abort();
    if (signal) signal.addEventListener("abort", onAbort);
    arm();
    try {
      const res = await realFetch(API + modelName + ":streamGenerateContent?alt=sse", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey() },
        body: JSON.stringify(body),
        signal: ctl.signal,
      });
      if (!res.ok) throw await gemErrorFrom(res);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        arm();
        buf += decoder.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          let obj;
          try { obj = JSON.parse(line.slice(5)); } catch { continue; }
          if (obj.error) throw new GemError(obj.error.code, obj.error.message, obj.error.status);
          const parts = (obj.candidates && obj.candidates[0] && obj.candidates[0].content && obj.candidates[0].content.parts) || [];
          for (const p of parts) onPart(p);
        }
      }
    } catch (e) {
      if (timedOut) throw new GemError("timeout", "Модель слишком долго молчит");
      throw e;
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  }

  async function geminiOnce(modelName, prompt, maxTokens, timeoutMs, key = apiKey()) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    try {
      const res = await realFetch(API + modelName + ":generateContent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: maxTokens },
        }),
        signal: ctl.signal,
      });
      if (!res.ok) throw await gemErrorFrom(res);
      const j = await res.json();
      return ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || [])
        .map((p) => (p.thought ? "" : p.text || "")).join("").trim();
    } finally {
      clearTimeout(timer);
    }
  }

  function explainError(e) {
    const text = String((e && e.message) || e || "");
    const low = text.toLowerCase();
    const code = e && e.code;
    if (low.includes("location is not supported") || low.includes("user location")) {
      return "Google не пускает к Gemini из твоего региона. Включи VPN на телефоне и попробуй ещё раз.";
    }
    if (low.includes("api key not valid") || low.includes("api_key_invalid") || code === 401 || code === 403) {
      return "Google не принял ключ Gemini: он неверный, удалён или отключён. Создай новый на " +
        "aistudio.google.com/apikey и вставь его в ⚙ Настройки → «Ключ Gemini».";
    }
    if (code === 400 && /payload|too large|exceed|image|inline|mime|pdf|document/.test(low)) {
      return "Google не смог обработать вложение: оно слишком большое или повреждено. Попробуй файл поменьше.";
    }
    if (code === 429) {
      return "Упёрлась в лимит бесплатных запросов Google на всех моделях. Подожди минуту. " +
        `Если не помогло, значит, кончился дневной лимит — он обновится в ${resetTimeText()}.`;
    }
    if (code === 404) return "Google отключил модели, с которыми работает NOVA. Нужно обновить NOVA для телефона.";
    if (typeof code === "number" && code >= 500) return "Серверы Google сейчас перегружены или сбоят. Попробуй через минуту.";
    if (code === "timeout") return "Google слишком долго не отвечает на всех моделях. Попробуй ещё раз чуть позже.";
    if (e instanceof TypeError || /failed to fetch|network|load failed/.test(low)) {
      return "Не получилось достучаться до Google: нет интернета, или соединение блокируется. " +
        "Проверь интернет. Если ты в России, Gemini работает только через VPN.";
    }
    return "Не удалось получить ответ: " + (text.length < 300 ? text : text.slice(0, 300) + "…");
  }

  // Сбой, при котором есть смысл попробовать другую модель или ещё раз (а не ключ/регион/вложение).
  const passing = (e) => e instanceof TypeError || [404, 429, 500, 502, 503, 504, "timeout"].includes(e && e.code);

  // Первый раунд ответа — «наперегонки». Основная модель стартует сразу; если она молчит HEDGE_MS
  // или упала, параллельно стартует следующая. Кто первым начал отвечать, тот и отвечает,
  // остальные отменяются. Серверы Google бывают перегружены: основная модель то отвечает
  // за 4 секунды, то молчит минуту — так ждать приходится не дольше ~10–15 секунд.
  function race(cands, makeBody, signal, onPart, report) {
    return new Promise((resolve, reject) => {
      const runs = [];
      let winner = -1;
      let timer = 0;
      let lastError = null;
      const crown = (i) => {
        winner = i;
        clearTimeout(timer);
        runs.forEach((r, j) => j !== i && r.ctl.abort());
      };
      const start = () => {
        clearTimeout(timer);
        if (winner >= 0 || runs.length >= cands.length || (signal && signal.aborted)) return;
        const i = runs.length;
        const [name, level] = cands[i];
        const run = { ctl: new AbortController(), done: false };
        runs.push(run);
        if (i) report("Основная модель Google не отвечает — подключаю запасную");
        const outer = () => run.ctl.abort();
        if (signal) signal.addEventListener("abort", outer, { once: true });
        if (runs.length < 2) timer = setTimeout(start, HEDGE_MS); // параллельно — не больше двух сразу
        geminiStream(name, makeBody(level), run.ctl.signal, (p) => {
          if (winner < 0) crown(i);
          if (winner === i) onPart(p);
        }).then(
          () => {
            run.done = true;
            if (winner < 0) crown(i);
            if (winner === i) resolve({ name, level });
          },
          (e) => {
            run.done = true;
            if (winner === i || (signal && signal.aborted)) return reject(e);
            if (winner >= 0) return; // проигравший — его отменили
            lastError = e;
            console.warn("NOVA:", name, e);
            if (e.code === 429) markExhausted(name, e);
            if (!passing(e)) {
              crown(i);
              return reject(e); // ключ, регион, вложение — другая модель не поможет
            }
            start(); // сразу следующую
            if (runs.length === cands.length && runs.every((r) => r.done)) reject(lastError);
          }
        ).finally(() => signal && signal.removeEventListener("abort", outer));
      };
      start();
    });
  }

  // --- дневные лимиты Google: модель с кончившимся лимитом пропускаем до его обновления ---

  // Google обнуляет лимиты в полночь по тихоокеанскому времени.
  function nextQuotaReset() {
    const now = new Date();
    const y = now.getUTCFullYear();
    const nthSunday = (month, n) => {
      const d = new Date(Date.UTC(y, month, 1));
      return Date.UTC(y, month, 1 + ((7 - d.getUTCDay()) % 7) + (n - 1) * 7);
    };
    // летнее время в США: со второго воскресенья марта до первого воскресенья ноября
    const summer = now >= nthSunday(2, 2) + 10 * 3600e3 && now < nthSunday(10, 1) + 9 * 3600e3;
    const reset = new Date(Date.UTC(y, now.getUTCMonth(), now.getUTCDate(), summer ? 7 : 8));
    if (reset <= now) reset.setUTCDate(reset.getUTCDate() + 1);
    return reset.getTime();
  }
  const resetTimeText = () => new Date(nextQuotaReset()).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  function markExhausted(name, e) {
    const low = String(e.message || "").toLowerCase();
    const until = low.includes("perday") || low.includes("per day") ? nextQuotaReset() : Date.now() + 60e3;
    LS.set("exhausted", { ...LS.get("exhausted", {}), [name]: until });
  }
  const isExhausted = (name) => (LS.get("exhausted", {})[name] || 0) > Date.now();

  // Спросить Symphony: потоковый ответ, походы в инструменты, запасные модели.
  async function askGemini(base, message, atts, role, emit, report, signal) {
    const history = await historyContents(base);
    const question = await userParts(message, atts, true);
    const system = systemPrompt(role, "symphony");
    const hasPdf = atts.some((a) => a.kind === "pdf");
    let cands = MODES.symphony.models.filter((c) => !(hasPdf && NO_DOCS.has(c[0])));
    const fresh = cands.filter((c) => !isExhausted(c[0]));
    if (fresh.length && fresh[0] !== cands[0]) {
      report(`У основной модели кончился дневной лимит Google — отвечает запасная (лимит обновится в ${resetTimeText()})`);
    }
    if (fresh.length) cands = fresh; // у всех кончился — всё равно пробуем: вдруг лимит уже обновился
    let lastError = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const sources = [];
      const ctx = {
        report,
        addSource(label, url, site) {
          if (url && sources.length < 5 && sources.every((s) => s[1] !== url && s[0] !== label)) {
            sources.push([label, url, site || new URL(url).hostname.replace(/^www\./, "")]);
          }
        },
      };
      let shown = "";
      try {
        const contents = [...history, { role: "user", parts: question }];
        const makeBody = (level) => ({
          systemInstruction: { parts: [{ text: system }] },
          tools: [{ functionDeclarations: TOOL_DECLS }],
          generationConfig: level ? { thinkingConfig: { thinkingLevel: level } } : {},
          contents,
        });
        let chosen = null; // после первого раунда — та же модель: её «подписи мыслей» понимает только она
        for (let round = 0; round < 7; round++) {
          const modelParts = [];
          let sep = round > 0 && shown.trim() !== "";
          const onPart = (p) => {
            modelParts.push(p);
            if (p.text && !p.thought) {
              const piece = (sep ? "\n\n" : "") + p.text;
              sep = false;
              shown += piece;
              emit("delta", piece);
            }
          };
          if (!chosen) chosen = await race(cands, makeBody, signal, onPart, report);
          else await geminiStream(chosen.name, makeBody(chosen.level), signal, onPart);
          const calls = modelParts.filter((p) => p.functionCall);
          if (!calls.length || round === 6) break;
          contents.push({ role: "model", parts: modelParts });
          const results = await Promise.all(calls.map((c) => runTool(c.functionCall.name, c.functionCall.args, ctx)));
          contents.push({
            role: "user",
            parts: calls.map((c, i) => ({ functionResponse: { name: c.functionCall.name, response: results[i] } })),
          });
        }
        const text = shown.trim();
        if (!text) return { text: "Ответ пришёл пустым. Попробуй переформулировать вопрос.", kind: "error" };
        lastModel = chosen.name;
        return { text, kind: "ai", sources };
      } catch (e) {
        if (signal && signal.aborted) return { text: shown.trim(), kind: "stopped", sources };
        lastError = e;
        console.warn("NOVA:", e);
        if (shown) emit("reset", null);
        if (attempt === 0 && passing(e) && e.code !== 429) {
          await sleep(1500);
          continue; // сбой посреди ответа или все модели устали — ещё одна попытка
        }
        break;
      }
    }
    return { text: explainError(lastError), kind: "error", fallback: !attachmentError(lastError) };
  }

  // Google отказался из-за вложения — другая модель тут не поможет.
  const attachmentError = (e) =>
    !!e && e.code === 400 && /payload|too large|exceed|image|inline|mime|pdf|document/.test(String(e.message).toLowerCase());

  // --- Sonata: DeepSeek (свой сайт или OpenRouter), формат запросов как у OpenAI ---

  let orModels = { at: 0, list: [] };
  async function deepseekTarget(key) {
    if (window.NOVA_TEST_SONATA) return window.NOVA_TEST_SONATA; // для проверок: { url, model }
    if (dsProvider(key) === "deepseek") return { url: DEEPSEEK_API, model: "deepseek-chat" };
    // OpenRouter: бесплатные модели DeepSeek то появляются, то исчезают — берём из их списка
    if (Date.now() - orModels.at > 6 * 3600e3) {
      try {
        const data = (await getJson("https://openrouter.ai/api/v1/models")).data || [];
        const ids = data.map((m) => m.id).filter((id) => id && id.startsWith("deepseek/") && id.endsWith(":free"));
        const rank = (id) => (/r1|distill/.test(id) ? 2 : 0) + (/chat|v3/.test(id) ? 0 : 1);
        ids.sort((a, b) => rank(a) - rank(b));
        orModels = { at: Date.now(), list: ids };
      } catch (e) {
        console.warn("NOVA: список моделей OpenRouter", e);
      }
    }
    return { url: OPENROUTER_API, model: orModels.list[0] || "deepseek/deepseek-chat-v3-0324:free" };
  }

  const dsHeaders = (key, url) => ({
    "Content-Type": "application/json",
    Authorization: "Bearer " + key,
    ...(url.includes("openrouter.ai") ? { "HTTP-Referer": "https://crosshexud.github.io/nova/", "X-Title": "NOVA" } : {}),
  });

  // инструменты в формате OpenAI (те же, что у Symphony)
  const lowerTypes = (s) => (Array.isArray(s) ? s.map(lowerTypes) : s && typeof s === "object"
    ? Object.fromEntries(Object.entries(s).map(([k, v]) => [k, k === "type" && typeof v === "string" ? v.toLowerCase() : lowerTypes(v)]))
    : s);
  const OPENAI_TOOLS = TOOL_DECLS.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: lowerTypes(t.parameters) } }));

  async function deepseekStream(key, target, messages, tools, signal, onText) {
    const ctl = new AbortController();
    let timedOut = false;
    let timer = 0;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { timedOut = true; ctl.abort(); }, SILENCE_MS);
    };
    const onAbort = () => ctl.abort();
    if (signal) signal.addEventListener("abort", onAbort);
    arm();
    const calls = [];
    try {
      const body = { model: target.model, messages, stream: true };
      if (tools) body.tools = tools;
      const res = await realFetch(target.url, { method: "POST", headers: dsHeaders(key, target.url), body: JSON.stringify(body), signal: ctl.signal });
      if (!res.ok) {
        const err = await gemErrorFrom(res);
        err.provider = "deepseek";
        throw err;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        arm();
        buf += decoder.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim();
          buf = buf.slice(i + 1);
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") continue;
          let obj;
          try { obj = JSON.parse(data); } catch { continue; }
          if (obj.error) throw Object.assign(new GemError(obj.error.code, obj.error.message), { provider: "deepseek" });
          for (const ch of obj.choices || []) {
            const d = ch.delta || {};
            if (d.content) onText(d.content);
            for (const tc of d.tool_calls || []) {
              const c = calls[tc.index || 0] || (calls[tc.index || 0] = { id: "", name: "", arguments: "" });
              if (tc.id) c.id = tc.id;
              if (tc.function && tc.function.name) c.name += tc.function.name;
              if (tc.function && tc.function.arguments) c.arguments += tc.function.arguments;
            }
          }
        }
      }
    } catch (e) {
      if (timedOut) throw Object.assign(new GemError("timeout", "DeepSeek слишком долго молчит"), { provider: "deepseek" });
      throw e;
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
    }
    return calls.filter(Boolean);
  }

  function explainDsError(e) {
    const text = String((e && e.message) || e || "");
    const low = text.toLowerCase();
    const code = e && e.code;
    if (code === 401 || code === 403) return "DeepSeek не принял ключ: он неверный или удалён. Проверь его в ⚙ Настройки → «Ключ DeepSeek».";
    if (code === 402 || /insufficient|balance/.test(low)) return "На счёте DeepSeek кончились деньги. Пополни баланс на platform.deepseek.com или возьми ключ OpenRouter.";
    if (code === 429) return "Упёрлась в лимит DeepSeek. Бесплатно через OpenRouter — около 50 ответов в день; подожди немного или попробуй завтра.";
    if (code === 404) return "Бесплатная модель DeepSeek сейчас недоступна на OpenRouter. Попробуй позже.";
    if (typeof code === "number" && code >= 500) return "Серверы DeepSeek сейчас перегружены. Попробуй через минуту.";
    if (code === "timeout") return "DeepSeek слишком долго не отвечает. Попробуй ещё раз чуть позже.";
    if (e instanceof TypeError || /failed to fetch|network|load failed/.test(low)) return "Не получилось достучаться до DeepSeek. Проверь интернет.";
    return "Sonata не смогла ответить: " + (text.length < 300 ? text : text.slice(0, 300) + "…");
  }

  async function checkDsKey(key) {
    const target = await deepseekTarget(key);
    try {
      const res = await realFetch(target.url, {
        method: "POST", headers: dsHeaders(key, target.url),
        body: JSON.stringify({ model: target.model, max_tokens: 5, messages: [{ role: "user", content: "Ответь одним словом: ок" }] }),
        signal: AbortSignal.timeout(40000),
      });
      if (res.ok) return [true, "Ключ работает" + (target.url.includes("openrouter") ? " (бесплатный DeepSeek через OpenRouter)" : "")];
      const e = await gemErrorFrom(res);
      if (e.code === 429) return [true, "Ключ работает (сейчас лимит запросов, подожди минуту)"];
      return [false, explainDsError(e)];
    } catch (e) {
      return [false, explainDsError(e)];
    }
  }

  // Сообщения в формате OpenAI: подсказка, история (вложения — текстом; картинки и PDF видела Symphony), вопрос.
  async function dsMessages(base, message, atts, role) {
    const userText = async (text, list, full) => {
      const chunks = [];
      for (const a of list) {
        if ((a.kind === "text" || a.kind === "doc") && full) {
          const part = await attachmentPart(a);
          chunks.push(part.text || `[вложение «${a.name}»]`);
        } else if (a.kind === "image" || a.kind === "pdf") {
          chunks.push(`[вложение «${a.name}» (${a.kind === "image" ? "картинка" : "PDF"}) — его смотрела модель Symphony]`);
        } else chunks.push(`[раньше было вложение «${a.name}»]`);
      }
      chunks.push(text || DEFAULT_ATTACH_PROMPT);
      return chunks.join("\n\n");
    };
    const turns = base.slice(-MAX_HISTORY);
    const withAtts = turns.map((t, i) => (t.atts.length ? i : -1)).filter((i) => i >= 0);
    const keep = new Set(withAtts.slice(-1));
    const msgs = [{ role: "system", content: systemPrompt(role, "sonata") }];
    for (let i = 0; i < turns.length; i++) {
      const t = turns[i];
      msgs.push(t.role === "user"
        ? { role: "user", content: await userText(t.text, t.atts, keep.has(i)) }
        : { role: "assistant", content: t.text || "…" });
    }
    while (msgs.length > 1 && msgs[1].role !== "user") msgs.splice(1, 1);
    msgs.push({ role: "user", content: await userText(message, atts, true) });
    return msgs;
  }

  // Спросить Sonata: потоковый ответ и свои походы за погодой, курсами и Википедией.
  async function askDeepseek(base, message, atts, role, emit, report, signal) {
    const key = dsKey();
    const target = await deepseekTarget(key);
    const msgs = await dsMessages(base, message, atts, role);
    const sources = [];
    const ctx = {
      report,
      addSource(label, url, site) {
        if (url && sources.length < 5 && sources.every((s) => s[1] !== url && s[0] !== label)) {
          sources.push([label, url, site || new URL(url).hostname.replace(/^www\./, "")]);
        }
      },
    };
    let tools = OPENAI_TOOLS;
    let shown = "";
    try {
      for (let round = 0; round < 7; round++) {
        let roundText = "";
        let sep = round > 0 && shown.trim() !== "";
        const onText = (t) => {
          const piece = (sep ? "\n\n" : "") + t;
          sep = false;
          roundText += t;
          shown += piece;
          emit("delta", piece);
        };
        let calls;
        try {
          calls = await deepseekStream(key, target, msgs, tools, signal, onText);
        } catch (e) {
          if (!tools || ![400, 404].includes(e.code) || !/tool/i.test(String(e.message))) throw e;
          tools = null; // эта бесплатная модель не умеет инструменты — отвечаем без них
          calls = await deepseekStream(key, target, msgs, null, signal, onText);
        }
        if (!calls.length || round === 6) break;
        const ids = calls.map((c, k) => c.id || `call_${round}_${k}`);
        msgs.push({ role: "assistant", content: roundText, tool_calls: calls.map((c, k) => ({
          id: ids[k], type: "function", function: { name: c.name, arguments: c.arguments || "{}" },
        })) });
        for (let k = 0; k < calls.length; k++) {
          let args = {};
          try { args = JSON.parse(calls[k].arguments || "{}"); } catch { /* пустые */ }
          const result = await runTool(calls[k].name, args, ctx);
          msgs.push({ role: "tool", tool_call_id: ids[k], content: JSON.stringify(result).slice(0, 12000) });
        }
      }
      const text = shown.trim();
      if (!text) return { text: "Ответ пришёл пустым. Попробуй переформулировать вопрос.", kind: "error" };
      lastModel = target.model;
      return { text, kind: "ai", sources };
    } catch (e) {
      if (signal && signal.aborted) return { text: shown.trim(), kind: "stopped", sources };
      console.warn("NOVA: Sonata", e);
      if (shown) emit("reset", null);
      return { text: explainDsError(e), kind: "error", fallback: true };
    }
  }

  // Коротко, почему модель недоступна: для плашки «Symphony недоступна (…) — ответила Sonata».
  function shortReason(text) {
    const low = String(text || "").toLowerCase();
    if (/регион|vpn/.test(low)) return "нужен VPN";
    if (low.includes("лимит")) return "кончился лимит";
    if (low.includes("ключ")) return "нет ключа";
    if (/интернет|достучаться/.test(low)) return "нет связи";
    if (/долго|перегруж/.test(low)) return "не отвечает";
    return "ошибка";
  }

  async function autoTitle(chat, question, answer) {
    try {
      const raw = await geminiOnce(GEMINI_LIGHT,
        "Придумай короткое название чата: 2–5 слов, на языке вопроса, отражает суть. " +
        "Без кавычек и точки в конце. Ответь только названием.\n\n" +
        `Вопрос: ${question.slice(0, 500)}\nОтвет: ${answer.slice(0, 500)}`, 24, 15000);
      const title = (raw.split("\n")[0] || "").replace(/^[\s"«»„“*.]+|[\s"«»„“*.]+$/g, "").slice(0, 60);
      if (title.length < 2) return;
      const first = chat.messages[0];
      if (first && chat.title === makeTitle(first.text, first.files)) {
        chat.title = title;
        saveChat(chat);
        dispatchEvent(new Event("nova:refresh")); // окно подхватит новое название
      }
    } catch (e) {
      console.warn("NOVA: название чата", e);
    }
  }

  async function checkKey(key) {
    try {
      await geminiOnce(GEMINI_LIGHT, "Ответь одним словом: ок", 5, 25000, key);
      return [true, "Ключ работает"];
    } catch (e) {
      if (e.code === 429) return [true, "Ключ работает (сейчас лимит запросов, подожди минуту)"];
      return [false, explainError(e)];
    }
  }

  // ---------- команды: «открой ютуб», «загугли …» ----------

  function openUrl(url) {
    try {
      return !!window.open(url, "_blank", "noopener");
    } catch {
      return false;
    }
  }

  function handleCommand(message) {
    const original = message.trim();
    const quick = memoryCommand(original) || timerCommand(original); // «запомни…», «таймер на 5 минут»
    if (quick) return quick;
    const text = original.toLowerCase().replace(/[!. ]+$/, "");
    const go = (url, ok) => (openUrl(url) ? ok : `Открой ссылку сама: ${url}`);
    if (["открой гугл", "открой google", "гугл", "google"].includes(text)) return go("https://www.google.com", "Открываю **Google**.");
    if (["открой ютуб", "открой youtube", "ютуб", "youtube"].includes(text)) return go("https://www.youtube.com", "Открываю **YouTube**.");
    for (const p of ["найди на ютубе ", "найди в ютубе ", "включи ", "ютуб ", "youtube "]) {
      if (text.startsWith(p) && text.slice(p.length).trim()) {
        const query = original.slice(p.length).trim();
        return go("https://www.youtube.com/results?search_query=" + encodeURIComponent(query), `Ищу на YouTube: **${query}**`);
      }
    }
    for (const p of ["загугли ", "погугли ", "найди в гугле ", "гугл ", "google "]) {
      if (text.startsWith(p) && text.slice(p.length).trim()) {
        const query = original.slice(p.length).trim();
        return go("https://www.google.com/search?q=" + encodeURIComponent(query), `Ищу в Google: **${query}**`);
      }
    }
    return null;
  }

  // ---------- экспорт и импорт ----------

  function fmtTime(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function chatToMarkdown(chat) {
    const lines = [`# ${chat.title}`, "", `*Чат с NOVA · начат ${fmtTime(chat.created)} · сообщений: ${chat.messages.length}*`];
    if (chat.role) lines.push("", "> **Роль NOVA в этом чате:** " + chat.role.trim().replace(/\n/g, "\n> "));
    lines.push("", "---", "");
    for (const m of chat.messages) {
      lines.push(`### ${m.role === "user" ? "🧑 Ты" : "✦ NOVA"} · ${fmtTime(m.time)}`, "");
      if (m.files && m.files.length) lines.push("📎 " + m.files.map((f) => "`" + f.name + "`").join(", "), "");
      if (m.text) lines.push(m.text.trim(), "");
      if (m.stopped) lines.push("*(ответ был остановлен)*", "");
      if (m.sources && m.sources.length) lines.push("**Источники:** " + m.sources.map((s) => `[${s[0]}](${s[1]})`).join(" · "), "");
    }
    lines.push("---", `*Сохранено из NOVA ${fmtTime(new Date())}*`, "");
    return lines.join("\n");
  }

  async function chatToJson(chat) {
    const filesData = {};
    for (const m of chat.messages) {
      for (const f of m.files || []) {
        const rec = await dbGetFile(f.stored).catch(() => null);
        if (rec) filesData[f.stored] = await blobToB64(rec.blob);
      }
    }
    return JSON.stringify({ nova_export: 1, exported: nowIso(), chat, files_data: filesData }, null, 1);
  }

  function downloadText(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.append(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 5000);
  }

  async function exportChat(chat, fmt) {
    const base = (chat.title.replace(/[<>:"/\\|?*\x00-\x1f]+/g, " ").trim().replace(/[ .]+$/, "") || "Чат NOVA").slice(0, 60);
    if (fmt === "md") downloadText(base + ".md", chatToMarkdown(chat), "text/markdown");
    else downloadText(base + ".nova.json", await chatToJson(chat), "application/json");
    return base + (fmt === "md" ? ".md" : ".nova.json");
  }

  async function importChat(data) {
    let source;
    let filesData = {};
    if (data && typeof data === "object" && data.chat && typeof data.chat === "object") {
      source = data.chat;
      filesData = data.files_data || {};
    } else if (data && typeof data === "object" && Array.isArray(data.messages)) source = data;
    else throw new Error("Это не похоже на копию чата NOVA (.json).");
    if (!Array.isArray(source.messages) || !source.messages.length) throw new Error("В файле нет сообщений.");

    const chat = makeChat();
    const now = chat.updated;
    chat.title = typeof source.title === "string" && source.title.trim() ? source.title.trim().slice(0, 80) : "Импортированный чат";
    if (typeof source.role === "string" && source.role.trim()) chat.role = source.role.trim().slice(0, ROLE_LIMIT);
    for (const k of ["created", "updated"]) if (typeof source[k] === "string" && fmtTime(source[k])) chat[k] = source[k];

    for (const m of source.messages.slice(0, 5000)) {
      if (!m || typeof m !== "object" || !["user", "ai"].includes(m.role) || typeof m.text !== "string") continue;
      const msg = { role: m.role, text: m.text.slice(0, 200000), time: typeof m.time === "string" && fmtTime(m.time) ? m.time : now };
      for (const flag of ["local", "stopped"]) if (m[flag] === true) msg[flag] = true;
      const sources = (m.sources || []).filter((s) => Array.isArray(s) && s.length >= 2 &&
        s.slice(0, 3).every((x) => typeof x === "string") && /^https?:\/\//.test(s[1])).map((s) => s.slice(0, 3));
      if (sources.length) msg.sources = sources.slice(0, 5);
      const files = [];
      for (const f of m.files || []) {
        if (!f || typeof f.stored !== "string" || !(f.stored in filesData)) continue;
        try {
          const name = String(f.name || "файл").slice(0, 120);
          const bytes = b64ToBytes(filesData[f.stored]);
          const [kind, mime] = classify(name, String(f.mime || ""), bytes);
          const stored = `${chat.id}-${randHex(8)}-${safeName(name)}`;
          await dbPutFile(stored, { name, mime, blob: new Blob([bytes], { type: mime }) });
          files.push({ name, kind, mime, stored, size: bytes.length });
        } catch { /* битое вложение пропускаем */ }
      }
      if (files.length) msg.files = files;
      if (msg.text || files.length) chat.messages.push(msg);
    }
    if (!chat.messages.length) throw new Error("В файле нет сообщений, которые можно восстановить.");
    saveChat(chat);
    return chat;
  }

  // ---------- ответ потоком (как у сервера NOVA: строки JSON) ----------

  function streamResponse(run, signal) {
    const enc = new TextEncoder();
    let ctl;
    let closed = false;
    const stream = new ReadableStream({ start(c) { ctl = c; } });
    const emit = (obj) => {
      if (closed) return;
      try { ctl.enqueue(enc.encode(JSON.stringify(obj) + "\n")); } catch { closed = true; }
    };
    if (signal) {
      signal.addEventListener("abort", () => {
        if (closed) return;
        closed = true;
        try { ctl.error(new DOMException("Остановлено", "AbortError")); } catch { /* уже закрыт */ }
      });
    }
    run(emit).finally(() => {
      if (closed) return;
      closed = true;
      try { ctl.close(); } catch { /* уже закрыт */ }
    });
    return new Response(stream, { status: 200, headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
  }

  async function answer(text, files, emit, signal, voice = false) {
    busy = true;
    voiceMode = voice;
    memFresh = [];
    const chat = current;
    try {
      const base = turnsFromMessages(chat.messages);
      const command = files.length ? null : handleCommand(text);
      record(chat, "user", text, { local: !!command, files });
      emit({ t: "chat", chat: summary(chat) });
      if (command) {
        record(chat, "ai", command, { local: true });
        emit({ t: "done", kind: "command", text: command, sources: [], chat: summary(chat) });
        return;
      }
      if (files.length) emit({ t: "status", text: "Изучаю " + (files.length === 1 && files[0].kind === "image" ? "картинку" : "вложения") });
      const report = (s) => emit({ t: "status", text: s });
      const delta = (k, d) => emit({ t: k, text: d });

      // Картинки и PDF видит только Symphony: это сообщение (и уточнение сразу после него) берёт она.
      const eyes = (list) => (list || []).filter((a) => a.kind === "image" || a.kind === "pdf");
      const lastUser = [...base].reverse().find((t) => t.role === "user");
      let first = mode();
      if (first === "sonata" && (eyes(files).length || (lastUser && eyes(lastUser.atts).length))) {
        if (apiKey()) {
          report(eyes(files).length ? "Symphony смотрит вложение" : "Про вложение отвечает Symphony — она его видела");
          first = "symphony";
        } else if (eyes(files).length) {
          emit({ t: "done", kind: "error", text: "Картинки и PDF видит только Symphony, а ей нужен ключ Gemini: ⚙ Настройки → «Ключ Gemini».", sources: [], chat: summary(chat) });
          return;
        }
      }

      // Выбранная модель, а если она недоступна (нет VPN, кончился лимит, нет ключа) — запасная.
      let r = null;
      let note = "";
      let firstFail = "";
      for (const m of [first, ...(FALLBACK[first] || [])]) {
        if (m !== first && MODES[m].engine !== "gemini" && eyes(files).length) continue;
        const [ok, problem] = status(m);
        if (!ok) {
          if (m === first) firstFail = problem;
          continue;
        }
        const why = shortReason(firstFail);
        if (m !== first) report(`${MODES[first].title} недоступна (${why}) — отвечает ${MODES[m].title}`);
        const ask = MODES[m].engine === "deepseek" ? askDeepseek : askGemini;
        r = await ask(base, text, files, chat.role, delta, report, signal);
        if (r.kind !== "error" || !r.fallback) {
          if (m !== first && r.kind !== "error") note = `${MODES[first].title} недоступна (${why}) — ответила ${MODES[m].title}`;
          break;
        }
        if (m === first) firstFail = r.text;
      }
      if (!r || (r.kind === "error" && r.fallback)) r = { text: firstFail || (r && r.text) || status(first)[1], kind: "error" };

      if (r.kind === "ai") memAuto(text); // модель не запомнила имя/возраст/город — NOVA сама
      if ((r.kind === "ai" || r.kind === "stopped") && r.text) {
        record(chat, "ai", r.text, { sources: r.sources, stopped: r.kind === "stopped", note, remembered: memFresh });
        const answers = chat.messages.filter((m) => m.role === "ai" && !m.local).length;
        if (r.kind === "ai" && answers === 1) {
          autoTitle(chat, text || "вложения: " + files.map((f) => f.name).join(", "), r.text);
        }
      }
      emit({ t: "done", kind: r.kind, text: r.text, sources: r.sources || [], note, remembered: memFresh, model: model(), chat: summary(chat) });
    } catch (e) {
      console.error("NOVA:", e);
      emit({ t: "done", kind: "error", text: "Что-то пошло не так: " + e.message, sources: [] });
    } finally {
      busy = false;
      voiceMode = false;
    }
  }

  // ---------- маршруты /api/… ----------

  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
  const fail = (msg, status = 400) => json({ error: msg }, status);

  async function handle(path, query, data, signal) {
    await ready;
    if (path === "/api/state") return json(await state());
    if (path === "/api/search") return json({ results: search(query.get("q")) });
    if (path === "/api/ping" || path === "/api/bye") return json({ ok: true });

    if (path === "/api/send") {
      if (busy) return fail("NOVA ещё отвечает", 409);
      const text = String(data.text || "").trim().slice(0, 20000);
      let files;
      try {
        files = await takeAttachments(data.attachments || [], current.id);
      } catch (e) {
        return fail(e.message);
      }
      if (!text && !files.length) return fail("пустое сообщение");
      return streamResponse((emit) => answer(text, files, emit, signal, !!data.voice), signal);
    }
    if (path === "/api/regenerate") {
      if (busy) return fail("NOVA ещё отвечает", 409);
      const msgs = current.messages;
      let idx = -1;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "user" && !msgs[i].local) {
          idx = i;
          break;
        }
      }
      if (idx < 0) return fail("нечего повторять");
      const { text, files = [] } = msgs[idx];
      msgs.splice(idx);
      return streamResponse((emit) => answer(text, files, emit, signal), signal);
    }
    if (busy && ["/api/new", "/api/open", "/api/delete", "/api/mode", "/api/delete_all", "/api/import"].includes(path)) {
      return fail("NOVA ещё отвечает", 409);
    }
    if (path === "/api/settings") {
      settings = cleanSettings({ ...settings, ...data });
      LS.set("settings", settings);
      return json(await state());
    }
    if (path === "/api/delete_all") {
      await dbClear();
      chats.clear();
      blobUrls.forEach((u) => URL.revokeObjectURL(u));
      blobUrls.clear();
      partCache.clear();
      current = makeChat();
      return json(await state());
    }
    if (path === "/api/api_key") {
      const key = String(data.key || "").replace(/\s+/g, "");
      if (key.length < 20 || key.length > 200) return fail("Это не похоже на ключ Gemini — скопируй его целиком.");
      const [ok, message] = await checkKey(key);
      if (!ok) return fail(message);
      LS.set("key", key);
      return json({ ...(await state()), message });
    }
    if (path === "/api/export") {
      const chat = chats.get(String(data.id)) || (current.id === data.id ? current : null);
      if (!chat || !chat.messages.length) return fail("в этом чате пока нечего сохранять", 404);
      const name = await exportChat(chat, data.format === "json" ? "json" : "md");
      return json({ ok: true, path: "", name });
    }
    if (path === "/api/reveal") return json({ ok: true });
    if (path === "/api/import") {
      let chat;
      try {
        chat = await importChat(data.data);
      } catch (e) {
        return fail(e.message);
      }
      chats.set(chat.id, chat);
      current = chat;
      return json(await state());
    }
    if (path === "/api/chat_role") {
      const chat = current.id === data.id ? current : chats.get(String(data.id));
      if (!chat) return fail("чат не найден", 404);
      const role = String(data.role || "").trim().slice(0, ROLE_LIMIT);
      if (role) chat.role = role;
      else delete chat.role;
      saveChat(chat);
      return json(await state());
    }
    if (path === "/api/open_file") {
      const rec = await dbGetFile(String(data.stored || "")).catch(() => null);
      if (!rec) return fail("файл не найден", 404);
      openUrl(URL.createObjectURL(rec.blob));
      return json({ ok: true });
    }
    if (path === "/api/new") {
      current = makeChat();
      return json(await state());
    }
    if (path === "/api/open") {
      const chat = chats.get(data.id);
      if (!chat) return fail("чат не найден", 404);
      current = chat;
      return json(await state());
    }
    if (path === "/api/delete") {
      const id = data.id;
      if (chats.has(id)) {
        chats.delete(id);
        await dbDeleteChat(id).catch(() => {});
        await dbDeleteFilesOf(id).catch(() => {});
      }
      if (current.id === id) current = makeChat();
      return json(await state());
    }
    if (path === "/api/rename") {
      const chat = chats.get(data.id);
      const title = String(data.title || "").split(/\s+/).filter(Boolean).join(" ").slice(0, 80);
      if (chat && title) {
        chat.title = title;
        saveChat(chat);
      }
      return json(await state());
    }
    if (path === "/api/mode") {
      if (MODES[data.mode]) {
        settings = cleanSettings({ ...settings, mode: data.mode });
        LS.set("settings", settings);
      }
      lastModel = null;
      return json(await state());
    }
    if (path === "/api/memory") return json({ facts: memFacts(), enabled: memOn() });
    if (path === "/api/memory_delete") {
      memRemove(data.all ? "всё" : String(data.id || "-"));
      return json({ facts: memFacts() });
    }
    if (path === "/api/timer_cancel") {
      const gone = timerCancel(String(data.id || "-"));
      return json({ ok: gone.length > 0, timers: timerList() });
    }
    if (path === "/api/deepseek_key") {
      const key = String(data.key || "").replace(/\s+/g, "");
      if (/^[A-Za-z0-9+/=]{40,}$/.test(key) && !key.startsWith("sk-")) {
        return fail("Это ключ GigaChat — он работает только в NOVA на компьютере (Сбер не пускает запросы из браузера). " +
          "На телефоне для Sonata нужен ключ DeepSeek или OpenRouter (начинается с «sk-»).");
      }
      if (key.length < 20 || key.length > 200 || !key.startsWith("sk-")) {
        return fail("Это не похоже на ключ DeepSeek или OpenRouter — он начинается с «sk-».");
      }
      const [ok, message] = await checkDsKey(key);
      if (!ok) return fail(message);
      LS.set("dskey", key);
      return json({ ...(await state()), message });
    }
    if (path === "/api/open_url") {
      const url = String(data.url || "");
      return json({ ok: /^https?:\/\//.test(url) && openUrl(url) });
    }
    return fail("нет такого запроса", 404);
  }

  // Подмена fetch: запросы окна к /api/… обрабатываются здесь, всё остальное — как обычно.
  window.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return realFetch(input, init);
    let data = {};
    if (init.body) {
      try { data = JSON.parse(init.body) || {}; } catch { data = {}; }
    }
    try {
      return await handle(url.pathname, url.searchParams, data, init.signal);
    } catch (e) {
      console.error("NOVA:", e);
      return fail("внутренняя ошибка: " + e.message, 500);
    }
  };
  const realBeacon = navigator.sendBeacon ? navigator.sendBeacon.bind(navigator) : null;
  navigator.sendBeacon = (url, body) => (String(url).includes("/api/") ? true : realBeacon ? realBeacon(url, body) : false);

  // ---------- приложение на главном экране ----------

  if ("serviceWorker" in navigator) {
    addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  let installEvent = null;
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installEvent = e;
    if (document.getElementById("installPill") || LS.get("installHidden", false)) return;
    const pill = document.createElement("div");
    pill.id = "installPill";
    pill.className = "install-pill";
    pill.innerHTML = '<button type="button" class="ip-go">Установить NOVA на телефон</button>' +
      '<button type="button" class="ip-x" aria-label="Не показывать">✕</button>';
    pill.querySelector(".ip-go").addEventListener("click", () => {
      pill.remove();
      if (installEvent) {
        installEvent.prompt();
        installEvent = null;
      }
    });
    pill.querySelector(".ip-x").addEventListener("click", () => {
      pill.remove();
      LS.set("installHidden", true); // установить можно и из меню браузера «⋮»
    });
    document.body.append(pill);
  });
  addEventListener("appinstalled", () => {
    const b = document.getElementById("installPill");
    if (b) b.remove();
  });

  // таймеры, поставленные раньше: пропущенные — сразу, остальные — по расписанию
  setTimeout(fireTimers, 1500);
})();
