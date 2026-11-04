// Downloads the free Mixkit talking-head clips used for the on-screen interviewer.
// They are NOT committed to the repo (Mixkit's licence forbids redistributing the raw files),
// so every clone fetches its own copy. If a download fails the app falls back to an animated avatar.
const fs = require('fs');
const path = require('path');
const IDS = [4834, 42323, 37031];
const dir = path.join(__dirname, '..', 'assets', 'interviewers');
(async () => {
  fs.mkdirSync(dir, { recursive: true });
  for (const id of IDS) {
    const file = path.join(dir, `${id}.mp4`);
    if (fs.existsSync(file) && fs.statSync(file).size > 100000) continue;
    try {
      const res = await fetch(`https://assets.mixkit.co/videos/${id}/${id}-720.mp4`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
      console.log('downloaded', id);
    } catch (e) {
      console.warn('skipped', id, e.message);
    }
  }
})();
