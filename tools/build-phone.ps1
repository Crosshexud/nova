# Собирает NOVA для телефона (папка app/) из интерфейса NOVA на компьютере.
# Окно (app.js, style.css, markdown.js) общее; своё у телефона — core.js, phone.css, sw.js, manifest и index.html.
# Запуск:  powershell -ExecutionPolicy Bypass -File tools\build-phone.ps1
param([string]$Nova = "C:\Users\cross\Desktop\NOVA")

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$app = Join-Path $root "app"
$ui = Join-Path $Nova "ui"
$utf8 = New-Object System.Text.UTF8Encoding $false

foreach ($f in "app.js", "style.css", "markdown.js") { Copy-Item (Join-Path $ui $f) (Join-Path $app $f) -Force }

$html = [System.IO.File]::ReadAllText((Join-Path $ui "index.html"), [System.Text.Encoding]::UTF8)

$cards = @'
window.NOVA_CARDS = [
      { icon: "cloud", title: "Погода", text: "Что сейчас в Москве и что будет завтра",
        prompt: "Какая сейчас погода в Москве и что будет завтра?" },
      { icon: "coins", title: "Курсы валют", text: "Доллар, евро и юань по курсу ЦБ",
        prompt: "Какой сегодня курс доллара, евро и юаня по ЦБ? Покажи таблицей." },
      { icon: "globe", title: "Что такое…", text: "Коротко и понятно, с проверкой по Википедии",
        prompt: "Объясни простыми словами, что такое чёрная дыра. Проверь по Википедии." },
      { icon: "bulb", title: "Идея для игры", text: "Придумать что-нибудь необычное",
        prompt: "Придумай необычную идею для игры и опиши её в 5 пунктах." },
    ];
'@

$swaps = [ordered]@{
  '<meta name="viewport" content="width=device-width, initial-scale=1">' =
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">' +
    "`n  <meta name=`"theme-color`" content=`"#07080f`">" +
    "`n  <meta name=`"description`" content=`"NOVA для телефона: личный ИИ-ассистент на Gemini.`">" +
    "`n  <link rel=`"manifest`" href=`"manifest.webmanifest`">" +
    "`n  <link rel=`"apple-touch-icon`" href=`"icon-192.png`">"
  '<link rel="icon" href="/favicon.ico">' = '<link rel="icon" href="icon-192.png">'
  '<link rel="stylesheet" href="/style.css">' = "<link rel=`"stylesheet`" href=`"style.css`">`n  <link rel=`"stylesheet`" href=`"phone.css`">"
  'window.NOVA_TOKEN = "__NOVA_TOKEN__";' = "window.NOVA_TOKEN = `"phone`";`n    $cards"
  "я умею искать в интернете, узнавать погоду, новости и курсы валют." =
    "я узнаю погоду и курсы валют, проверяю факты в Википедии, смотрю картинки и PDF."
  "Он хранится только на этом компьютере." = "Он хранится только на этом телефоне."
  'placeholder="Спроси NOVA о чём угодно…"' = 'placeholder="Спроси NOVA…"'
  '<script src="/markdown.js"></script>' = "<script src=`"markdown.js`"></script>`n  <script src=`"core.js`"></script>"
  '<script src="/app.js"></script>' = '<script src="app.js"></script>'
}
foreach ($k in $swaps.Keys) {
  if (-not $html.Contains($k)) { throw "В ui/index.html не нашлось: $k — обнови build-phone.ps1" }
  $html = $html.Replace($k, $swaps[$k])
}
[System.IO.File]::WriteAllText((Join-Path $app "index.html"), $html, $utf8)

# новая версия кэша, чтобы телефоны точно взяли свежие файлы
$sw = Join-Path $app "sw.js"
$stamp = Get-Date -Format "yyyyMMdd-HHmm"
$text = [System.IO.File]::ReadAllText($sw, [System.Text.Encoding]::UTF8) -replace 'const CACHE = "nova-phone-[^"]*";', "const CACHE = `"nova-phone-$stamp`";"
[System.IO.File]::WriteAllText($sw, $text, $utf8)

"Готово: app/ собран из $ui (кэш nova-phone-$stamp)"
