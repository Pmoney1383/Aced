/* Cognitive practice bank. 120+ questions: part generated (seeded, so identical every run), part hand written.
   Modelled on the sections third-party reports describe for GeoComply-style screeners:
   puzzles / pattern reasoning, memory games, error-checking, plus numerical and verbal reasoning. */
(function (root) {
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const R = rng(20260601);
  const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
  const pick = (a) => a[Math.floor(R() * a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function withOptions(correct, wrongs) {
    const options = shuffle([correct, ...wrongs]);
    return { options, answer: options.findIndex((o) => String(o) === String(correct)) };
  }
  function numDistractors(c) {
    const set = new Set();
    const cands = shuffle([c + 1, c - 1, c + 2, c - 2, c + ri(3, 9), c - ri(3, 9), Math.round(c * 1.1), Math.round(c * 0.9), c + 10, c - 10]);
    for (const x of cands) { if (x !== c && !set.has(x) && (c < 0 || x >= 0)) set.add(x); if (set.size === 3) break; }
    return [...set];
  }

  const out = [];
  const add = (q) => out.push(q);

  /* ---------- 1. Number series (20, generated) ---------- */
  const HAND_SERIES = [[5, 11, 23, 47], [2, 5, 10, 17, 26], [96, 48, 24, 12], [4, 9, 16, 25], [1, 1, 2, 3, 5]].map((a) => a.join(','));
  const seenSeries = [];
  for (let n = 0, tries = 0; n < 20 && tries < 600; tries++) {
    const type = n % 8;
    let terms = [], ans, why;
    if (type === 0) { const a = ri(2, 30), d = ri(2, 9); terms = [0, 1, 2, 3, 4, 5].map((i) => a + d * i); ans = a + d * 6; why = `Each term adds ${d}.`; }
    else if (type === 1) { const a = ri(1, 4), r = ri(2, 3); terms = [0, 1, 2, 3, 4].map((i) => a * Math.pow(r, i)); ans = a * Math.pow(r, 5); why = `Each term is multiplied by ${r}.`; }
    else if (type === 2) { const k = ri(0, 5), s = ri(1, 4); terms = [0, 1, 2, 3, 4].map((i) => (s + i) * (s + i) + k); ans = (s + 5) * (s + 5) + k; why = `Square numbers (${s}², ${s + 1}², …)${k ? ' plus ' + k : ''}.`; }
    else if (type === 3) { let a = ri(1, 12), d = ri(1, 3); terms = [a]; for (let i = 0; i < 5; i++) { a += d + i; terms.push(a); } ans = a + d + 5; why = `The step grows by 1 each time (+${d}, +${d + 1}, +${d + 2}, …).`; }
    else if (type === 4) { const a = ri(1, 20), x = ri(2, 6), b = ri(30, 60), y = ri(2, 7); for (let i = 0; i < 7; i++) terms.push(i % 2 === 0 ? a + x * (i / 2) : b - y * ((i - 1) / 2)); ans = b - y * 3; why = `Two interleaved series: +${x} on odd positions, −${y} on even positions.`; }
    else if (type === 5) { const a = ri(1, 5), b = ri(2, 6); terms = [a, b]; for (let i = 0; i < 4; i++) terms.push(terms[i] + terms[i + 1]); ans = terms[4] + terms[5]; why = 'Each term is the sum of the previous two.'; }
    else if (type === 6) { let x = ri(2, 5); terms = [x]; for (let i = 0; i < 4; i++) { x = 2 * x - 1; terms.push(x); } ans = 2 * x - 1; why = 'Each term is double the previous term, minus 1.'; }
    else { const s = ri(2, 5), a = ri(2, 6); let x = s; terms = [x]; for (let i = 0; i < 5; i++) { x = i % 2 === 0 ? x + a : x * 2; terms.push(x); } ans = terms[5] * 2; why = `Operations alternate: +${a}, ×2, +${a}, ×2, …`; }
    const key = terms.join(',');
    if ([...HAND_SERIES, ...seenSeries].some((k) => k.startsWith(key) || key.startsWith(k))) continue;
    seenSeries.push(key); n++;
    const o = withOptions(ans, numDistractors(ans));
    add({ cat: 'Number Series', prompt: 'What number comes next in the series?', visual: `<div class="series">${terms.map((t) => `<span>${t}</span>`).join('')}<span class="q">?</span></div>`, options: o.options, answer: o.answer, explain: why });
  }

  /* ---------- 2. Matrix patterns (20, generated, SVG) ---------- */
  const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
  function shapeEl(shape, cx, cy, r, fill) {
    const a = `fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"`;
    if (shape === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${r}" ${a}/>`;
    if (shape === 'square') return `<rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}" ${a}/>`;
    if (shape === 'triangle') return `<polygon points="${cx},${cy - r} ${cx + r * 1.15},${cy + r * 0.9} ${cx - r * 1.15},${cy + r * 0.9}" ${a}/>`;
    return `<polygon points="${cx},${cy - r * 1.2} ${cx + r * 1.2},${cy} ${cx},${cy + r * 1.2} ${cx - r * 1.2},${cy}" ${a}/>`;
  }
  function cellSvg(c) {
    const xs = { 1: [45], 2: [29, 61], 3: [17, 45, 73] }[c.count];
    return xs.map((x) => shapeEl(c.shape, x, 45, c.size, c.fill)).join('');
  }
  const frame = (inner, x = 0, y = 0) => `<g transform="translate(${x} ${y})"><rect x="1" y="1" width="88" height="88" rx="8" class="cell"/>${inner}</g>`;
  const seenMatrix = new Set();
  for (let n = 0, tries = 0; n < 20 && tries < 600; tries++) {
    const mode = n % 2 === 0 ? 'count' : 'size';
    const checker = (n >> 1) % 2 === 0;
    const rev = (n >> 2) % 2 === 1;
    const shapes = shuffle(SHAPES).slice(0, 3);
    const spec = (r, c) => ({
      shape: shapes[r],
      count: mode === 'count' ? (rev ? 3 - c : c + 1) : 1,
      size: mode === 'count' ? 9 : [9, 14, 19][rev ? 2 - c : c],
      fill: checker ? (r + c) % 2 === 0 : false
    });
    let cells = '';
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      if (r === 2 && c === 2) cells += frame('<text x="45" y="58" text-anchor="middle" class="qmark">?</text>', c * 96, r * 96);
      else cells += frame(cellSvg(spec(r, c)), c * 96, r * 96);
    }
    const mKey = cells;
    if (seenMatrix.has(mKey)) continue;
    seenMatrix.add(mKey); n++;
    const correct = spec(2, 2);
    const other = shapes.length ? SHAPES.filter((s) => s !== correct.shape) : [];
    const muts = [
      { ...correct, shape: pick(other) },
      { ...correct, fill: !correct.fill },
      mode === 'count' ? { ...correct, count: correct.count === 2 ? 3 : 2 } : { ...correct, size: correct.size === 14 ? 19 : 14 }
    ];
    if (!checker) muts[1] = { ...correct, shape: other.find((s) => s !== muts[0].shape) };
    const keys = new Set([JSON.stringify(correct)]);
    const wrongs = [];
    for (const m of muts) { const k = JSON.stringify(m); if (!keys.has(k)) { keys.add(k); wrongs.push(m); } }
    while (wrongs.length < 3) { const m = { ...correct, count: ri(1, 3), size: pick([9, 14]) }; const k = JSON.stringify(m); if (!keys.has(k) && !(m.count === 3 && m.size > 10)) { keys.add(k); wrongs.push(m); } }
    const opts = shuffle([correct, ...wrongs]);
    add({
      cat: 'Matrix Patterns', prompt: 'Which shape completes the pattern?',
      visual: `<svg viewBox="0 0 282 282" class="matrix" role="img" aria-label="3 by 3 pattern grid with the bottom right cell missing">${cells}</svg>`,
      optionsSvg: opts.map((o) => `<svg viewBox="0 0 90 90" class="opt-svg" aria-hidden="true"><rect x="1" y="1" width="88" height="88" rx="8" class="cell"/>${cellSvg(o)}</svg>`),
      options: opts.map((_, i) => 'Option ' + 'ABCD'[i]),
      answer: opts.findIndex((o) => JSON.stringify(o) === JSON.stringify(correct)),
      explain: `Reading across each row, the ${mode === 'count' ? (rev ? 'number of shapes goes down 3, 2, 1' : 'number of shapes goes up 1, 2, 3') : (rev ? 'shape size shrinks large, medium, small' : 'shape size grows small, medium, large')}; each row keeps its own shape${checker ? ', and fill alternates like a checkerboard' : ''}.`
    });
  }

  /* ---------- 3. Spatial: odd one out (12, generated, SVG) ---------- */
  for (let n = 0; n < 12; n++) {
    const odd = ri(0, 4);
    const angles = shuffle([0, 45, 90, 135, 180, 225, 270, 315]).slice(0, 5);
    const tiles = angles.map((a, i) => `<g transform="translate(${i * 88 + 42} 48)"><rect x="-40" y="-44" width="80" height="88" rx="8" class="cell"/><g transform="rotate(${a}) scale(${i === odd ? -1 : 1} 1)"><path d="M-12,-18 H10 V-10 H-4 V-3 H6 V5 H-4 V18 H-12 Z" fill="currentColor"/></g><text y="38" x="0" text-anchor="middle" class="tilenum">${i + 1}</text></g>`).join('');
    add({
      cat: 'Spatial Reasoning', prompt: 'Four of these shapes are the same, only rotated. One is a mirror image. Which one?',
      visual: `<svg viewBox="0 0 440 96" class="strip" role="img" aria-label="Five rotated shapes">${tiles}</svg>`,
      options: ['1', '2', '3', '4', '5'], answer: odd,
      explain: `Shape ${odd + 1} is flipped (mirrored); no rotation can turn it into the others.`
    });
  }

  /* ---------- 4. Error checking (15, generated) ---------- */
  const CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = () => Array.from({ length: 8 }, () => CH[ri(0, CH.length - 1)]).join('');
  function mutate(s) {
    const i = ri(0, s.length - 2);
    if (n_swap() && s[i] !== s[i + 1]) return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
    let c; do { c = CH[ri(0, CH.length - 1)]; } while (c === s[i]);
    return s.slice(0, i) + c + s.slice(i + 1);
  }
  function n_swap() { return R() < 0.4; }
  function diffHtml(a, b) { return `<div class="pair"><code>${a}</code><span class="arrow">↔</span><code>${b}</code></div>`; }
  for (let n = 0; n < 15; n++) {
    if (n % 2 === 0) {
      let wrongCount = ri(0, 3), html = '';
      const flags = shuffle([0, 1, 2, 3].map((i) => i < wrongCount));
      for (let i = 0; i < 4; i++) { const a = code(); html += diffHtml(a, flags[i] ? mutate(a) : a); }
      add({ cat: 'Error Checking', prompt: 'How many of these pairs of codes do NOT match exactly?', visual: `<div class="pairs">${html}</div>`, options: ['0', '1', '2', '3'], answer: wrongCount, explain: 'Compare character by character, left to right. Watch for swapped neighbouring characters and look-alikes (O/0, 1/I, 5/S, 8/B).' });
    } else {
      const a = code(), same = R() < 0.5, b = same ? a : mutate(a);
      add({ cat: 'Error Checking', prompt: 'Do these two codes match exactly?', visual: `<div class="pairs">${diffHtml(a, b)}</div>`, options: ['They match', 'They do not match'], answer: same ? 0 : 1, explain: same ? 'Every character is identical.' : 'One character differs or two neighbours are swapped.' });
    }
  }

  /* ---------- 5. Data interpretation (8, generated, SVG charts) ---------- */
  const LABELS = [['Jan', 'Feb', 'Mar', 'Apr', 'May'], ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'], ['North', 'South', 'East', 'West', 'Central'], ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']];
  const UNITS = ['sign-ups (thousands)', 'tickets resolved', 'checks (millions)', 'flagged sessions'];
  function chartSvg(labels, vals) {
    const W = 440, H = 250, base = 210, top = 20, step = (base - top) / 100, bw = 50, gap = 30;
    let s = '';
    [0, 25, 50, 75, 100].forEach((g) => { const y = base - g * step; s += `<line x1="40" x2="${W - 10}" y1="${y}" y2="${y}" class="grid"/><text x="34" y="${y + 4}" text-anchor="end" class="axis">${g}</text>`; });
    vals.forEach((v, i) => { const x = 60 + i * (bw + gap), h = v * step; s += `<rect x="${x}" y="${base - h}" width="${bw}" height="${h}" rx="4" class="bar"/><text x="${x + bw / 2}" y="${base - h - 6}" text-anchor="middle" class="barval">${v}</text><text x="${x + bw / 2}" y="${base + 18}" text-anchor="middle" class="axis">${labels[i]}</text>`; });
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Bar chart">${s}</svg>`;
  }
  for (let n = 0; n < 8; n++) {
    const li = n % 4, labels = LABELS[li], unit = UNITS[li];
    let vals = Array.from({ length: 5 }, () => 5 * ri(4, 19));
    const kind = n % 4;
    let prompt, correct, wrongs, why;
    if (kind === 0) {
      const mx = Math.max(...vals); if (vals.filter((v) => v === mx).length > 1) vals[vals.indexOf(mx)] = Math.min(100, mx + 5);
      const m = Math.max(...vals), name = labels[vals.indexOf(m)];
      prompt = `Which category recorded the highest figure for ${unit}?`; correct = name; wrongs = shuffle(labels.filter((l) => l !== name)).slice(0, 3); why = `${name} has the tallest bar (${m}).`;
    } else if (kind === 1) {
      const i = ri(0, 4); let j; do { j = ri(0, 4); } while (j === i || vals[i] === vals[j]);
      prompt = `How many more ${unit} did ${labels[i]} have than ${labels[j]}? (negative if fewer)`; correct = vals[i] - vals[j]; wrongs = numDistractors(correct).map((x) => x); why = `${vals[i]} − ${vals[j]} = ${correct}.`;
    } else if (kind === 2) {
      const i = ri(0, 4); let j; do { j = ri(0, 4); } while (j === i);
      prompt = `What is the combined total of ${labels[i]} and ${labels[j]}?`; correct = vals[i] + vals[j]; wrongs = numDistractors(correct); why = `${vals[i]} + ${vals[j]} = ${correct}.`;
    } else {
      const i = ri(0, 3), base = pick([40, 60]), f = pick([1.25, 1.5]);
      vals[i] = base; vals[i + 1] = base * f;
      prompt = `By what percentage did the figure rise from ${labels[i]} to ${labels[i + 1]}?`; correct = (f - 1) * 100 + '%'; wrongs = shuffle(['10%', '20%', '25%', '30%', '50%', '75%'].filter((x) => x !== correct)).slice(0, 3); why = `(${vals[i + 1]} − ${vals[i]}) ÷ ${vals[i]} = ${correct}.`;
    }
    const o = withOptions(correct, wrongs);
    add({ cat: 'Data Interpretation', prompt, visual: chartSvg(labels, vals), options: o.options, answer: o.answer, explain: why });
  }

  /* ---------- 6. Memory (12, generated, interactive) ---------- */
  [4, 4, 5, 5, 6, 6].forEach((len) => {
    const seq = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, len);
    add({ cat: 'Memory', type: 'grid', prompt: `Watch the squares light up, then tap them in the same order. (${len} squares)`, seq, explain: `The sequence was ${seq.map((s) => s + 1).join(' → ')} (numbered left-to-right, top-to-bottom). Tip: chunk the path into shapes (an L, a Z) instead of memorising positions.` });
  });
  [[5, false], [6, false], [7, false], [4, true], [5, true], [6, true]].forEach(([len, rev]) => {
    const digits = Array.from({ length: len }, () => ri(0, 9)).join('');
    add({ cat: 'Memory', type: 'digits', digits, reverse: rev, prompt: rev ? `Memorise the digits, then type them in REVERSE order. (${len} digits)` : `Memorise the digits, then type them in the same order. (${len} digits)`, explain: `The digits were ${digits.split('').join(' ')}${rev ? ', so the answer is ' + digits.split('').reverse().join(' ') : ''}. Tip: group digits into pairs or triples.` });
  });

  /* ---------- 7. Hand written: verbal, numerical, logic ---------- */
  const H = (cat, prompt, options, answer, explain) => add({ cat, prompt, options, answer, explain });
  const V = 'Verbal Reasoning';
  [
    ['Book is to Reader as Song is to …', ['Listener', 'Singer', 'Radio', 'Note'], 0, 'A book is consumed by a reader; a song is consumed by a listener.'],
    ['Hot is to Cold as Expand is to …', ['Contract', 'Grow', 'Heat', 'Stretch'], 0, 'Antonym pair.'],
    ['Doctor is to Hospital as Teacher is to …', ['School', 'Student', 'Book', 'Lesson'], 0, 'Person to their workplace.'],
    ['Pen is to Write as Knife is to …', ['Cut', 'Sharp', 'Kitchen', 'Blade'], 0, 'Tool to its function.'],
    ['Puppy is to Dog as Kitten is to …', ['Cat', 'Mouse', 'Lion', 'Paw'], 0, 'Young animal to adult animal.'],
    ['Fast is to Quick as Big is to …', ['Large', 'Small', 'Heavy', 'Wide'], 0, 'Synonym pair.'],
    ['Finger is to Hand as Toe is to …', ['Foot', 'Shoe', 'Nail', 'Leg'], 0, 'Part to whole.'],
    ['Cautious is to Reckless as Generous is to …', ['Stingy', 'Kind', 'Rich', 'Wealthy'], 0, 'Antonym pair.'],
    ['Library is to Books as Aquarium is to …', ['Fish', 'Water', 'Glass', 'Fins'], 0, 'A place to what it houses.'],
    ['Seed is to Tree as Egg is to …', ['Bird', 'Nest', 'Shell', 'Yolk'], 0, 'Origin to what it becomes.'],
    ['Prologue is to Epilogue as Beginning is to …', ['End', 'Middle', 'Chapter', 'Story'], 0, 'Opposite ends of a work.'],
    ['Thermometer is to Temperature as Odometer is to …', ['Distance', 'Speed', 'Fuel', 'Time'], 0, 'An odometer measures distance travelled.']
  ].forEach(([p, o, a, e]) => { const w = withOptions(o[a], o.filter((_, i) => i !== a)); H(V, p, w.options, w.answer, e); });
  [
    ['Which word does NOT belong?', ['Apple', 'Banana', 'Carrot', 'Grape'], 2, 'Carrot is a vegetable; the others are fruit.'],
    ['Which word does NOT belong?', ['Triangle', 'Square', 'Circle', 'Cube'], 3, 'A cube is three-dimensional; the others are flat shapes.'],
    ['Which word does NOT belong?', ['Tuesday', 'June', 'Friday', 'Sunday'], 1, 'June is a month; the others are days.'],
    ['Which word means the OPPOSITE of "scarce"?', ['Plentiful', 'Rare', 'Valuable', 'Hidden'], 0, 'Scarce means in short supply.'],
    ['Choose the word closest in meaning to "meticulous".', ['Careless', 'Thorough', 'Hurried', 'Doubtful'], 1, 'Meticulous means showing great attention to detail.']
  ].forEach(([p, o, a, e]) => { const w = withOptions(o[a], o.filter((_, i) => i !== a)); H(V, p, w.options, w.answer, e); });

  const N = 'Numerical Reasoning';
  [
    ['What is 30% of 250?', [65, 75, 80, 90], 1, '250 × 0.30 = 75.'],
    ['A train travels at 60 km/h for 2.5 hours. How far does it go (km)?', [120, 140, 150, 180], 2, '60 × 2.5 = 150.'],
    ['A $80 jacket is reduced by 25%, then a further 10% is taken off the sale price. What is the final price?', ['$52', '$54', '$56', '$60'], 1, '80 × 0.75 = 60; 60 × 0.90 = 54.'],
    ['5 machines make 5 widgets in 5 minutes. How long do 100 machines take to make 100 widgets?', ['100 min', '20 min', '5 min', '1 min'], 2, 'Each machine makes one widget in 5 minutes, so 100 machines make 100 in 5 minutes.'],
    ['Two numbers are in the ratio 3:5 and sum to 64. What is the larger number?', [24, 32, 40, 48], 2, '64 ÷ 8 = 8 per part; 5 × 8 = 40.'],
    ['The average of four numbers is 12. Three of them are 10, 12 and 14. What is the fourth?', [10, 12, 14, 16], 1, 'Total = 48; 48 − 36 = 12.'],
    ['Alex can finish a job in 6 days, Sam in 3 days. How many days working together?', ['2', '3', '4.5', '9'], 0, '1/6 + 1/3 = 1/2 of the job per day → 2 days.'],
    ['$1,000 earns 10% interest compounded annually. What is the balance after 2 years?', ['$1,200', '$1,210', '$1,220', '$1,100'], 1, '1000 × 1.1 × 1.1 = 1,210.'],
    ['8 apples cost $6. How much do 20 apples cost?', ['$12', '$15', '$16', '$18'], 1, '$0.75 each × 20 = $15.'],
    ['A rectangle has a perimeter of 36 and a length twice its width. What is its area?', [48, 72, 81, 108], 1, 'Width 6, length 12 → area 72.'],
    ['A figure rises from 40 to 50. What is the percentage increase?', ['10%', '20%', '25%', '50%'], 2, '10 ÷ 40 = 25%.'],
    ['A meeting starts at 2:45 pm and lasts 1 hour 50 minutes. When does it end?', ['4:15 pm', '4:35 pm', '4:45 pm', '4:55 pm'], 1, '2:45 + 1:50 = 4:35 pm.']
  ].forEach(([p, o, a, e]) => { const w = withOptions(o[a], o.filter((_, i) => i !== a)); H(N, p, w.options, w.answer, e); });

  const L = 'Logic';
  [
    ['All bloops are razzies. All razzies are lazzies. Are all bloops definitely lazzies?', ['Yes', 'No', 'Cannot be determined'], 0, 'Chain the statements: bloops ⊂ razzies ⊂ lazzies.'],
    ['Some managers are engineers. All engineers are analysts. Which statement MUST be true?', ['All managers are analysts', 'Some managers are analysts', 'No analysts are managers', 'All analysts are engineers'], 1, 'The managers who are engineers are also analysts.'],
    ['A is taller than B. C is shorter than B. Who is the tallest?', ['A', 'B', 'C', 'Cannot be determined'], 0, 'A > B > C.'],
    ['If it rains, the match is cancelled. The match was NOT cancelled. What follows?', ['It rained', 'It did not rain', 'Nothing can be said', 'The match was moved'], 1, 'Contrapositive: no cancellation means no rain.'],
    ['Sam stands left of Tia, and Tia stands left of Uma. Who is furthest right?', ['Sam', 'Tia', 'Uma', 'Cannot be determined'], 2, 'Order: Sam, Tia, Uma.'],
    ['At 3:15, what is the angle between the hour and minute hands?', ['0°', '7.5°', '15°', '22.5°'], 1, 'At 3:15 the minute hand points exactly at the 3 (90°), but the hour hand has crept a quarter of the way from 3 toward 4: 3 × 30° + 15 × 0.5° = 97.5°. The gap is 97.5° − 90° = 7.5°, so the hands are close but do not overlap.'],
    ['The day after tomorrow is Friday. What day was yesterday?', ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], 1, 'Today is Wednesday, so yesterday was Tuesday.'],
    ['Alice is older than Bob. Bob is older than Carol. Dan is younger than Carol. Who is second oldest?', ['Alice', 'Bob', 'Carol', 'Dan'], 1, 'Order: Alice, Bob, Carol, Dan.'],
    ['If CAT is coded 3-1-20, how is DOG coded?', ['4-15-7', '4-14-7', '3-15-7', '4-15-8'], 0, 'Letters map to alphabet positions: D=4, O=15, G=7.'],
    ['What letter comes next? A, C, F, J, …', ['M', 'N', 'O', 'P'], 2, 'Gaps grow: +2, +3, +4, +5 → J + 5 = O.']
  ].forEach(([p, o, a, e]) => { const w = withOptions(o[a], o.filter((_, i) => i !== a)); H(L, p, w.options, w.answer, e); });


  /* ---------- 8. Extra hand-written set (25) ---------- */
  const seriesVisual = (t) => `<div class="series">${t.map((x) => `<span>${x}</span>`).join('')}<span class="q">?</span></div>`;
  const X = (cat, prompt, correct, wrongs, explain, visual) => { const w = withOptions(correct, wrongs); add({ cat, prompt, visual, options: w.options, answer: w.answer, explain }); };
  X('Number Series', 'What number comes next in the series?', '95', ['94', '96', '99'], 'Each number doubles and adds 1. 47 × 2 + 1 = 95.', seriesVisual([5, 11, 23, 47]));
  X('Number Series', 'What number comes next in the series?', '37', ['36', '38', '41'], 'The differences are 3, 5, 7, 9, then 11 (the numbers are n² + 1). 26 + 11 = 37.', seriesVisual([2, 5, 10, 17, 26]));
  X('Number Series', 'Complete the sequence.', '6', ['4', '8', '10'], 'Each term is divided by 2, so 12 ÷ 2 = 6.', seriesVisual([96, 48, 24, 12]));
  X('Number Series', 'What number comes next in the series?', '36', ['35', '37', '40'], 'Consecutive squares: 2², 3², 4², 5², then 6² = 36.', seriesVisual([4, 9, 16, 25]));
  X('Number Series', 'Find the next number.', '8', ['7', '9', '10'], 'Each term is the sum of the previous two: 3 + 5 = 8.', seriesVisual([1, 1, 2, 3, 5]));
  X('Number Series', 'Which letter comes next?', 'Z', ['W', 'X', 'Y'], 'Letter positions increase by 3, 4, 5, 6, then 7. S is position 19; 19 + 7 = 26, which is Z.', seriesVisual(['A', 'D', 'H', 'M', 'S']));
  X('Logic', 'Which number does NOT belong with the others?', '30', ['9', '16', '25'], '9, 16 and 25 are perfect squares. 30 is not.');
  X('Numerical Reasoning', 'A red tile is worth 6 points and a blue tile is worth 4. What is the total for 3 red tiles and 2 blue tiles?', '26', ['24', '22', '28'], '3 × 6 + 2 × 4 = 18 + 8 = 26.');
  X('Numerical Reasoning', 'What is 25% of 280?', '70', ['60', '65', '75'], '25% is one quarter, and 280 ÷ 4 = 70.');
  X('Numerical Reasoning', 'A $120 product is discounted by 15%. What is the new price?', '$102', ['$98', '$105', '$108'], '15% of $120 is $18. $120 − $18 = $102.');
  X('Numerical Reasoning', 'Eight workers can complete a job in 6 hours. Assuming equal rates, how long would four workers take?', '12 hours', ['3 hours', '8 hours', '9 hours'], 'The job takes 8 × 6 = 48 worker-hours. With four workers, 48 ÷ 4 = 12 hours.');
  X('Numerical Reasoning', 'Six identical pens cost $9. How much do ten cost?', '$15', ['$13.50', '$14', '$16'], 'Each pen costs $1.50, so ten cost $15.');
  X('Numerical Reasoning', 'The average of four numbers is 21. Three of the numbers are 12, 18 and 24. What is the fourth?', '30', ['27', '28', '32'], 'The total must be 84. Subtract 12 + 18 + 24 = 54, leaving 30.');
  X('Numerical Reasoning', 'A team has engineers and designers in a 3:2 ratio. There are 55 people in total. How many are engineers?', '33', ['22', '30', '35'], 'Engineers are 3 of 5 equal parts: 55 × 3/5 = 33.');
  X('Logic', 'All architects are employees. No employees are contractors. Which statement must be true?', 'No architects are contractors', ['All employees are architects', 'Some contractors are architects', 'All contractors are employees'], 'Every architect is an employee, and employees cannot be contractors, so no architect can be a contractor.');
  X('Logic', 'Some teams use Python. All teams that use Python automate testing. Which conclusion must be true?', 'Some teams automate testing', ['Every automated test uses Python', 'All teams use Python', 'No team automates testing'], 'At least some teams use Python, and every such team automates testing. So some teams automate testing.');
  X('Logic', 'If a transfer succeeds, a confirmation email is sent. No confirmation email was sent. What follows?', 'The transfer did not succeed', ['The transfer succeeded', 'The email was delayed', 'Nothing can be concluded'], 'This is modus tollens: success implies an email, so no email implies no success.');
  X('Logic', 'Every deployed project must pass a security review. Project Delta was deployed. What must be true?', 'Delta passed the security review', ['Delta failed the security review', 'Delta was deployed before the review', 'Nothing can be concluded'], 'Deployment requires passing the review. Delta was deployed, so it must have passed.');
  X('Logic', 'Only employees with active badges may enter a laboratory. Jamie entered, and the rule was followed. What must be true?', 'Jamie is an employee with an active badge', ['Jamie is a laboratory manager', 'Every badge holder entered the laboratory', 'Jamie has worked in the laboratory before'], 'Being an employee with an active badge is the necessary condition for entry.');
  X('Verbal Reasoning', 'Blueprint is to building as recipe is to …', 'Dish', ['Chef', 'Kitchen', 'Ingredient'], 'A blueprint guides construction of a building, as a recipe guides preparation of a dish.');
  X('Verbal Reasoning', 'Which word is the closest OPPOSITE of "concise"?', 'Wordy', ['Brief', 'Clear', 'Accurate'], 'Concise means brief and direct. Wordy means using more words than necessary.');
  X('Logic', 'L finishes before M. M finishes before N. N finishes before P. Who finishes first?', 'L', ['M', 'N', 'P'], 'The complete order is L, M, N, P, so L finishes first.');
  X('Numerical Reasoning', 'Complete the analogy: 4 : 16 :: 7 : ?', '49', ['28', '32', '64'], 'The second number is the square of the first. 7² = 49.');
  X('Data Interpretation', 'A support team resolves tickets each day (chart). How many more tickets were resolved on Tuesday and Thursday combined than on Monday and Wednesday combined?', '12', ['8', '14', '26'], 'Tuesday + Thursday = 18 + 20 = 38. Monday + Wednesday = 14 + 12 = 26. Difference = 12.', chartSvg(['Mon', 'Tue', 'Wed', 'Thu'], [14, 18, 12, 20]));

  out.forEach((q, i) => { q.id = 'cog-' + String(i + 1).padStart(3, '0'); });
  root.COGNITIVE = out;
  if (typeof module !== 'undefined') module.exports = out;
})(typeof window !== 'undefined' ? window : globalThis);
