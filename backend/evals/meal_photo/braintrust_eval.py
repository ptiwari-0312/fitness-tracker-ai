"""
Braintrust-reported variant of the meal-photo eval.

Reuses the exact same fixtures, tolerance bands, and aggregation logic as
run_eval.py — this script only changes *where results go*: instead of the
console + a local JSON file, each provider's run becomes a Braintrust
experiment you can view and share as a dashboard link.

`run_eval.py` remains the free/offline/no-account way to run this eval;
this script is additive, not a replacement (see fixtures/README.md).

Requires BRAINTRUST_API_KEY in backend/.env — sign up at braintrust.dev,
create a key under Settings > API Keys. See .env.example.

Usage (run from backend/):
    python -m evals.meal_photo.braintrust_eval
    python -m evals.meal_photo.braintrust_eval --provider claude
"""
import argparse

import braintrust

from app.core.config import settings
from evals.meal_photo.run_eval import (
    DEFAULT_TOLERANCES,
    FIELDS,
    FIXTURES_DIR,
    PROVIDERS,
    aggregate_from_raw,
    load_dataset,
    score_field,
)


def scorer(input, output, expected):
    """One Score per macro field, using the same tolerance bands as run_eval.py."""
    scores = []
    for f in FIELDS:
        exp = expected.get(f)
        if exp is None:
            continue
        actual = output.get(f) if output else None
        fr = score_field(f, float(exp), float(actual) if actual is not None else None, DEFAULT_TOLERANCES)
        scores.append(
            braintrust.Score(
                name=f,
                score=1.0 if fr.passed else 0.0,
                metadata={"expected": fr.expected, "actual": fr.actual, "pct_error": fr.pct_error},
            )
        )
    return scores


def make_task(provider):
    async def task(case: dict) -> dict:
        image_path = FIXTURES_DIR / "images" / case["image"]
        if not image_path.exists():
            raise FileNotFoundError(f"missing image: {image_path}")
        mime = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
        raw = await provider.analyze_meal_image(image_path.read_bytes(), mime)
        return aggregate_from_raw(raw)

    return task


def main() -> None:
    parser = argparse.ArgumentParser(description="Report the meal-photo eval to Braintrust")
    parser.add_argument("--provider", choices=[*PROVIDERS, "all"], default="all")
    args = parser.parse_args()

    dataset = load_dataset()
    if not dataset:
        print(f"No fixtures found. Add cases to {FIXTURES_DIR / 'dataset.json'} - see fixtures/README.md")
        return

    if not settings.BRAINTRUST_API_KEY:
        print("BRAINTRUST_API_KEY is not set - see .env.example for how to get one.")
        return

    braintrust.login(api_key=settings.BRAINTRUST_API_KEY)

    provider_names = list(PROVIDERS) if args.provider == "all" else [args.provider]
    for name in provider_names:
        provider = PROVIDERS[name]()
        if not provider.is_configured():
            print(f"skip {name}: not configured (missing API key)")
            continue

        result = braintrust.Eval(
            "fitness-tracker-meal-photo",
            data=lambda: [braintrust.EvalCase(input=case, expected=case["expected"]) for case in dataset],
            task=make_task(provider),
            scores=[scorer],
            experiment_name=f"meal-photo-{name}",
            metadata={"provider": name},
        )
        print(f"\n{name}: {result.summary}")


if __name__ == "__main__":
    main()
