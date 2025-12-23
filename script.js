/***************************************************
 * AI WEBSITE GENERATOR – MAIN SCRIPT
 * HTML | CSS | JavaScript ONLY
 ***************************************************/

/* ================= CONFIG ================= */

const API_KEY = ""; // <-- PUT YOUR GROQ API KEY HERE
const MODEL = "llama-3.3-70b-versatile";

/* ================= DOM ELEMENTS ================= */

const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("promptInput");

const htmlCodeEl = document.getElementById("htmlCode");
const cssCodeEl = document.getElementById("cssCode");
const jsCodeEl = document.getElementById("jsCode");

const previewFrame = document.getElementById("previewFrame");

/* ================= PROMPT (≈150 WORDS) ================= */

const BASE_PROMPT = `
You are an experienced frontend developer and UI engineer.

Your task is to generate a complete, functional website strictly using
HTML, CSS, and JavaScript only. The output must be clean, readable,
well-structured, and beginner-friendly. The generated website must work
entirely in the browser without any backend, frameworks, libraries, or
external dependencies.

The JavaScript must be fully self-contained and should not assume the
existence of any global variables or external files. The HTML must not
include <script src=""> or <link rel="stylesheet"> tags. Styling must be
written only in CSS, and behavior must be written only in JavaScript.

Do not include explanations, markdown, headings, or labels such as
"html", "css", or "javascript". Do not wrap code inside backticks.
Return only pure code inside the exact markers provided below.

The website should be practical, interactive, and realistic, following
standard web development practices. Use meaningful IDs, classes, and
clear logic.

Return output in EXACTLY this format and nothing else:

---HTML---
(code)

---CSS---
(code)

---JS---
(code)

User request:
[USER_DESCRIPTION]
`;

/* ================= HELPERS ================= */
function sanitizeCSS(css) {
  return css
    // remove leading "css" label
    .replace(/^\s*css\s*/i, "")
    // remove any stray labels
    .replace(/^\s*(html|javascript)\s*/gi, "")
    .trim();
}

// Remove unwanted labels and markdown
function cleanAIText(text) {
  return text
    .replace(/```/g, "")
    .replace(/^\s*(html|css|javascript)\s*$/gim, "")
    .replace(/^#{1,6}.*$/gm, "")
    .trim();
}

// Extract code between markers
function extractBetween(text, start, end) {
  if (!text.includes(start) || !text.includes(end)) return "";
  return text.split(start)[1].split(end)[0].trim();
}

// Remove HTML/script tags from JS
function sanitizeJS(js) {
  return js
    .replace(/<script[^>]*>/gi, "")
    .replace(/<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim();
}

// Update iframe preview safely
function updatePreview(html, css, js) {
  // Remove external JS references
  html = html.replace(
    /<script[^>]*src=["'].*?["'][^>]*><\/script>/gi,
    ""
  );

  // Ensure <head> exists
  if (!/<head>/i.test(html)) {
    html = html.replace("<html>", "<html><head></head>");
  }

  // Inject CSS safely
  html = html.replace(
    "</head>",
    `<style>${css}</style></head>`
  );

  const finalHTML = `
${html}
<script>
try {
${js}
} catch (e) {
  document.body.innerHTML =
    '<pre style="color:red;font-family:monospace;">Runtime Error: ' +
    e.message +
    '</pre>';
}
<\/script>
`;

  const blob = new Blob([finalHTML], { type: "text/html" });
  previewFrame.src = URL.createObjectURL(blob);
}

// File download helper
function downloadFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ================= MAIN LOGIC ================= */

generateBtn.onclick = async function () {
  const userInput = promptInput.value.trim();

  if (!userInput) {
    alert("Please describe the website you want to generate.");
    return;
  }

  if (!API_KEY) {
    alert("API key is missing.");
    return;
  }

  const prompt = BASE_PROMPT.replace(
    "[USER_DESCRIPTION]",
    userInput
  );

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      }
    );

    const data = await response.json();

    let raw = data.choices[0].message.content;
    raw = cleanAIText(raw);

    const html = extractBetween(raw, "---HTML---", "---CSS---");
    const cssRaw = extractBetween(raw, "---CSS---", "---JS---");
const css = sanitizeCSS(cssRaw);

    const jsRaw = raw.split("---JS---")[1] || "";

    const js = sanitizeJS(jsRaw);

    if (!html || !css || !js) {
      alert("AI returned invalid format. Please regenerate.");
      return;
    }

    htmlCodeEl.textContent = html;
    cssCodeEl.textContent = css;
    jsCodeEl.textContent = js;

    updatePreview(html, css, js);
  } catch (err) {
    console.error(err);
    alert("AI generation failed. Check console for details.");
  }
};

/* ================= DOWNLOAD BUTTONS ================= */

document.getElementById("downloadHtml").onclick = () =>
  downloadFile("index.html", htmlCodeEl.textContent);

document.getElementById("downloadCss").onclick = () =>
  downloadFile("style.css", cssCodeEl.textContent);

document.getElementById("downloadJs").onclick = () =>
  downloadFile("script.js", jsCodeEl.textContent);
