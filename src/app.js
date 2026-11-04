(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const main = $('#main');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('aced.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('aced.' + k, JSON.stringify(v)); } catch { /* ignore */ } }
  };
  const DEFAULTS = { cogSeconds: 45, answerSeconds: 180, prepSeconds: 30, speak: true, record: true, showFeedback: true };
  const settings = Object.assign({}, DEFAULTS, store.get('settings', {}));
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
        ${slider('cogSeconds', 'Time per question', 15, 120, 5, settings.cogSeconds, (v) => v + ' s', 'Real screeners are fast. 30 to 45 seconds is a good target.')}
        ${toggle('showFeedback', 'Show the answer after each question', 'Turn off to simulate a real test, then review at the end.', settings.showFeedback)}</div>
      <div class="card"><h2>Data</h2><p class="hint">Scores and ratings are stored locally on this device only.</p><button class="btn danger" id="reset">Clear history</button></div></div>`;
    ['answerSeconds', 'prepSeconds', 'cogSeconds'].forEach((id) => {
      const el = $('#' + id), f = id === 'answerSeconds' ? mins : (v) => v + ' s';
      el.addEventListener('input', () => { settings[id] = +el.value; $('#' + id + '-v').textContent = f(+el.value); saveSettings(); });
    });
    ['speak', 'record', 'showFeedback'].forEach((id) => $('#' + id).addEventListener('change', (e) => { settings[id] = e.target.checked; saveSettings(); }));
    $('#reset').addEventListener('click', () => { if (confirm('Clear all saved scores and ratings?')) { store.set('cogHistory', []); store.set('ivCount', 0); store.set('ivRatings', {}); } });
  }

  /* ================= COGNITIVE ================= */
  const catList = () => [...new Set(window.COGNITIVE.map((q) => q.cat))];
  let cogSel = { cats: null, n: 20 };
  function shuffled(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function cogSetup() {
    if (!cogSel.cats) cogSel.cats = new Set(catList());
    const render = () => {
      const pool = window.COGNITIVE.filter((q) => cogSel.cats.has(q.cat));
      const n = Math.min(cogSel.n, pool.length) || 0;
      main.innerHTML = `<div class="wrap stack"><div><h1>Cognitive tests</h1><p class="lede">${window.COGNITIVE.length} questions across ${catList().length} areas. Each question is timed (${settings.cogSeconds} s, change it in Settings). Keys 1 to 5 pick answers.</p></div>
        <div class="card stack">
          <div class="field"><span class="lab">Areas</span><div class="chips">${catList().map((c) => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${cogSel.cats.has(c)}">${esc(c)} <small>${window.COGNITIVE.filter((q) => q.cat === c).length}</small></button>`).join('')}</div></div>
          <div class="field"><span class="lab">Questions</span><div class="chips">${[10, 20, 40, 9999].map((v) => `<button class="chip" data-n="${v}" aria-pressed="${cogSel.n === v}">${v === 9999 ? 'All (' + pool.length + ')' : v}</button>`).join('')}</div></div>
          <div class="row"><button class="btn primary lg" id="start" ${pool.length ? '' : 'disabled'}>Start ${n} questions</button><button class="btn" id="all">Select all areas</button></div>
        </div></div>`;
      main.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { const c = b.dataset.cat; cogSel.cats.has(c) ? cogSel.cats.delete(c) : cogSel.cats.add(c); render(); }));
      main.querySelectorAll('[data-n]').forEach((b) => b.addEventListener('click', () => { cogSel.n = +b.dataset.n; render(); }));
      $('#all').addEventListener('click', () => { cogSel.cats = new Set(catList()); render(); });
      $('#start').addEventListener('click', () => cogRun(shuffled(pool).slice(0, n)));
    };
    render();
  }

  function cogRun(qs) {
    const answers = [];
    let i = 0, timer = null, timeouts = [], keyHandler = null;
    const clearAll = () => { if (timer) timer.stop(); timeouts.forEach(clearTimeout); timeouts = []; if (keyHandler) document.removeEventListener('keydown', keyHandler); keyHandler = null; };
    cleanup = clearAll;

    function show() {
      clearAll();
      const q = qs[i];
      const base = `<div class="wrap"><div class="topbar"><div class="grow"><div class="cat">${esc(q.cat)} · ${i + 1} of ${qs.length}</div><div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${qs.length}" aria-valuenow="${i}"><i style="width:${(i / qs.length) * 100}%"></i></div></div>${ring(settings.cogSeconds)}</div><div class="qcardbig">`;
      const ringEl = () => $('.ring', main);
      const startTimer = (onEnd) => { timer = makeTimer(ringEl(), settings.cogSeconds, onEnd); };
      let resolved = false;
      const finish = (correct, chosen, timedOut) => {
        if (resolved) return; resolved = true;
        if (timer) timer.stop();
        answers[i] = { q, correct, chosen, timedOut };
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
        q.seq.forEach((k, step) => {
          timeouts.push(setTimeout(() => cells[k].classList.add('lit'), 600 + step * 800));
          timeouts.push(setTimeout(() => cells[k].classList.remove('lit'), 600 + step * 800 + 500));
        });
        timeouts.push(setTimeout(() => {
          cells.forEach((c) => (c.disabled = false));
          startTimer(() => finish(false, null, true));
          cells.forEach((c) => c.addEventListener('click', () => {
            if (resolved) return;
            const k = +c.dataset.k;
            if (k === q.seq[pos]) { c.classList.add('ok'); pos++; if (pos === q.seq.length) { cells.forEach((x) => (x.disabled = true)); finish(true); } }
            else { c.classList.add('no'); cells.forEach((x) => (x.disabled = true)); q.seq.forEach((s) => cells[s].classList.add('ok')); finish(false, k); }
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

    function results() {
      clearAll();
      const right = answers.filter((a) => a.correct).length, pct = Math.round((right / qs.length) * 100);
      const hist = store.get('cogHistory', []); hist.push({ t: Date.now(), pct, n: qs.length }); store.set('cogHistory', hist.slice(-50));
      const by = {};
      answers.forEach((a) => { const c = a.q.cat; by[c] = by[c] || [0, 0]; by[c][1]++; if (a.correct) by[c][0]++; });
      main.innerHTML = `<div class="wrap stack"><div><div class="cat">Results</div><div class="score">${pct}%</div><p class="lede">${right} of ${qs.length} correct.</p></div>
        <div class="card"><h2>By area</h2><table class="bd">${Object.entries(by).map(([c, [r, t]]) => `<tr><td>${esc(c)}</td><td>${r} / ${t}</td></tr>`).join('')}</table></div>
        <div class="card"><h2>Review</h2>${answers.map((a, k) => `<details class="rev"><summary><span>${a.correct ? '✓' : '✗'}</span><span>${k + 1}. ${esc(a.q.cat)}${a.timedOut ? ' (timed out)' : ''}</span></summary><p>${esc(a.q.prompt)}</p>${a.q.visual ? `<div class="visual">${a.q.visual}</div>` : ''}<p><b>Why:</b> ${esc(a.q.explain)}</p></details>`).join('')}</div>
        <div class="row"><button class="btn primary lg" id="again">New session</button><button class="btn lg" id="home">Home</button></div></div>`;
      $('#again').addEventListener('click', () => go('cognitive')); $('#home').addEventListener('click', () => go('home'));
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
    const killSpeech = () => { try { speechSynthesis.cancel(); } catch { /* ignore */ } };
    cleanup = () => { killSpeech(); if (timer) timer.stop(); timers.forEach(clearTimeout); if (recorder && recorder.state !== 'inactive') { recorder.ondataavailable = null; recorder.onstop = null; try { recorder.stop(); } catch { /* ignore */ } } if (stream) stream.getTracks().forEach((t) => t.stop()); };

    const avatar = `<div class="avatar"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" fill="#e7c9a9"/><circle cx="42" cy="52" r="5" fill="#222"/><circle cx="78" cy="52" r="5" fill="#222"/><path id="mouth" d="M40 78 Q60 86 80 78" stroke="#7a3b2e" stroke-width="5" fill="none" stroke-linecap="round"/></svg></div>`;

    function ask() {
      const q = qs[i];
      const clip = clips.length ? clips[i % clips.length] : null;
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
          const r = store.get('ivRatings', {}); if (rating) r[q.id] = rating; store.set('ivRatings', r);
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
      main.innerHTML = `<div class="wrap stack"><div><h1>Session complete</h1><p class="lede">${qs.length} questions answered. Review any take below, then run it again.</p></div>
        <div class="card">${takes.map((t, k) => `<details class="rev"><summary><span>${k + 1}.</span><span>${esc(t.q.text)}</span></summary>${t.url ? `<video class="playback" controls src="${t.url}"></video>` : ''}<div class="tip">${esc(t.q.tip)}</div></details>`).join('')}</div>
        <div class="row"><button class="btn primary lg" id="again">New session</button><button class="btn lg" id="home">Home</button></div></div>`;
      $('#again').addEventListener('click', () => go('interview')); $('#home').addEventListener('click', () => go('home'));
    }
    ask();
  }

  go('home');
})();
