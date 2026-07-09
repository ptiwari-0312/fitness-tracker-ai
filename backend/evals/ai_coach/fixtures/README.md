# AI Coach eval fixtures

## Case format

```json
{
  "id": "001",
  "user_context": {"name": "Alex", "goal": "weight loss", "age": 29, "weight_kg": 82, "target_weight_kg": 75, "streak_days": 4},
  "history": [
    {"role": "user", "content": "I hurt my knee last week playing football"},
    {"role": "assistant", "content": "Sorry to hear that — how's it feeling now, and did a doctor look at it?"}
  ],
  "message": "It's a bit better. What leg workout can I do today?",
  "expects_detail": false,
  "rubric": [
    "Explicitly acknowledges the knee injury mentioned earlier in the conversation before suggesting exercises",
    "Does not recommend high-impact, knee-loading exercises (jumping lunges, box jumps, deep squats) without a caveat",
    "Suggests at least one concrete, named exercise or alternative",
    "Tone is encouraging, not clinical or dismissive"
  ]
}
```

- `user_context` mirrors what `_user_context()` in `app/api/v1/endpoints/ai_coach.py` builds from the `User` model.
- `history` is optional — list of prior turns in the same session (role/content pairs). Omit for a fresh conversation.
- `expects_detail` — set `true` for cases where the user explicitly asks for a detailed/long answer, which exempts the 200-word check (matches the coach's own system prompt: "under 200 words unless asked for details").
- `rubric` — plain-English criteria a judge model grades independently, pass/fail. Write these as falsifiable statements ("acknowledges X"), not vibes ("is helpful").

## What the harness checks automatically (no rubric entry needed)

- **Word count** ≤ 200 unless `expects_detail: true` — gates pass/fail.
- **Markdown marker count** — reported per case for visibility, but does **not** gate pass/fail. It used to, back when `ai-coach.tsx` rendered responses as plain text and raw `**bold**`/`- bullet` syntax showed up literally in the chat bubble. Now that the app renders markdown properly, moderate use of it is fine — this count is just there if you want to spot-check a case that came back unusually markdown-heavy.

Only put judgment calls in `rubric` — tone, whether stated constraints (injuries, dietary preferences, goals) were actually respected, whether the response is specific/actionable rather than generic, whether it stayed on-topic.

## Guidance for a useful set

- Cover the failure modes that actually matter: a stated injury/limitation, a stated dietary restriction, an off-topic or ambiguous question, a request that should trigger `expects_detail`, and a plain "how am I doing" check-in.
- Keep rubric criteria falsifiable and specific — a judge model grades more consistently against "names at least one exercise" than "is genuinely helpful."
- The judge model (`claude-opus-4-8` by default, see `JUDGE_MODEL` in `run_eval.py`) is deliberately a different, more capable model than the one the coach itself uses — grading your own homework with the same model is a weaker eval.
