# Aced

Electron desktop app for practising screening rounds: timed **cognitive tests** and one-way **video interviews**. A **technical questions** section is stubbed for later.

Modelled on what candidates publicly report for GeoComply-style hiring (online application, cognitive puzzle/memory/error-checking test, recorded video questions). There is no official description from the company, so treat the format as an approximation.

## Run

```
npm install      # also downloads the free interviewer clips
npm start
```

## What is inside

- **Cognitive tests**: 126 questions with SVG visuals (matrix patterns, rotated shapes, charts), number series, memory (grid + digit span), error checking, verbal, numerical and logic. Per-question timer is adjustable.
- **Video interview**: 30 questions asked by an on-screen interviewer (free Mixkit clips plus your system text-to-speech voice). Preparation time and answer time (2 to 5 minutes) are adjustable. Your camera is recorded locally for playback and self-rating.
- Keyboard shortcuts: `Ctrl+1/2/3` sections, `Ctrl+,` settings, `1-5` to answer cognitive questions.

## Add questions

Edit `data/interview.js` or `data/cognitive.js`, then `npm run test:data`.

## Interviewer clips

Downloaded by `scripts/fetch-videos.js` under the Mixkit free licence and git-ignored (the licence forbids redistributing the raw files). See `assets/interviewers/CREDITS.md`.
