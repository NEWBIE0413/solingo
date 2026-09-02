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
- **It moves like Duolingo.** Select, then *확인*. Correct answers turn the footer green, chime,
  buzz, bump a combo counter and fly a +1; *계속* slides the next step in instantly — nothing
  auto-advances, nothing waits. Misses turn the footer rose, show the answer, and return two or
  three items later. Buttons and cards use the 2px/4px-bottom-border "press" that Duolingo uses.
- **Speak it.** Word rounds include a *따라 읽어보세요* step: tap the mic, say the word, and the
  Web Speech API grades it leniently (kana-normalised similarity; kanji transcriptions are
  accepted). Skippable when recognition is unavailable.
- **Leave any time.** Progress is saved after every step; the home button becomes *이어서 하기*.
- **Sound that actually plays on iPhone.** The first tap opens a "turn on sound?" sheet, which
  is the user gesture Safari needs. Voices are pre-rendered clips per symbol and word
  (`courses/<id>-audio/`, generated with a neural TTS — the kana course uses edge-tts
  `ja-JP-NanamiNeural`), exactly like the clone's per-option mp3s; the device's own TTS voices
  are offered as alternatives in the same sheet.
- **Mastery takes days.** A symbol can climb at most two levels per day, so the chart turns
  gold only after real spaced repetition.

## Run it

It is static. Any file server works; the bundled one adds `Cache-Control: no-cache` so a phone's
home-screen web app picks up new versions instead of keeping last week's `app.js`.

```sh
./serve.sh                 # serve.py on :8765, bound to the LAN
open http://localhost:8765
```

To render audio for a course: `pip install edge-tts`, then adapt `scripts/gen_audio.py`
(voice id, course id) and run it from the repo root.

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

- The visual system is [sanidhyy/duolingo-clone](https://github.com/sanidhyy/duolingo-clone)
  with its Tailwind classes resolved to plain CSS: Nunito, `rounded-xl border-2 border-b-4
  active:border-b-0` buttons, sky/green/rose cards, the 100px footer that turns green or rose,
  the START bubble over a round lesson button, the orange/sky result cards. Light theme only,
  like the clone.
- Vibration uses the web Vibration API where it exists (Android). iOS Safari has no such API;
  the page toggles a hidden native `<input type="checkbox" switch>` on each tap, which is the
  one thing that makes iOS produce a haptic tick from a web page. It works on recent iOS; if it
  doesn't on yours, nothing else breaks.
- Sound effects (`sounds/`) come from sanidhyy/duolingo-clone (MIT).
- Handwriting is a plain canvas with a faint model glyph; there is no stroke recognition.
  The learner hides the model and judges themself. It is honest and it works.

MIT.
