# Writing a course

A course is one JSON file in `courses/`. The engine (`app.js`) knows nothing about any
particular language: everything it needs — the symbols, their readings, the words, the
teaching order, how to draw the overview chart — comes from this file. That is the point of
Solingo: the shell is fixed and small, the content is unbounded. An LLM can write a course
from this document alone.

Open it with `index.html?course=<id>`.

## Shape

```jsonc
{
  "id": "ja-kana",                 // file name without .json
  "title": "일본어 가나",            // shown in the tab title
  "lang": "ja-JP",                 // BCP-47 tag handed to speechSynthesis
  "voiceHint": "Kyoko|Google",     // optional regex; prefer voices whose name matches
  "tokenize": { "joiners": "ゃゅょ" }, // optional: chars that glue onto the previous symbol (きゃ)
  "sets": [                        // overview charts on the home screen, in order
    { "id": "hiragana", "title": "히라가나",
      "grid": [["あ","い","う","え","お"], ["か","き","く","け","こ"], ["や",null,"ゆ",null,"よ"]],
      "extra": ["きゃ","きゅ","きょ"] }   // symbols shown after the grid, no column structure
  ],
  "order": ["あ","い","う", "..."], // teaching order — the engine introduces 2–3 at a time from here
  "items": {                       // every symbol that can appear in a word
    "あ": { "r": "a" },              // r = the reading label shown to the learner (romaji, IPA, whatever)
    "ー": { "r": "ー", "free": true } // free = never taught or graded; allowed inside words at any time
  },
  "words": [                       // [text, meaning]; text is built only from items
    { "t": "すし", "m": "초밥" }
  ]
}
```

## Rules the engine relies on

- Every non-free symbol used in `words` must exist in `items` and in `order`. A word becomes
  available the moment all of its symbols have been introduced, so **spread words so that
  something is available early**: with only the first three symbols taught, there should already
  be at least one word (`あい`, `いえ`).
- Keep `order` pedagogically honest: the first symbols should be the ones the language's own
  learners meet first. The engine shows `order[0..2]` on the very first session.
- Readings (`r`) are labels, not answers to type. Make them short; they sit under the symbol in
  the chart and inside multiple-choice tiles. Two different symbols may share a reading
  (じ / ぢ) — the engine tolerates it, but avoid putting both in the same distractor set if it
  matters (it currently doesn't check).
- `grid` rows may be different lengths only if you accept a ragged chart; use `null` for gaps.
- Meanings are in the learner's language. The engine's own UI strings are Korean today; if you
  want another UI language, that is an engine change, not a course change.
- TTS: the symbol text itself is what gets spoken. For scripts where the isolated symbol has no
  natural pronunciation (e.g. a bare Hangul consonant), pair it with a reading that TTS can say,
  or accept effect-only feedback for that item.

## Writing good content

- Words should be real, common, and pleasant to say. The learner meets each one 3 times per
  session (build from tiles, pick the meaning, build again / trace) — a dull word gets dull fast.
- Introduce 2–3 symbols per session; the engine paces this by mastery, but the order you give
  decides what "next" means. Interleave easy shapes with hard ones.
- Aim for 5–8 words per introduced group of symbols, and reuse earlier symbols constantly so
  the review keeps happening inside words rather than as bare drills.

## Checklist before committing a course

```
node -e '
const c=require("./courses/YOUR.json");
const free=new Set(Object.keys(c.items).filter(k=>c.items[k].free));
const J=c.tokenize?.joiners||"";
const tok=w=>{const o=[];for(let i=0;i<w.length;i++){if(i+1<w.length&&J.includes(w[i+1])){o.push(w[i]+w[i+1]);i++}else o.push(w[i])}return o};
const bad=c.words.flatMap(w=>tok(w.t).filter(k=>!free.has(k)&&!(k in c.items)));
console.log(bad.length?"missing items: "+[...new Set(bad)].join(" "):"ok",
  "| order not in items:",c.order.filter(k=>!(k in c.items)).join(" ")||"none");'
```
