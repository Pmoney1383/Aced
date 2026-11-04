const cog = require('../data/cognitive.js');
const iv = require('../data/interview.js');
const cats = {};
cog.forEach(q => { cats[q.cat] = (cats[q.cat] || 0) + 1;
  if (!q.type) { if (!q.options || q.answer < 0 || q.answer >= q.options.length) throw new Error('bad ' + q.id);
    if (new Set(q.options.map(String)).size !== q.options.length) throw new Error('dup options ' + q.id + ' ' + q.options); } });
console.log('cognitive:', cog.length, cats);
console.log('interview:', iv.length);
if (cog.length < 100 || iv.length < 25) throw new Error('not enough questions');
