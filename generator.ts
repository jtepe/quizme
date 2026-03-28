import type { Quiz } from "./parser";

export function generateHTML(quiz: Quiz): string {
  const quizJSON = JSON.stringify(quiz);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(quiz.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/prismjs@1/themes/prism-tomorrow.min.css" rel="stylesheet">
<style>
${CSS}
</style>
</head>
<body>
<div id="progress-bar"></div>
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/prism.min.js"><\/script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1/plugins/autoloader/prism-autoloader.min.js"><\/script>
<script>
const QUIZ = ${quizJSON};
${JS}
</script>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root {
  --bg: #0c0b09;
  --bg-card: #15140f;
  --bg-card-border: #2a2720;
  --text: #d8d1c4;
  --text-dim: #8a8478;
  --text-heading: #f0ead8;
  --accent: #c9a84c;
  --accent-dim: rgba(201,168,76,0.15);
  --correct: #5a9e6f;
  --correct-bg: rgba(90,158,111,0.12);
  --incorrect: #c45c5c;
  --incorrect-bg: rgba(196,92,92,0.12);
  --font-body: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'Fira Code', 'Menlo', 'Consolas', monospace;
  --transition: 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  background-size: 256px;
  pointer-events: none;
  z-index: 9999;
}

#progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  transition: width var(--transition);
  z-index: 100;
  box-shadow: 0 0 12px rgba(201,168,76,0.4);
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.5rem;
}

/* Tally bar */
.tally {
  position: fixed;
  top: 16px;
  right: 24px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-dim);
  letter-spacing: 0.08em;
  z-index: 50;
}
.tally span { color: var(--accent); }

/* Question counter */
.q-counter {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-dim);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
}

/* Card */
.card {
  max-width: 680px;
  width: 100%;
  animation: fadeUp 0.5s ease both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.card h1 {
  font-family: var(--font-body);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-heading);
  line-height: 1.3;
  margin-bottom: 2rem;
  letter-spacing: -0.01em;
}

/* Inline code */
code:not([class*="language-"]):not(pre code) {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.2);
  border-radius: 4px;
  padding: 0.15em 0.4em;
  color: #e8c87a;
}

/* Code blocks - override Prism theme to match our palette */
pre[class*="language-"] {
  background: #111110 !important;
  border: 1px solid var(--bg-card-border) !important;
  border-radius: 6px !important;
  margin: 1rem 0 !important;
  padding: 1rem !important;
  font-size: 0.85rem !important;
  line-height: 1.6 !important;
  overflow-x: auto;
}
pre[class*="language-"] code {
  font-family: var(--font-mono) !important;
  font-size: 0.85rem !important;
  background: none !important;
  border: none !important;
  padding: 0 !important;
}

/* Choices */
.choices {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-bottom: 2rem;
}

.choice {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  border: 1px solid var(--bg-card-border);
  border-radius: 6px;
  background: var(--bg-card);
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition), opacity var(--transition);
  animation: fadeUp 0.4s ease both;
}

.choice:nth-child(1) { animation-delay: 0.05s; }
.choice:nth-child(2) { animation-delay: 0.1s; }
.choice:nth-child(3) { animation-delay: 0.15s; }
.choice:nth-child(4) { animation-delay: 0.2s; }
.choice:nth-child(5) { animation-delay: 0.25s; }
.choice:nth-child(6) { animation-delay: 0.3s; }

.choice:hover { border-color: var(--accent); }
.choice.selected { border-color: var(--accent); background: var(--accent-dim); }
.choice.disabled { pointer-events: none; }

.choice.revealed-correct {
  border-color: var(--correct);
  background: var(--correct-bg);
}
.choice.revealed-incorrect {
  border-color: var(--incorrect);
  background: var(--incorrect-bg);
  opacity: 0.7;
}

/* Custom checkbox */
.checkbox {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border: 2px solid var(--bg-card-border);
  border-radius: 4px;
  margin-top: 2px;
  transition: border-color var(--transition), background var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.choice.selected .checkbox {
  border-color: var(--accent);
  background: var(--accent);
}
.choice.selected .checkbox::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid var(--bg);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}

.choice.revealed-correct .checkbox {
  border-color: var(--correct);
  background: var(--correct);
}
.choice.revealed-correct .checkbox::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg) translate(-1px, -1px);
}
.choice.revealed-incorrect .checkbox {
  border-color: var(--incorrect);
  background: var(--incorrect);
}
.choice.revealed-incorrect .checkbox::after {
  content: '\\00d7';
  color: #fff;
  font-size: 16px;
  line-height: 1;
  border: none;
  transform: none;
}

.choice-text {
  font-size: 0.95rem;
  line-height: 1.5;
  flex: 1;
  min-width: 0;
}
.choice-text code:not([class*="language-"]) {
  font-size: 0.85em;
}
.choice-text pre[class*="language-"] {
  margin: 0.5rem 0 0 !important;
}

/* Answer reveal */
.answer-reveal {
  border-top: 1px solid var(--bg-card-border);
  padding-top: 1.5rem;
  margin-bottom: 2rem;
  animation: fadeUp 0.4s ease both;
}
.answer-reveal .label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--accent);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}
.answer-reveal .prose {
  color: var(--text);
  font-size: 0.95rem;
  line-height: 1.7;
}
.answer-reveal .prose p {
  margin-bottom: 0.75rem;
}
.answer-reveal .prose p:last-child {
  margin-bottom: 0;
}

/* Result banner */
.result-banner {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  animation: fadeUp 0.3s ease both;
}
.result-banner.correct {
  color: var(--correct);
  background: var(--correct-bg);
  border: 1px solid var(--correct);
}
.result-banner.incorrect {
  color: var(--incorrect);
  background: var(--incorrect-bg);
  border: 1px solid var(--incorrect);
}

/* Buttons */
.btn-row {
  display: flex;
  gap: 1rem;
}
button {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  padding: 0.7rem 1.8rem;
  border: 1px solid var(--accent);
  border-radius: 4px;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
  transition: background var(--transition), color var(--transition);
}
button:hover {
  background: var(--accent);
  color: var(--bg);
}
button:disabled {
  opacity: 0.3;
  pointer-events: none;
}

/* Final score */
.final {
  text-align: center;
  animation: fadeUp 0.6s ease both;
}
.final .score {
  font-family: var(--font-body);
  font-size: 5rem;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  margin-bottom: 0.5rem;
}
.final .subtitle {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  margin-bottom: 3rem;
}
.final h2 {
  font-family: var(--font-body);
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text-heading);
  margin-bottom: 1.5rem;
}

.summary-list {
  text-align: left;
  max-width: 540px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.summary-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--bg-card-border);
  border-radius: 6px;
  background: var(--bg-card);
  font-size: 0.95rem;
  animation: fadeUp 0.4s ease both;
}
.summary-item .icon {
  font-size: 1.1rem;
  min-width: 1.4rem;
  text-align: center;
}
.summary-item.correct .icon { color: var(--correct); }
.summary-item.incorrect .icon { color: var(--incorrect); }
.summary-item .q-num {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-dim);
  min-width: 2rem;
}

/* Start screen */
.start {
  text-align: center;
  animation: fadeUp 0.6s ease both;
}
.start h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
.start .meta {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-dim);
  letter-spacing: 0.1em;
  margin-bottom: 2.5rem;
}

/* Restart */
.restart-row {
  margin-top: 2.5rem;
}
`;

const JS = `
(function() {
  const app = document.getElementById('app');
  const bar = document.getElementById('progress-bar');
  let current = -1;
  let results = [];
  let checked = false;

  // Render markdown subset: fenced code blocks, inline code, paragraphs
  function md(raw) {
    // HTML-escape first
    var s = esc(raw);
    // Fenced code blocks: \`\`\`lang\\n...\\n\`\`\`
    s = s.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, function(_, lang, code) {
      var cls = lang ? 'language-' + lang : 'language-none';
      return '<pre class="' + cls + '"><code class="' + cls + '">' + code.replace(/\\n$/, '') + '</code></pre>';
    });
    // Inline code
    s = s.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
    // Split into paragraphs (skip if already contains block elements)
    if (s.indexOf('<pre') === -1) {
      s = s.split(/\\n\\n+/).map(function(p) {
        p = p.trim();
        return p ? '<p>' + p + '</p>' : '';
      }).join('');
    } else {
      // Mixed content: wrap non-pre sections in <p>
      s = s.replace(/(^|<\\/pre>)([\\s\\S]*?)($|<pre)/g, function(_, before, text, after) {
        var trimmed = text.trim();
        if (!trimmed) return before + after;
        var paras = trimmed.split(/\\n\\n+/).map(function(p) {
          p = p.trim();
          return p ? '<p>' + p + '</p>' : '';
        }).join('');
        return before + paras + after;
      });
    }
    // Clean up stray newlines within paragraphs
    s = s.replace(/<p>([\\s\\S]*?)<\\/p>/g, function(_, inner) {
      return '<p>' + inner.replace(/\\n/g, ' ') + '</p>';
    });
    return s;
  }

  // Render inline markdown only (for choices — no block code)
  function mdInline(raw) {
    var s = esc(raw);
    // Fenced code blocks in choices
    s = s.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g, function(_, lang, code) {
      var cls = lang ? 'language-' + lang : 'language-none';
      return '<pre class="' + cls + '"><code class="' + cls + '">' + code.replace(/\\n$/, '') + '</code></pre>';
    });
    // Inline code
    s = s.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
    return s;
  }

  function highlight() {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAllUnder(app);
    }
  }

  function render() {
    if (current === -1) return renderStart();
    if (current >= QUIZ.questions.length) return renderFinal();
    renderQuestion();
  }

  function updateProgress() {
    const total = QUIZ.questions.length;
    const answered = results.length;
    const pct = total > 0 ? (answered / total) * 100 : 0;
    bar.style.width = pct + '%';
  }

  function renderStart() {
    updateProgress();
    app.innerHTML =
      '<div class="card start">' +
        '<h1>' + esc(QUIZ.title) + '</h1>' +
        '<div class="meta">' + QUIZ.questions.length + ' QUESTION' + (QUIZ.questions.length !== 1 ? 'S' : '') + '</div>' +
        '<div class="btn-row" style="justify-content:center">' +
          '<button id="start-btn">BEGIN</button>' +
        '</div>' +
      '</div>';
    document.getElementById('start-btn').addEventListener('click', function() {
      current = 0;
      render();
    });
  }

  function renderQuestion() {
    updateProgress();
    const q = QUIZ.questions[current];
    const idx = current;
    checked = false;

    let tallyHTML = '';
    if (results.length > 0) {
      const correct = results.filter(function(r) { return r; }).length;
      tallyHTML = '<div class="tally"><span>' + correct + '</span> / ' + results.length + ' correct</div>';
    }

    let choicesHTML = q.choices.map(function(c, i) {
      return '<div class="choice" data-idx="' + i + '">' +
        '<div class="checkbox"></div>' +
        '<div class="choice-text">' + mdInline(c.text) + '</div>' +
      '</div>';
    }).join('');

    app.innerHTML = tallyHTML +
      '<div class="card">' +
        '<div class="q-counter">QUESTION ' + (idx + 1) + ' / ' + QUIZ.questions.length + '</div>' +
        '<h1>' + mdInline(q.title) + '</h1>' +
        '<div class="choices" id="choices">' + choicesHTML + '</div>' +
        '<div id="result-area"></div>' +
        '<div class="btn-row">' +
          '<button id="check-btn" disabled>CHECK</button>' +
        '</div>' +
      '</div>';

    highlight();

    var selected = new Set();
    var choiceEls = document.querySelectorAll('.choice');
    var checkBtn = document.getElementById('check-btn');

    choiceEls.forEach(function(el) {
      el.addEventListener('click', function() {
        if (checked) return;
        var i = parseInt(el.getAttribute('data-idx'));
        if (selected.has(i)) {
          selected.delete(i);
          el.classList.remove('selected');
        } else {
          selected.add(i);
          el.classList.add('selected');
        }
        checkBtn.disabled = selected.size === 0;
      });
    });

    checkBtn.addEventListener('click', function() {
      if (checked) return;
      checked = true;

      var isCorrect = true;
      q.choices.forEach(function(c, i) {
        var el = choiceEls[i];
        el.classList.add('disabled');
        var wasSelected = selected.has(i);
        if (c.correct) {
          el.classList.remove('selected');
          el.classList.add('revealed-correct');
          if (!wasSelected) isCorrect = false;
        } else if (wasSelected) {
          el.classList.remove('selected');
          el.classList.add('revealed-incorrect');
          isCorrect = false;
        }
      });

      results.push(isCorrect);

      var resultArea = document.getElementById('result-area');
      var bannerClass = isCorrect ? 'correct' : 'incorrect';
      var bannerText = isCorrect ? 'CORRECT' : 'INCORRECT';
      var bannerIcon = isCorrect ? '\\u2713' : '\\u2717';

      var answerHTML = q.answer ?
        '<div class="answer-reveal">' +
          '<div class="label">EXPLANATION</div>' +
          '<div class="prose">' + md(q.answer) + '</div>' +
        '</div>' : '';

      resultArea.innerHTML =
        '<div class="result-banner ' + bannerClass + '">' +
          '<span>' + bannerIcon + '</span> ' + bannerText +
        '</div>' + answerHTML;

      highlight();

      checkBtn.style.display = 'none';
      var nextBtn = document.createElement('button');
      nextBtn.id = 'next-btn';
      nextBtn.textContent = current < QUIZ.questions.length - 1 ? 'NEXT' : 'RESULTS';
      checkBtn.parentNode.appendChild(nextBtn);

      nextBtn.addEventListener('click', function() {
        current++;
        render();
      });
    });
  }

  function renderFinal() {
    updateProgress();
    var correct = results.filter(function(r) { return r; }).length;
    var total = QUIZ.questions.length;
    var pct = Math.round((correct / total) * 100);

    var summaryHTML = QUIZ.questions.map(function(q, i) {
      var ok = results[i];
      var cls = ok ? 'correct' : 'incorrect';
      var icon = ok ? '\\u2713' : '\\u2717';
      return '<div class="summary-item ' + cls + '" style="animation-delay:' + (i * 0.06) + 's">' +
        '<span class="icon">' + icon + '</span>' +
        '<span class="q-num">' + (i + 1) + '.</span>' +
        '<span>' + esc(q.title) + '</span>' +
      '</div>';
    }).join('');

    app.innerHTML =
      '<div class="card final">' +
        '<div class="score">' + pct + '%</div>' +
        '<div class="subtitle">' + correct + ' OF ' + total + ' CORRECT</div>' +
        '<h2>' + esc(QUIZ.title) + '</h2>' +
        '<div class="summary-list">' + summaryHTML + '</div>' +
        '<div class="restart-row btn-row" style="justify-content:center">' +
          '<button id="restart-btn">RESTART</button>' +
        '</div>' +
      '</div>';

    document.getElementById('restart-btn').addEventListener('click', function() {
      current = -1;
      results = [];
      checked = false;
      render();
    });
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  render();
})();
`;
