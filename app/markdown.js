/*
  NOVA — маленький безопасный Markdown → HTML.
  Сначала весь текст экранируется (никакой HTML из ответа не выполнится), потом размечается:
  заголовки, списки (с вложенностью), цитаты, таблицы, блоки кода, `код`, **жирный**, *курсив*,
  ~~зачёркнутый~~, ссылки (только http/https). Мигающий курсор печати — через служебный символ.
*/
"use strict";

(function () {
  const CARET = "";
  const CODE_OPEN = "";
  const CODE_CLOSE = "";
  const COPY_ICON =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  const esc = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  function inline(s) {
    const codes = [];
    s = s.replace(/`([^`\n]+)`/g, (_, c) => {
      codes.push(c);
      return CODE_OPEN + (codes.length - 1) + CODE_CLOSE;
    });
    s = s.replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, t, u) => `<a href="${u}" data-ext>${t}</a>`);
    s = s.replace(
      /(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g,
      (_, p, u) => `${p}<a href="${u}" data-ext>${u}</a>`
    );
    s = s.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*\w])\*([^*\s][^*\n]*?)\*(?![*\w])/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~\n]+?)~~/g, "<del>$1</del>");
    s = s.replace(new RegExp(CODE_OPEN + "(\\d+)" + CODE_CLOSE, "g"), (_, i) => `<code>${codes[+i]}</code>`);
    return s;
  }

  const RE = {
    fence: /^\s*```\s*([\w+#.-]*)\s*$/,
    fenceEnd: /^\s*```\s*$/,
    heading: /^(#{1,4})\s+(.*)$/,
    hr: /^\s*(-{3,}|\*{3,}|_{3,})\s*$/,
    quote: /^\s*&gt;\s?/,
    item: /^\s*([-*+•]|\d+[.)])\s+/,
    ordered: /^\s*\d+[.)]\s+/,
    tableSep: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/,
  };

  const indentOf = (line) => {
    const m = line.match(/^[ \t]*/)[0];
    return m.replace(/\t/g, "    ").length;
  };

  function isTableStart(line, next) {
    return line.includes("|") && next !== undefined && RE.tableSep.test(next);
  }

  function isBlockStart(line, next) {
    return (
      RE.fence.test(line) || RE.heading.test(line) || RE.hr.test(line) ||
      RE.quote.test(line) || RE.item.test(line) || isTableStart(line, next)
    );
  }

  function splitRow(line) {
    let s = line.trim();
    if (s.startsWith("|")) s = s.slice(1);
    if (s.endsWith("|")) s = s.slice(0, -1);
    return s.split("|").map((c) => c.trim());
  }

  function codeBlock(lang, code) {
    return (
      '<div class="code-block"><div class="code-head"><span>' + (lang || "код") + "</span>" +
      '<button class="code-copy" type="button">' + COPY_ICON + "<span>Копировать</span></button></div>" +
      "<pre><code>" + code + "</code></pre></div>"
    );
  }

  function parseList(lines, i) {
    const base = indentOf(lines[i]);
    const ordered = RE.ordered.test(lines[i]);
    const startNum = ordered ? parseInt(lines[i].trim(), 10) : 1;
    const items = [];
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && RE.item.test(lines[j]) && indentOf(lines[j]) >= base) {
          i = j;
          continue;
        }
        break;
      }
      const ind = indentOf(line);
      if (RE.item.test(line) && ind <= base + 1) {
        if (RE.ordered.test(line) !== ordered) break;
        items.push({ text: line.replace(RE.item, ""), children: [] });
        i++;
      } else if (items.length && ind > base + 1) {
        if (RE.item.test(line)) {
          const sub = parseList(lines, i);
          items[items.length - 1].children.push(sub.html);
          i = sub.next;
        } else if (RE.fence.test(line)) {
          const sub = blocks(lines, i, true);
          items[items.length - 1].children.push(sub.html);
          i = sub.next;
        } else {
          items[items.length - 1].text += "\n" + line.trim();
          i++;
        }
      } else if (items.length && !isBlockStart(line, lines[i + 1])) {
        items[items.length - 1].text += "\n" + line.trim();
        i++;
      } else {
        break;
      }
    }
    const tag = ordered ? "ol" : "ul";
    const start = ordered && startNum !== 1 ? ` start="${startNum}"` : "";
    const html =
      `<${tag}${start}>` +
      items.map((it) => `<li>${inline(it.text).replace(/\n/g, "<br>")}${it.children.join("")}</li>`).join("") +
      `</${tag}>`;
    return { html, next: i };
  }

  // Разбирает уже экранированные строки. single — разобрать только один блок (для кода внутри списка).
  function blocks(lines, i = 0, single = false) {
    const out = [];
    while (i < lines.length) {
      const line = lines[i];
      let m;
      if ((m = line.match(RE.fence))) {
        const lang = m[1];
        const buf = [];
        const ind = indentOf(line);
        i++;
        while (i < lines.length && !RE.fenceEnd.test(lines[i])) {
          buf.push(lines[i].slice(Math.min(ind, indentOf(lines[i]))));
          i++;
        }
        i++;
        out.push(codeBlock(lang, buf.join("\n")));
      } else if (!line.trim()) {
        i++;
        continue;
      } else if ((m = line.match(RE.heading))) {
        const lvl = m[1].length + 1;
        out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
        i++;
      } else if (RE.hr.test(line)) {
        out.push("<hr>");
        i++;
      } else if (RE.quote.test(line)) {
        const buf = [];
        while (i < lines.length && RE.quote.test(lines[i])) {
          buf.push(lines[i].replace(RE.quote, ""));
          i++;
        }
        out.push(`<blockquote>${blocks(buf).html}</blockquote>`);
      } else if (isTableStart(line, lines[i + 1])) {
        const head = splitRow(line);
        i += 2;
        const rows = [];
        while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
          rows.push(splitRow(lines[i]));
          i++;
        }
        out.push(
          '<div class="table-wrap"><table><thead><tr>' +
            head.map((h) => `<th>${inline(h)}</th>`).join("") +
            "</tr></thead><tbody>" +
            rows.map((r) => "<tr>" + head.map((_, k) => `<td>${inline(r[k] || "")}</td>`).join("") + "</tr>").join("") +
            "</tbody></table></div>"
        );
      } else if (RE.item.test(line)) {
        const res = parseList(lines, i);
        out.push(res.html);
        i = res.next;
      } else {
        const buf = [line];
        i++;
        while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i], lines[i + 1])) {
          buf.push(lines[i]);
          i++;
        }
        out.push(`<p>${inline(buf.join("\n")).replace(/\n/g, "<br>")}</p>`);
      }
      if (single) break;
    }
    return { html: out.join(""), next: i };
  }

  function render(src, opts = {}) {
    let text = String(src || "").replace(/\r\n?/g, "\n");
    if (opts.caret) text += CARET;
    const html = blocks(esc(text).split("\n")).html;
    return html.replace(new RegExp(CARET, "g"), '<span class="caret"></span>');
  }

  // Текст без разметки — для озвучки.
  function plain(src) {
    return String(src || "")
      .replace(/```[\s\S]*?(```|$)/g, " (фрагмент кода) ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/^\s*#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+•]\s+/gm, "")
      .replace(/\*\*|__|~~|\*/g, "")
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  window.NovaMarkdown = { render, plain };
})();
