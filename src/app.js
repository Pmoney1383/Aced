(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const main = $('#main');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('aced.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('aced.' + k, JSON.stringify(v)); } catch { /* ignore */ } }
  };
  const DEFAULTS = { cogSeconds: 30, cogCount: 25, answerSeconds: 180, prepSeconds: 30, speak: true, record: true, showFeedback: false };
  const settings = Object.assign({}, DEFAULTS, store.get('settings', {}));
  if (store.get('settingsV', 0) < 2) { settings.cogSeconds = DEFAULTS.cogSeconds; settings.cogCount = DEFAULTS.cogCount; settings.showFeedback = false; store.set('settingsV', 2); store.set('settings', settings); }
  const saveSettings = () => store.set('settings', settings);

  const ICONS = {
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
    brain: '<path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 1V4a3 3 0 00-3 0zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 1"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    code: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'
  };
  const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;
  document.querySelectorAll('[data-ic]').forEach((el) => { el.innerHTML = icon(el.dataset.ic); });

  /* ---------- router ---------- */
  let cleanup = null;
  let route = 'home';
  function go(r) {
    if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
    route = r;
    document.querySelectorAll('.nav').forEach((b) => (b.dataset.route === r ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
    main.scrollTop = 0;
    ({ home, cognitive: cogSetup, interview: ivSetup, technical, settings: settingsView }[r] || home)();
    main.focus({ preventScroll: true });
  }
  document.querySelectorAll('.nav').forEach((b) => b.addEventListener('click', () => go(b.dataset.route)));
  if (window.aced) window.aced.onNavigate(go);

  function ring(total, big) {
    const r = 23, c = 2 * Math.PI * r;
    return `<div class="ring${big ? ' big' : ''}" role="timer" aria-label="Time remaining"><svg viewBox="0 0 56 56"><circle class="bg" cx="28" cy="28" r="${r}"/><circle class="fg" cx="28" cy="28" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="0"/></svg><span>${fmt(total)}</span></div>`;
  }
  const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function makeTimer(el, seconds, onEnd) {
    const c = 2 * Math.PI * 23, label = $('span', el), fg = $('.fg', el), end = Date.now() + seconds * 1000;
    let stopped = false, id;
    const tick = () => {
      const left = Math.max(0, (end - Date.now()) / 1000);
      label.textContent = fmt(left);
      fg.style.strokeDashoffset = String(c * (1 - left / seconds));
      el.classList.toggle('low', left <= 10);
      if (left <= 0) { stop(); onEnd(); }
    };
    const stop = () => { stopped = true; clearInterval(id); };
    id = setInterval(() => !stopped && tick(), 250);
    return { stop, elapsed: () => seconds - Math.max(0, (end - Date.now()) / 1000) };
  }

  /* ---------- home ---------- */
  function home() {
    const hist = store.get('cogHistory', []);
    const iv = store.get('ivCount', 0);
    const G = '<svg viewBox="0 0 52 52" aria-hidden="true">';
    const glyphs = G + '<circle cx="26" cy="26" r="22" fill="var(--accent)"/></svg>' + G + '<rect x="5" y="5" width="42" height="42" rx="8" fill="var(--signal)"/></svg>' + G + '<polygon points="26,4 49,47 3,47" fill="var(--sun)" stroke-linejoin="round"/></svg>' + G + '<polygon points="26,2 50,26 26,50 2,26" fill="var(--mint)"/></svg>';
    const artCog = '<svg viewBox="0 0 120 96" aria-hidden="true"><circle cx="30" cy="26" r="20" fill="#fff"/><rect x="62" y="6" width="40" height="40" rx="8" fill="var(--sun)"/><polygon points="30,52 52,92 8,92" fill="var(--mint)"/><polygon points="82,50 104,71 82,92 60,71" fill="#fff" opacity=".55"/></svg>';
    const artVid = '<svg viewBox="0 0 120 96" aria-hidden="true"><rect x="8" y="16" width="76" height="64" rx="16" fill="#fff"/><polygon points="92,38 114,24 114,72 92,58" fill="#fff"/><circle cx="46" cy="48" r="14" fill="var(--signal)"/></svg>';
    const artTech = '<svg viewBox="0 0 120 96" aria-hidden="true"><path d="M40 20 L14 48 L40 76 M80 20 L106 48 L80 76" fill="none" stroke="var(--ink2)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    main.innerHTML = `<div class="wrap">
      <div class="hero"><div><h1>Practice the way<br>they <em>test.</em></h1>
      <p class="lede" style="margin:0">Timed cognitive puzzles and recorded video answers, built from what candidates report in modern screening rounds.</p></div><div class="glyphs">${glyphs}</div></div>
      <div class="cards">
        <button class="tile" data-go="cognitive"><div class="art">${artCog}</div><div class="body"><h2>Cognitive tests</h2><p>${window.COGNITIVE.length} timed questions with visuals: patterns, series, memory, error checking, logic.</p><span class="meta">${hist.length ? 'Last score ' + hist[hist.length - 1].pct + '% · ' + hist.length + ' sessions' : 'No sessions yet'}</span></div></button>
        <button class="tile t2" data-go="interview"><div class="art">${artVid}</div><div class="body"><h2>Video interview</h2><p>${window.INTERVIEW.length} questions from an on-screen interviewer. Prep, then record 2 to 5 minutes.</p><span class="meta">${iv} answers recorded</span></div></button>
        <button class="tile t3 off" data-go="technical"><div class="art">${artTech}</div><div class="body"><h2>Technical</h2><p>Coding and systems questions.</p><span class="meta">Coming soon</span></div></button>
      </div></div>`;
    main.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => go(b.dataset.go)));
  }
  function technical() {
    main.innerHTML = `<div class="wrap"><h1>Technical questions</h1><div class="soon"><div><h2>Coming soon</h2><p>This section is next on the list.</p></div></div></div>`;
  }

  /* ---------- settings ---------- */
  function settingsView() {
    const slider = (id, label, min, max, step, val, fmtFn, hint) => `<div class="field"><div class="row"><label for="${id}">${label}</label><span class="val" id="${id}-v">${fmtFn(val)}</span></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><div class="hint">${hint}</div></div>`;
    const toggle = (id, label, hint, v) => `<label class="toggle"><span><b>${label}</b><br><span class="hint">${hint}</span></span><input type="checkbox" id="${id}" ${v ? 'checked' : ''}></label>`;
    const mins = (s) => (s % 60 === 0 ? s / 60 + ' min' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s');
    main.innerHTML = `<div class="wrap stack"><div><h1>Settings</h1><p class="lede">Changes save automatically.</p></div>
      <div class="card stack"><h2>Video interview</h2>
        ${slider('answerSeconds', 'Answer time', 120, 300, 15, settings.answerSeconds, mins, 'Real one-way interviews usually allow 2 to 3 minutes. Practise at the top end.')}
        ${slider('prepSeconds', 'Preparation time', 0, 120, 5, settings.prepSeconds, (v) => v + ' s', 'Thinking time before recording begins. Set to 0 to start recording immediately.')}
        ${toggle('speak', 'Interviewer reads questions aloud', 'Uses your system voice while the interviewer clip plays.', settings.speak)}
        ${toggle('record', 'Record my camera and microphone', 'Stays on this computer. Lets you watch your answer back.', settings.record)}</div>
      <div class="card stack"><h2>Cognitive tests</h2>
        ${slider('cogCount', 'Questions per test', 5, 60, 5, settings.cogCount, (v) => v + '', 'Default 25.')}
        ${slider('cogSeconds', 'Time per question', 10, 120, 5, settings.cogSeconds, (v) => v + ' s', 'Real screeners are fast. Default 30 s.')}
        ${toggle('showFeedback', 'Show the answer after each question', 'Off by default: you are graded at the end, like a real test.', settings.showFeedback)}</div>
      <div class="card"><h2>Data</h2><p class="hint">Scores and ratings are stored locally on this device only.</p><button class="btn danger" id="reset">Clear history</button></div></div>`;
    ['answerSeconds', 'prepSeconds', 'cogSeconds', 'cogCount'].forEach((id) => {
      const el = $('#' + id), f = id === 'answerSeconds' ? mins : id === 'cogCount' ? (v) => String(v) : (v) => v + ' s';
      el.addEventListener('input', () => { settings[id] = +el.value; $('#' + id + '-v').textContent = f(+el.value); saveSettings(); });
    });
    ['speak', 'record', 'showFeedback'].forEach((id) => $('#' + id).addEventListener('change', (e) => { settings[id] = e.target.checked; saveSettings(); }));
    $('#reset').addEventListener('click', () => { if (confirm('Clear all saved scores and ratings?')) { store.set('cogHistory', []); store.set('ivCount', 0); store.set('ivRatings', {}); } });
  }

  /* ================= COGNITIVE ================= */
  const catList = () => [...new Set(window.COGNITIVE.map((q) => q.cat))];
  let cogSel = { cats: null };
  function shuffled(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // balanced pick: round-robin across areas so every test mixes puzzle types
  const qSig = (q) => (q.type ? q.type + (q.seq || q.digits) : q.prompt + '|' + (q.visual || '') + '|' + (q.options || []).slice().sort().join('/'));
  function pickBalanced(pool, n) {
    const by = {}, seen = new Set();
    shuffled(pool).forEach((q) => { const k = qSig(q); if (seen.has(k)) return; seen.add(k); (by[q.cat] = by[q.cat] || []).push(q); });
    const lists = shuffled(Object.values(by)), out = [];
    while (out.length < n && lists.some((l) => l.length)) lists.forEach((l) => { if (l.length && out.length < n) out.push(l.shift()); });
    return shuffled(out);
  }
  const secs = (v) => (v >= 60 ? Math.floor(v / 60) + ' min' + (v % 60 ? ' ' + (v % 60) + ' s' : '') : v + ' s');

  function cogSetup() {
    if (!cogSel.cats) cogSel.cats = new Set();
    const hist = store.get('cogHistory', []);
    const render = () => {
      const pool = cogSel.cats.size ? window.COGNITIVE.filter((q) => cogSel.cats.has(q.cat)) : window.COGNITIVE;
      const n = Math.min(settings.cogCount, pool.length);
      main.innerHTML = `<div class="wrap stack"><div><h1>Cognitive tests</h1><p class="lede">A timed set of mixed puzzles. Nothing is revealed while you test; when the last question is done you get a grade, feedback and a full review. Keys 1 to 5 pick answers.</p></div>
        <div class="card stack">
          <div class="field"><div class="row"><label for="cnt">Number of questions</label><span class="val" id="cnt-v">${n}</span></div><input type="range" id="cnt" min="5" max="60" step="5" value="${settings.cogCount}"><div class="hint">Default 25.</div></div>
          <div class="field"><div class="row"><label for="tm">Time per question</label><span class="val" id="tm-v">${secs(settings.cogSeconds)}</span></div><input type="range" id="tm" min="10" max="120" step="5" value="${settings.cogSeconds}"><div class="hint">Short on purpose. Default 30 s. Memory questions start the clock after the sequence is shown.</div></div>
          <div class="field"><span class="lab">Focus on (optional)</span><div class="chips">${catList().map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${cogSel.cats.has(c)}">${esc(c)} <small>${window.COGNITIVE.filter((q) => q.cat === c).length}</small></button>`).join('')}</div><div class="hint">${cogSel.cats.size ? 'Only the selected areas.' : 'None selected: a balanced mix of every area.'}</div></div>
          <div class="row"><button class="btn primary lg" id="start">Start test (${n} questions · ${secs(settings.cogSeconds)} each)</button>${cogSel.cats.size ? '<button class="btn" id="all">Clear focus</button>' : ''}</div>
        </div>
        ${hist.length ? `<div class="card"><h2>Recent sessions</h2><table class="bd">${hist.slice(-5).reverse().map((h) => `<tr><td>${new Date(h.t).toLocaleString()}</td><td>${h.pct}% · ${h.n} q</td></tr>`).join('')}</table></div>` : ''}
        <div class="row"><button class="btn" id="open">Open saved results folder</button></div></div>`;
      $('#cnt').addEventListener('input', (e) => { settings.cogCount = +e.target.value; saveSettings(); const nn = Math.min(settings.cogCount, pool.length); $('#cnt-v').textContent = nn; $('#start').textContent = `Start test (${nn} questions · ${secs(settings.cogSeconds)} each)`; });
      $('#tm').addEventListener('input', (e) => { settings.cogSeconds = +e.target.value; saveSettings(); $('#tm-v').textContent = secs(settings.cogSeconds); $('#start').textContent = `Start test (${Math.min(settings.cogCount, pool.length)} questions · ${secs(settings.cogSeconds)} each)`; });
      main.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { const c = b.dataset.cat; cogSel.cats.has(c) ? cogSel.cats.delete(c) : cogSel.cats.add(c); render(); }));
      if ($('#all')) $('#all').addEventListener('click', () => { cogSel.cats = new Set(); render(); });
      $('#open').addEventListener('click', () => window.aced && window.aced.openResults());
      $('#start').addEventListener('click', () => cogRun(pickBalanced(pool, n)));
    };
    render();
  }

  function cogRun(qs) {
    const answers = [], startedAt = new Date().toISOString();
    let i = 0, timer = null, timeouts = [], keyHandler = null;
    const clearAll = () => { if (timer) timer.stop(); timeouts.forEach(clearTimeout); timeouts = []; if (keyHandler) document.removeEventListener('keydown', keyHandler); keyHandler = null; };
    cleanup = clearAll;

    function show() {
      clearAll();
      const q = qs[i];
      const base = `<div class="wrap"><div class="topbar"><div class="grow"><div class="cat">${esc(q.cat)} · ${i + 1} of ${qs.length}</div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${i}"><i style="width:${(i / qs.length) * 100}%"></i></div></div>${ring(settings.cogSeconds)}</div><div class="qcardbig">`;
      const ringEl = () => $('.ring', main);
      let t0 = Date.now();
      const startTimer = (onEnd) => { t0 = Date.now(); timer = makeTimer(ringEl(), settings.cogSeconds, onEnd); };
      let resolved = false;
      const finish = (correct, chosen, timedOut) => {
        if (resolved) return; resolved = true;
        if (timer) timer.stop();
        answers[i] = { q, correct, chosen, timedOut, secs: Math.round((Date.now() - t0) / 100) / 10 };
        if (keyHandler) document.removeEventListener('keydown', keyHandler);
        if (!settings.showFeedback) return next();
        const fb = document.createElement('div'); fb.className = 'feedback'; fb.setAttribute('role', 'status');
        fb.innerHTML = `<b class="${correct ? 'ok' : 'bad'}">${timedOut ? "Time's up." : correct ? 'Correct.' : 'Not quite.'}</b> ${esc(q.explain)}<div class="row" style="margin-top:12px"><button class="btn primary" id="next">${i + 1 === qs.length ? 'See results' : 'Next question'}</button></div>`;
        $('.qcardbig', main).appendChild(fb);
        const btn = $('#next'); btn.focus(); btn.addEventListener('click', next);
      };
      const next = () => { i++; i < qs.length ? show() : results(); };

      if (q.type === 'grid') {
        main.innerHTML = base + `<div class="prompt">${esc(q.prompt)}</div><div class="visual"><div class="mem" id="mem">${Array.from({ length: 9 }, (_, k) => `<button data-k="${k}" disabled aria-label="Square ${k + 1}">${k + 1}</button>`).join('')}</div></div></div></div>`;
        const cells = [...main.querySelectorAll('#mem button')];
        $('.ring span', main).textContent = 'Watch';
        let pos = 0;
        const taps = [];
        q.seq.forEach((k, step) => {
          timeouts.push(setTimeout(() => cells[k].classList.add('lit'), 600 + step * 800));
          timeouts.push(setTimeout(() => cells[k].classList.remove('lit'), 600 + step * 800 + 500));
        });
        timeouts.push(setTimeout(() => {
          cells.forEach((c) => (c.disabled = false));
          startTimer(() => finish(false, taps.length ? taps : null, true));
          cells.forEach((c) => c.addEventListener('click', () => {
            if (resolved) return;
            const k = +c.dataset.k;
            if (k === q.seq[pos]) { c.classList.add('ok'); pos++; if (pos === q.seq.length) { cells.forEach((x) => (x.disabled = true)); finish(true, taps.concat(k)); } }
            else { c.classList.add('no'); cells.forEach((x) => (x.disabled = true)); q.seq.forEach((s) => cells[s].classList.add('ok')); finish(false, taps.concat(k)); }
            if (!resolved) taps.push(k);
          }));
        }, 600 + q.seq.length * 800 + 300));
        return;
      }
      if (q.type === 'digits') {
        main.innerHTML = base + `<div class="prompt">${esc(q.prompt)}</div><div class="visual"><div class="digits" id="dg">${q.digits.split('').join(' ')}</div></div><form class="row" id="form" autocomplete="off"><input type="text" id="ans" inputmode="numeric" maxlength="${q.digits.length}" aria-label="Your answer" disabled style="width:240px;font:700 22px var(--mono);letter-spacing:.2em"><button class="btn primary" disabled>Submit</button></form></div></div>`;
        $('.ring span', main).textContent = 'Watch';
        timeouts.push(setTimeout(() => {
          $('#dg').textContent = '• • • • •'.slice(0, q.digits.length * 2 - 1);
          const input = $('#ans'), btn = $('#form button'); input.disabled = false; btn.disabled = false; input.focus();
          startTimer(() => finish(false, null, true));
          $('#form').addEventListener('submit', (e) => {
            e.preventDefault(); if (resolved) return;
            const want = q.reverse ? q.digits.split('').reverse().join('') : q.digits;
            input.disabled = true; btn.disabled = true; $('#dg').textContent = q.digits.split('').join(' ');
            finish(input.value.replace(/\D/g, '') === want, input.value);
          });
        }, 1500 + q.digits.length * 700));
        return;
      }
      main.innerHTML = base + `<div class="prompt">${esc(q.prompt)}</div>${q.visual ? `<div class="visual">${q.visual}</div>` : ''}<div class="options" role="group" aria-label="Answers">${q.options.map((o, k) => `<button class="opt${q.optionsSvg ? ' svgopt' : ''}" data-k="${k}"><span class="key">${k + 1}</span>${q.optionsSvg ? q.optionsSvg[k] : ''}<span>${esc(o)}</span></button>`).join('')}</div></div></div>`;
      const opts = [...main.querySelectorAll('.opt')];
      const choose = (k) => {
        if (resolved) return;
        opts.forEach((o) => (o.disabled = true));
        opts[q.answer].classList.add('correct'); if (k !== q.answer) opts[k].classList.add('wrong');
        finish(k === q.answer, k);
      };
      opts.forEach((o) => o.addEventListener('click', () => choose(+o.dataset.k)));
      keyHandler = (e) => { const k = parseInt(e.key, 10) - 1; if (k >= 0 && k < opts.length) choose(k); else if (e.key === 'Enter' && $('#next')) $('#next').click(); };
      document.addEventListener('keydown', keyHandler);
      startTimer(() => { opts.forEach((o) => (o.disabled = true)); opts[q.answer].classList.add('correct'); finish(false, null, true); });
    }

    const TIPS = {
      'Number Series': 'Write the differences between terms first; if they are not constant, check ratios, squares and alternating patterns.',
      'Matrix Patterns': 'Read each row, then each column, tracking one attribute at a time (shape, count, size, fill).',
      'Spatial Reasoning': 'Pick one distinctive feature of the shape and follow it around instead of rotating the whole thing in your head.',
      'Error Checking': 'Compare in chunks of 2 to 3 characters from the left, and watch swapped neighbours and look-alikes (O/0, 1/I).',
      'Data Interpretation': 'Read the question before the chart, note the exact bars needed, and do the arithmetic on paper.',
      'Memory': 'Chunk the sequence into shapes (an L, a Z) or digit groups; rehearse silently while it plays.',
      'Verbal Reasoning': 'Name the relationship in a full sentence first (A is a part of B), then test each option against it.',
      'Numerical Reasoning': 'Convert to unit rates or percentages as a first step and sanity check your result against the options.',
      'Logic': 'Sketch the statements as arrows or Venn circles; only choose conclusions that MUST follow.'
    };
    const stripVisual = (q) => {
      if (!q.visual) return null;
      if (q.visual.includes('<svg')) { const t = [...q.visual.matchAll(/>([^<>]+)<\/text>/g)].map((m) => m[1]).join(' '); return `[${q.cat} image] ${t}`.trim() + ` (rebuild from questionId ${q.id} in data/cognitive.js)`; }
      return q.visual.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    };
    const yourText = (a) => {
      const q = a.q;
      if (q.type === 'grid') return a.chosen ? 'tapped squares ' + a.chosen.map((x) => x + 1).join(' → ') : 'no answer';
      if (q.type === 'digits') return a.chosen ? String(a.chosen) : 'no answer';
      return a.chosen != null ? q.options[a.chosen] : 'no answer';
    };
    const rightText = (q) => (q.type === 'grid' ? q.seq.map((x) => x + 1).join(' → ') : q.type === 'digits' ? (q.reverse ? q.digits.split('').reverse().join('') : q.digits) : q.options[q.answer]);
    const gradeOf = (p) => (p >= 90 ? 'A' : p >= 80 ? 'B' : p >= 70 ? 'C' : p >= 60 ? 'D' : 'F');

    function results() {
      clearAll();
      const n = qs.length, right = answers.filter((a) => a.correct).length, pct = Math.round((right / n) * 100), grade = gradeOf(pct);
      const by = {};
      answers.forEach((a) => { const c = a.q.cat; const r = (by[c] = by[c] || { right: 0, total: 0, secs: 0, timedOut: 0 }); r.total++; r.secs += a.secs || 0; if (a.correct) r.right++; if (a.timedOut) r.timedOut++; });
      const timedOut = answers.filter((a) => a.timedOut).length;
      const avg = Math.round((answers.reduce((t, a) => t + (a.secs || 0), 0) / n) * 10) / 10;
      const areas = Object.entries(by).map(([c, r]) => ({ c, acc: r.right / r.total, ...r, avg: r.secs / r.total }));
      const strong = areas.filter((a) => a.total >= 2).sort((x, y) => y.acc - x.acc).filter((a) => a.acc >= 0.7).slice(0, 2);
      const weak = areas.filter((a) => a.total >= 2 && a.acc < 0.7).sort((x, y) => x.acc - y.acc).slice(0, 3);
      const fb = [];
      fb.push(pct >= 90 ? 'Excellent: this is comfortably in screening-pass territory.' : pct >= 75 ? 'Solid. A few slips separate you from a top score.' : pct >= 60 ? 'Borderline. Targeted practice on your weakest areas will move this fast.' : 'Below where you want to be. Work through the review below, then retry a shorter test on your weak areas.');
      if (strong.length) fb.push('Strongest: ' + strong.map((a) => `${a.c} (${a.right}/${a.total})`).join(', ') + '.');
      weak.forEach((a) => fb.push(`Work on ${a.c} (${a.right}/${a.total}). ${TIPS[a.c] || ''}`));
      if (timedOut) fb.push(`${timedOut} question${timedOut > 1 ? 's' : ''} timed out. When the clock is under 10 s, pick your best guess; a blank scores zero.`);
      fb.push(`Average time per question: ${avg} s of ${settings.cogSeconds} s allowed.${avg > settings.cogSeconds * 0.8 ? ' You are using nearly all the time; practise skipping hard questions fast.' : avg < settings.cogSeconds * 0.3 ? ' You have time to spare; slow down and double check.' : ''}`);

      const session = {
        type: 'cognitive', startedAt, finishedAt: new Date().toISOString(),
        settings: { questions: n, secondsPerQuestion: settings.cogSeconds },
        score: { correct: right, total: n, percent: pct, grade, timedOut, avgSecondsPerQuestion: avg },
        byArea: Object.fromEntries(areas.map((a) => [a.c, { correct: a.right, total: a.total, avgSeconds: Math.round(a.avg * 10) / 10, timedOut: a.timedOut }])),
        feedback: fb,
        answers: answers.map((a, k) => ({ n: k + 1, questionId: a.q.id, area: a.q.cat, prompt: a.q.prompt, visual: stripVisual(a.q), options: a.q.options || null, yourAnswer: yourText(a), correctAnswer: rightText(a.q), correct: !!a.correct, timedOut: !!a.timedOut, secondsTaken: a.secs, explanation: a.q.explain }))
      };
      const hist = store.get('cogHistory', []); hist.push({ t: Date.now(), pct, n }); store.set('cogHistory', hist.slice(-50));
      const summaryText = `Aced cognitive test ${session.finishedAt}: ${right}/${n} (${pct}%, grade ${grade}). ` + 'Missed: ' + (session.answers.filter((x) => !x.correct).map((x) => `#${x.n} [${x.area}] ${x.prompt} ${x.visual ? '(' + x.visual + ') ' : ''}— I answered "${x.yourAnswer}", correct "${x.correctAnswer}"`).join(' | ') || 'none');

      main.innerHTML = `<div class="wrap stack"><div class="row" style="gap:28px;align-items:flex-end"><div><div class="cat">Graded</div><div class="score">${pct}%</div></div><div><div class="score" style="font-size:64px;color:var(--ink)">${grade}</div></div><p class="lede" style="margin:0">${right} of ${n} correct · ${timedOut} timed out</p></div>
        <div class="card"><h2>Feedback</h2><ul style="margin:0;padding-left:20px;display:grid;gap:8px">${fb.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>
        <div class="card"><h2>By area</h2><table class="bd">${areas.map((a) => `<tr><td>${esc(a.c)} <span class="pill">${Math.round(a.avg)} s avg</span></td><td>${a.right} / ${a.total}</td></tr>`).join('')}</table></div>
        <div class="card"><h2>Review every question</h2>${answers.map((a, k) => `<details class="rev"><summary><span>${a.correct ? '✓' : '✗'}</span><span>${k + 1}. ${esc(a.q.cat)}${a.timedOut ? ' (timed out)' : ''}</span></summary><p>${esc(a.q.prompt)}</p>${a.q.visual ? `<div class="visual">${a.q.visual}</div>` : ''}<p><b>You:</b> ${esc(yourText(a))}<br><b>Correct:</b> ${esc(rightText(a.q))}</p><p><b>Why:</b> ${esc(a.q.explain)}</p></details>`).join('')}</div>
        <div class="card"><h2>Your answers are saved</h2><p class="hint" id="saved">Saving…</p><div class="row"><button class="btn" id="copy">Copy summary to share with Claude</button><button class="btn" id="openf">Open results folder</button></div></div>
        <div class="row"><button class="btn primary lg" id="again">New test</button><button class="btn lg" id="home">Home</button></div></div>`;
      $('#again').addEventListener('click', () => go('cognitive')); $('#home').addEventListener('click', () => go('home'));
      let savedPath = '';
      if (window.aced) {
        window.aced.saveResult(session).then((r) => { savedPath = r.file; $('#saved').textContent = 'Saved to ' + r.file + ' (also latest-cognitive.json). Tell Claude "check my latest Aced results" and it can read them.'; }).catch(() => { $('#saved').textContent = 'Could not save results to disk.'; });
        $('#openf').addEventListener('click', () => window.aced.openResults());
      }
      $('#copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(summaryText + (savedPath ? ' Full file: ' + savedPath : '')); $('#copy').textContent = 'Copied'; } catch { $('#copy').textContent = 'Copy failed'; } });
    }
    show();
  }

  /* ================= INTERVIEW ================= */
  let ivSel = { cats: null, n: 5 };
  const ivCats = () => [...new Set(window.INTERVIEW.map((q) => q.cat))];
  const mins = (s) => (s % 60 === 0 ? s / 60 + ' min' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s');

  function ivSetup() {
    if (!ivSel.cats) ivSel.cats = new Set(ivCats());
    const render = () => {
      const pool = window.INTERVIEW.filter((q) => ivSel.cats.has(q.cat)), n = Math.min(ivSel.n, pool.length);
      main.innerHTML = `<div class="wrap stack"><div><h1>Video interview</h1><p class="lede">An interviewer asks a question. You get ${settings.prepSeconds} seconds to think, then ${mins(settings.answerSeconds)} to answer on camera. Change both in Settings.</p></div>
        <div class="card stack">
          <div class="field"><label for="len">Answer time <span class="val" id="len-v">${mins(settings.answerSeconds)}</span></label><input type="range" id="len" min="120" max="300" step="15" value="${settings.answerSeconds}"></div>
          <div class="field"><span class="lab">Question types</span><div class="chips">${ivCats().map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${ivSel.cats.has(c)}">${esc(c)} <small>${window.INTERVIEW.filter((q) => q.cat === c).length}</small></button>`).join('')}</div></div>
          <div class="field"><span class="lab">Questions in this session</span><div class="chips">${[3, 5, 8, 9999].map((v) => `<button class="chip" data-n="${v}" aria-pressed="${ivSel.n === v}">${v === 9999 ? 'All (' + pool.length + ')' : v}</button>`).join('')}</div></div>
          <div class="row"><button class="btn primary lg" id="start" ${pool.length ? '' : 'disabled'}>Start interview (${n})</button></div>
          <p class="hint">${settings.record ? 'Your camera and microphone will be used. Nothing leaves this computer.' : 'Recording is off. You will practise without playback (change in Settings).'}</p>
        </div></div>`;
      $('#len').addEventListener('input', (e) => { settings.answerSeconds = +e.target.value; $('#len-v').textContent = mins(settings.answerSeconds); saveSettings(); });
      main.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { const c = b.dataset.cat; ivSel.cats.has(c) ? ivSel.cats.delete(c) : ivSel.cats.add(c); render(); }));
      main.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => { ivSel.n = +b.dataset.n; render(); }));
      $('#start').addEventListener('click', () => ivRun(shuffled(pool).slice(0, n)));
    };
    render();
  }

  async function ivRun(qs) {
    let i = 0, stream = null, recorder = null, timer = null, timers = [];
    const takes = [];
    const clips = window.aced ? await window.aced.listInterviewers().catch(() => []) : [];
    if (settings.record && navigator.mediaDevices) {
      try { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); } catch { stream = null; }
    }
    const clipOffset = Math.floor(Math.random() * Math.max(1, clips.length));
    const killSpeech = () => { try { speechSynthesis.cancel(); } catch { /* ignore */ } };
    cleanup = () => { killSpeech(); if (timer) timer.stop(); timers.forEach(clearTimeout); if (recorder && recorder.state !== 'inactive') { recorder.ondataavailable = null; recorder.onstop = null; try { recorder.stop(); } catch { /* ignore */ } } if (stream) stream.getTracks().forEach((t) => t.stop()); };

    const avatar = `<div class="avatar"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="#e7c9a9"/><circle cx="42" cy="52" r="5" fill="#222"/><circle cx="78" cy="52" r="5" fill="#222"/><path id="mouth" d="M40 78 Q60 86 80 78" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/></svg></div>`;

    function ask() {
      const q = qs[i];
      const clip = clips.length ? clips[(i + clipOffset) % clips.length] : null;
      main.innerHTML = `<div class="wrap"><div class="topbar"><div class="grow"><div class="cat">${esc(q.cat)} · Question ${i + 1} of ${qs.length}</div><div class="progress"><i style="width:${(i / qs.length) * 100}%"></i></div></div></div>
        <div class="stage"><div class="screen" id="screen">${clip ? `<video id="vid" src="../assets/interviewers/${clip}" muted loop playsinline></video>` : avatar}${stream ? '<video id="cam" class="pip" muted autoplay playsinline></video>' : ''}<span class="tag" id="tag">Interviewer</span><div class="cap" id="cap">${esc(q.text)}</div></div>
        <div class="stack"><div class="qcard"><div class="row" style="justify-content:space-between"><b class="phase" id="phase">Listen to the question</b><div id="rwrap"></div></div><p id="msg" class="hint" style="margin:8px 0 0">The question is shown as captions.</p></div>
        <div class="row" id="actions"></div></div></div></div>`;
      const vid = $('#vid'), cam = $('#cam');
      if (cam) cam.srcObject = stream;
      const actions = $('#actions');
      let started = false;

      const beginPrep = () => {
        if (started) return; started = true;
        if (vid) { vid.pause(); vid.currentTime = 0; }
        $('#tag').textContent = 'Interviewer';
        if (settings.prepSeconds > 0) {
          $('#phase').textContent = 'Prepare your answer';
          $('#msg').textContent = 'Jot down two or three points in your head. Recording starts automatically.';
          $('#rwrap').innerHTML = ring(settings.prepSeconds, true);
          actions.innerHTML = '<button class="btn primary" id="go">Start recording now</button>';
          timer = makeTimer($('.ring', main), settings.prepSeconds, beginAnswer);
          $('#go').addEventListener('click', () => { timer.stop(); beginAnswer(); });
        } else beginAnswer();
      };
      let answering = false;
      function beginAnswer() {
        if (answering) return; answering = true;
        killSpeech();
        $('#phase').textContent = 'Your answer';
        $('#msg').textContent = q.tip ? 'Tip: ' + q.tip : '';
        $('#tag').textContent = 'You are on the record'; $('#tag').classList.toggle('rec', !!stream);
                $('#rwrap').innerHTML = ring(settings.answerSeconds, true);
        const chunks = [];
        if (stream) {
          try {
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
            recorder.onstop = () => { takes[i] = { q, url: URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })), seconds: Math.round(timer ? timer.elapsed() : 0) }; after(); };
            recorder.start();
          } catch { recorder = null; }
        }
        const done = () => { if (timer) timer.stop(); if (recorder && recorder.state !== 'inactive') recorder.stop(); else { takes[i] = { q, url: null, seconds: Math.round(timer.elapsed()) }; after(); } };
        timer = makeTimer($('.ring', main), settings.answerSeconds, done);
        actions.innerHTML = `<button class="btn primary" id="fin">Finish answer</button>`;
        $('#fin').addEventListener('click', done);
      }

      function after() {
        let rating = 0;
        const t = takes[i];
        main.innerHTML = `<div class="wrap stack"><div><div class="cat">Review · Question ${i + 1} of ${qs.length}</div><h1 style="font-size:22px">${esc(q.text)}</h1></div>
          <div class="stage"><div>${t.url ? `<video class="playback" controls src="${t.url}"></video>` : '<div class="card">No recording for this answer.</div>'}<p class="hint">You spoke for about ${mins(Math.max(1, t.seconds)).replace('0 min ', '')}.</p></div>
          <div class="stack"><div class="tip"><b>Coaching tip.</b> ${esc(q.tip)}</div><div class="field"><span class="lab">How did it go?</span><div class="stars" role="group" aria-label="Self rating">${[1, 2, 3, 4, 5].map((n) => `<button data-r="${n}" aria-pressed="false" aria-label="${n} out of 5">${n}</button>`).join('')}</div></div>
          <div class="row"><button class="btn primary lg" id="nx">${i + 1 === qs.length ? 'Finish' : 'Next question'}</button><button class="btn lg" id="retry">Retry this question</button></div></div></div></div>`;
        main.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => { rating = +b.dataset.r; main.querySelectorAll('[data-r]').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.r === rating))); }));
        $('#retry').addEventListener('click', () => { ask(); });
        $('#nx').addEventListener('click', () => {
          takes[i].rating = rating || null; const r = store.get('ivRatings', {}); if (rating) r[q.id] = rating; store.set('ivRatings', r);
          store.set('ivCount', store.get('ivCount', 0) + 1);
          i++; i < qs.length ? ask() : summary();
        });
      }

      // interviewer speaks, video plays during it
      const finishAsk = () => beginPrep();
      if (vid) vid.play().catch(() => {});
      $('#tag').textContent = 'Interviewer speaking';
      let spoke = false;
      if (settings.speak && 'speechSynthesis' in window) {
        try {
          killSpeech();
          const u = new SpeechSynthesisUtterance(q.text); u.rate = 0.95;
          u.onend = finishAsk; u.onerror = finishAsk; spoke = true;
          speechSynthesis.speak(u);
          timers.push(setTimeout(finishAsk, Math.max(8000, q.text.length * 120)));
        } catch { spoke = false; }
      }
      if (!spoke) { timers.push(setTimeout(finishAsk, Math.max(3000, q.text.length * 55))); }
      actions.innerHTML = '<button class="btn" id="skipq">Skip to prep</button>';
      $('#skipq').addEventListener('click', () => { killSpeech(); finishAsk(); });
    }

    function summary() {
      cleanup();
      if (window.aced) window.aced.saveResult({ type: 'interview', finishedAt: new Date().toISOString(), settings: { answerSeconds: settings.answerSeconds, prepSeconds: settings.prepSeconds }, answers: takes.map((t, k) => ({ n: k + 1, questionId: t.q.id, area: t.q.cat, question: t.q.text, secondsSpoken: t.seconds, selfRating: t.rating || null })) }).catch(() => {});
      main.innerHTML = `<div class="wrap stack"><div><h1>Session complete</h1><p class="lede">${qs.length} questions answered. Review any take below, then run it again.</p></div>
        <div class="card">${takes.map((t, k) => `<details class="rev"><summary><span>${k + 1}.</span><span>${esc(t.q.text)}</span></summary>${t.url ? `<video class="playback" controls src="${t.url}"></video>` : ''}<div class="tip">${esc(t.q.tip)}</div></details>`).join('')}</div>
        <div class="row"><button class="btn primary lg" id="again">New session</button><button class="btn lg" id="home">Home</button></div></div>`;
      $('#again').addEventListener('click', () => go('interview')); $('#home').addEventListener('click', () => go('home'));
    }
    ask();
  }

  /* ---------- custom title-bar menus ---------- */
  const A = (a) => () => window.aced && window.aced.action(a);
  const MENUS = {
    File: [['Settings…', 'Ctrl+,', () => go('settings')], '-', ['Quit', '', A('quit')]],
    Practice: [['Home', 'Ctrl+0', () => go('home')], ['Cognitive tests', 'Ctrl+1', () => go('cognitive')], ['Video interview', 'Ctrl+2', () => go('interview')], ['Technical questions', 'Ctrl+3', () => go('technical')]],
    Edit: [['Undo', 'Ctrl+Z', A('undo')], ['Redo', 'Ctrl+Y', A('redo')], '-', ['Cut', 'Ctrl+X', A('cut')], ['Copy', 'Ctrl+C', A('copy')], ['Paste', 'Ctrl+V', A('paste')], ['Select all', 'Ctrl+A', A('selectAll')]],
    View: [['Reload', 'Ctrl+R', A('reload')], ['Developer tools', 'Ctrl+Shift+I', A('devtools')], '-', ['Actual size', '', A('zoomReset')], ['Zoom in', 'Ctrl++', A('zoomIn')], ['Zoom out', 'Ctrl+-', A('zoomOut')], '-', ['Full screen', 'F11', A('fullscreen')]],
    Window: [['Minimize', '', A('minimize')], ['Maximize / Restore', '', A('maximize')], ['Close', 'Alt+F4', A('close')]]
  };
  (function buildMenus() {
    const bar = $('#menubar'); let open = null, dd = null;
    const close = () => { if (dd) dd.remove(); dd = null; if (open) open.setAttribute('aria-expanded', 'false'); open = null; };
    const show = (btn, name) => {
      close(); open = btn; btn.setAttribute('aria-expanded', 'true');
      dd = document.createElement('div'); dd.className = 'dropdown'; dd.setAttribute('role', 'menu'); dd.style.left = btn.getBoundingClientRect().left + 'px';
      MENUS[name].forEach((it) => {
        if (it === '-') { dd.appendChild(document.createElement('hr')); return; }
        const b = document.createElement('button'); b.setAttribute('role', 'menuitem');
        b.innerHTML = `<span>${it[0]}</span><kbd>${it[1]}</kbd>`;
        b.addEventListener('click', () => { close(); it[2](); }); dd.appendChild(b);
      });
      document.body.appendChild(dd); dd.querySelector('button').focus();
    };
    Object.keys(MENUS).forEach((name) => {
      const b = document.createElement('button'); b.className = 'tb-btn'; b.textContent = name; b.setAttribute('role', 'menuitem'); b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', () => (open === b ? close() : show(b, name)));
      b.addEventListener('mouseenter', () => { if (open && open !== b) show(b, name); });
      bar.appendChild(b);
    });
    document.addEventListener('mousedown', (e) => { if (dd && !dd.contains(e.target) && !bar.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => {
      if (!dd) return;
      const items = [...dd.querySelectorAll('button')], idx = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { const o = open; close(); o && o.focus(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const bs = [...bar.children], k = bs.indexOf(open), nb = bs[(k + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; show(nb, nb.textContent); }
    });
    window.addEventListener('blur', close);
  })();

  /* range sliders: paint the filled part */
  const syncRange = (el) => { const min = +el.min || 0, max = +el.max || 100; el.style.setProperty('--p', ((el.value - min) / (max - min)) * 100 + '%'); };
  const syncRanges = () => document.querySelectorAll('input[type=range]').forEach(syncRange);
  document.addEventListener('input', (e) => { if (e.target.type === 'range') syncRange(e.target); });
  new MutationObserver(syncRanges).observe(main, { childList: true, subtree: true });

  go('home');
})();
