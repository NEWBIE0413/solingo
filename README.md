# Solingo

Self-hosted, Duolingo-style trainer for writing systems. One static page, no build step, no
accounts, no server logic. The engine is fixed and small; every language lives in a JSON
course that anyone — or any LLM — can write.

Ships with **Japanese kana** (hiragana + katakana, 208 symbols, 129 words). Made because one of
us is preparing the JLPT while his girlfriend studies for the TOPIK; a Hangul course is the
obvious next one.

## What a session feels like

- **One button.** No lesson picker. Press *학습 시작하기* and the engine decides: 2–3 new
  symbols when your recent ones have settled, otherwise review.
- **Repetition with variety.** Each session narrows to 4–5 focus symbols and runs them through
  four rounds — hear it and pick, see the reading and pick, see the symbol and read it, match
  pairs. Every focus symbol comes back 4–5 times; every word 3 times (build from tiles, pick the
  meaning, build again, trace by hand).
- **It moves.** Tap = answer. Correct answers chime, buzz, bump a combo counter, fly a +1 and
  auto-advance. Misses shake, show the answer, and return two or three items later. Steps slide;
  the session ends with confetti and XP.
- **Sound that actually plays on iPhone.** The first tap opens a "turn on sound?" sheet, which
  is the user gesture Safari needs; after that the course's TTS voice auto-plays new symbols,
  words and listening questions.
- **Mastery takes days.** A symbol can climb at most two levels per day, so the chart turns
  gold only after real spaced repetition.

## Run it

It is static. Any file server works.

```sh
./serve.sh                 # python http.server on :8765, bound to the LAN
open http://localhost:8765
```

On a phone on the same Wi-Fi: `http://<your-machine-ip>:8765`. Add to Home Screen for a
full-screen app. Progress is stored in `localStorage`, per origin — pick one address and keep
using it.

Switch course with `?course=<id>` (default `ja-kana`).

## Write a course

See [docs/COURSE.md](docs/COURSE.md). Short version: a JSON file with the symbols, their
reading labels, a teaching order, chart layout, and a word list with meanings. Drop it in
`courses/`, open `index.html?course=yourid`.

## Layout

```
index.html      shell markup
styles.css      look and motion (system font, springs, light/dark)
app.js          engine: session builder, exercises, SRS-ish mastery, audio, confetti
courses/*.json  content
quiz.html       companion speed drill (type the romaji), kana-only for now
docs/COURSE.md  course authoring guide, written so an LLM can follow it
```

## Design notes

- Follows Apple's fluid-interface rules where the web allows: feedback on pointer-down, no
  locked-out input during transitions, springs over fixed easings, reduced-motion respected.
- Vibration uses the web Vibration API, which iOS Safari does not expose. Android phones buzz.
- Handwriting is a plain canvas with a faint model glyph; there is no stroke recognition.
  The learner hides the model and judges themself. It is honest and it works.

MIT.
