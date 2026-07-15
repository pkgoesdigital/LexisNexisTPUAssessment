# LexisNexis TPU Assessment

An interactive survey for LexisNexis Risk Solutions that helps insurance
underwriters gauge their Total Property Understanding™ maturity, scores the
answers, and hands the resulting metrics to the sales team through URL
parameters.

**In production:**
- Survey — https://solutions.risk.lexisnexis.com/tpu-assessment
- Results landing page — https://solutions.risk.lexisnexis.com/tpu-results

I worked alongside legacy developers in the LexisNexis ecosystem to gather the
survey data and pass along relevant metrics via URL parameters on completion.

## Project requirements

- Build the survey with simple front-end languages (HTML, CSS, JS, PHP) as an
  interactive assessment into underwriting barriers
- Gather metrics and pass them to the sales dept via URL parameters:
  - the overall score
  - the "level" / weight class the score falls into (see `surveyData.js`)
  - the response to the key branching question (Q3)
- Embeddable in any landing page on the LexisNexis site
- User friendly, and follows the existing LexisNexis design system

## How it runs

Open `index.html` — that's the whole thing. No build, no server, no install.

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

Finishing the survey sends the user to the results page with the three
required metrics attached:

```
https://solutions.risk.lexisnexis.com/tpu-results?tpu_score=8&tpu_level=1&tpu_user_response=1
```

`tpu_user_response` is the `sort` value of the answer to Q3 (step id 300),
which is also what decides whether the rest of the survey follows path A
(ids > 449) or path B (ids 400–449).

## ⚠️ index.html is the deployable. The other files are stale copies.

This is the thing to know before editing anything here.

`index.html` is **self-contained**: it inlines its own copy of the survey data
(~100 KB), the logic (~12 KB), and the CSS, because the requirement was that
it embed in any LexisNexis landing page. It **does not load `function.js` or
`surveyData.js`** — there are zero references to either file in it.

So those files are effectively orphaned. They read like the source, but
nothing loads them, and there's no build step that would turn them into
`index.html`. They're kept as the readable, diffable version of the code —
`index.html` is 155 KB and painful to review — but **editing them changes
nothing about what ships**.

They have already drifted. The two copies of the logic are ~97% identical.
The clearest example: the most recent commit here is *"remove auto scroll to
top on mobile"* — that change was made in `index.html`, and `function.js`
still has the block:

```js
// Scroll to the top of the screen on mobile devices
if (/Mobi|Android/i.test(navigator.userAgent)) {
  window.scrollTo(0, 0);
}
```

If you change behavior, change `index.html`. Mirror it into `function.js`
only to keep the readable copy honest.

## Files

| File | Role |
|---|---|
| `index.html` | **The deployable.** Markup + inlined data + inlined logic + inlined styles. |
| `function.js` | Readable copy of the survey logic. Not loaded by anything. |
| `surveyData.js` | Readable copy of the questions, answers, weights, branching and result tiers. Not loaded by anything. |
| `style.css` | Referenced by `index.html`, which also inlines its own styles. |

## Known issues

- **The two copies of the logic drift** (above). There's no build step to stop
  it happening.
- **Two jQuery versions load on the same page** — 1.8.3 from jsdelivr and
  3.7.0 from code.jquery.com. The second wins; the first is dead weight, and
  having both is a footgun.
- **`isOnAnswerCalled` is never reset** in `onContinue()`, and
  `$("#continue-btn").prop("disabled", …)` is set from it directly rather
  than negated. It doesn't misbehave, because `#continue-btn` is a `div` —
  `disabled` means nothing to a div — and the real guard is the
  `if (!$(".answer.active").length) return;` at the top of `onContinue`. Both
  bits of code are misleading rather than broken.
- **`percentCalc` is rounded per step** (`Math.round(66 / questionCount)`), so
  the progress bar can land a point or two off 100% at the end.
