# Meal-photo eval fixtures

## Adding a case

1. Drop the photo into `images/` (e.g. `images/001_chapati_dal.jpg`).
2. Add an entry to `dataset.json`:

```json
{
  "id": "001",
  "image": "001_chapati_dal.jpg",
  "notes": "2 chapati + 1 bowl dal, home-cooked",
  "expected": {
    "total_calories": 240,
    "total_protein_g": 10.0,
    "total_carbs_g": 42.0,
    "total_fat_g": 4.0
  }
}
```

`expected` values should come from a source you trust more than the model you're
testing — a nutrition label, a manual macro calculation, or a known recipe.
Any field you omit from `expected` is simply not scored for that case.

## Guidance for a useful set

- 15-20 cases is enough to start noticing patterns.
- Cover what actually gets logged: home-cooked plates, restaurant meals, packaged
  snacks, mixed plates with 3+ items, and a couple of ambiguous/low-light photos.
- Keep the ground truth honest about uncertainty — if you're estimating a
  home-cooked dish yourself, expect double-digit percent tolerance, not exact match.

## Tolerance

`run_eval.py` scores each field against `max(absolute_tolerance, relative_tolerance
* expected)` — see `DEFAULT_TOLERANCES` in that file. Photo-based estimation is
inherently approximate, so this isn't a bug: it's why an eval instead of a unit
test is the right tool here.
