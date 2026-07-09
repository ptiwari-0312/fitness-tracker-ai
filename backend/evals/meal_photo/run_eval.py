"""
Numeric eval harness for meal-photo vision providers (Claude, Groq).

Compares each provider's estimated total_calories / protein_g / carbs_g / fat_g
against hand-labeled ground truth, using a per-field tolerance band rather than
exact match (photo-based nutrition estimation is inherently approximate).

Usage (run from backend/):
    python -m evals.meal_photo.run_eval
    python -m evals.meal_photo.run_eval --provider claude
    python -m evals.meal_photo.run_eval --provider all --save

Add cases to evals/meal_photo/fixtures/dataset.json and drop the referenced
photos into evals/meal_photo/fixtures/images/ — see fixtures/README.md.
"""
import argparse
import asyncio
import json
import statistics
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from app.ai.claude_vision_provider import ClaudeVisionProvider
from app.ai.groq_vision_provider import GroqVisionProvider

FIXTURES_DIR = Path(__file__).parent / "fixtures"
RESULTS_DIR = Path(__file__).parent / "results"

FIELDS = ["total_calories", "total_protein_g", "total_carbs_g", "total_fat_g"]

# field -> (absolute_tolerance, relative_tolerance). A field passes if the
# error is within max(absolute, relative * expected) — the absolute floor
# keeps small values (e.g. 2g fat) from demanding unrealistic precision.
DEFAULT_TOLERANCES = {
    "total_calories": (30, 0.20),
    "total_protein_g": (5, 0.25),
    "total_carbs_g": (8, 0.25),
    "total_fat_g": (4, 0.30),
}

PROVIDERS = {
    "claude": ClaudeVisionProvider,
    "groq": GroqVisionProvider,
}


@dataclass
class FieldResult:
    field: str
    expected: float
    actual: Optional[float]
    passed: bool
    pct_error: Optional[float]


@dataclass
class CaseResult:
    case_id: str
    provider: str
    passed: bool
    fields: list = field(default_factory=list)
    error: Optional[str] = None
    latency_s: Optional[float] = None


def load_dataset() -> list[dict]:
    path = FIXTURES_DIR / "dataset.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def score_field(name: str, expected: float, actual: Optional[float], tolerances: dict) -> FieldResult:
    if actual is None:
        return FieldResult(name, expected, None, False, None)
    abs_tol, rel_tol = tolerances.get(name, (0, 0.20))
    allowed = max(abs_tol, rel_tol * expected)
    diff = abs(actual - expected)
    pct_error = (diff / expected * 100) if expected else (0.0 if actual == 0 else 100.0)
    return FieldResult(name, expected, actual, diff <= allowed, round(pct_error, 1))


def aggregate_from_raw(raw: dict) -> dict:
    """Mirror MealService.analyze_image's totals computation (app/services/meal_service.py).

    The provider's raw JSON only carries per-item macros in `items[]` — total_protein_g /
    total_carbs_g / total_fat_g don't exist at the top level, and total_calories is only
    trusted from the model when the items list is empty. Score against the same aggregation
    the production code actually serves, not the raw provider dict.
    """
    items = raw.get("items", [])
    total_cal = sum(float(i.get("calories", 0)) for i in items) or float(raw.get("total_calories", 0))
    total_p = sum(float(i.get("protein_g", 0)) for i in items)
    total_c = sum(float(i.get("carbs_g", 0)) for i in items)
    total_f = sum(float(i.get("fat_g", 0)) for i in items)
    return {
        "total_calories": round(total_cal, 1),
        "total_protein_g": round(total_p, 1),
        "total_carbs_g": round(total_c, 1),
        "total_fat_g": round(total_f, 1),
    }


async def run_case(provider_name: str, provider, case: dict, tolerances: dict) -> CaseResult:
    image_path = FIXTURES_DIR / "images" / case["image"]
    if not image_path.exists():
        return CaseResult(case["id"], provider_name, False, error=f"missing image: {image_path}")

    mime = "image/png" if image_path.suffix.lower() == ".png" else "image/jpeg"
    start = time.monotonic()
    try:
        raw = await provider.analyze_meal_image(image_path.read_bytes(), mime)
    except Exception as exc:  # eval harness must survive a bad/unparseable model response
        return CaseResult(case["id"], provider_name, False, error=str(exc), latency_s=time.monotonic() - start)
    latency = time.monotonic() - start
    actuals = aggregate_from_raw(raw)

    field_results = []
    for f in FIELDS:
        expected = case["expected"].get(f)
        if expected is None:
            continue
        actual = actuals.get(f)
        field_results.append(
            score_field(f, float(expected), float(actual) if actual is not None else None, tolerances)
        )

    passed = bool(field_results) and all(fr.passed for fr in field_results)
    return CaseResult(case["id"], provider_name, passed, field_results, latency_s=latency)


async def run_provider(provider_name: str, dataset: list[dict], tolerances: dict) -> list[CaseResult]:
    provider = PROVIDERS[provider_name]()
    if not provider.is_configured():
        print(f"skip {provider_name}: not configured (missing API key)")
        return []

    results = []
    for case in dataset:
        result = await run_case(provider_name, provider, case, tolerances)
        results.append(result)
        status = "PASS" if result.passed else "FAIL"
        note = result.error or ", ".join(
            f"{fr.field}={fr.actual} (exp {fr.expected}, {fr.pct_error}% err)" for fr in result.fields
        )
        print(f"[{provider_name}] {case['id']}: {status}  {note}")
    return results


def summarize(results: list[CaseResult]) -> dict:
    if not results:
        return {}
    n = len(results)
    passed = sum(r.passed for r in results)
    per_field_errors: dict[str, list[float]] = {}
    for r in results:
        for fr in r.fields:
            if fr.pct_error is not None:
                per_field_errors.setdefault(fr.field, []).append(fr.pct_error)
    return {
        "cases": n,
        "pass_rate": round(passed / n, 3),
        "mean_pct_error": {f: round(statistics.mean(v), 1) for f, v in per_field_errors.items()},
        "errors": sum(1 for r in results if r.error),
    }


async def main() -> None:
    parser = argparse.ArgumentParser(description="Numeric eval for meal-photo vision providers")
    parser.add_argument("--provider", choices=[*PROVIDERS, "all"], default="all")
    parser.add_argument("--save", action="store_true", help="write a timestamped JSON report to results/")
    args = parser.parse_args()

    dataset = load_dataset()
    if not dataset:
        print(f"No fixtures found. Add cases to {FIXTURES_DIR / 'dataset.json'} - see fixtures/README.md")
        return

    provider_names = list(PROVIDERS) if args.provider == "all" else [args.provider]

    all_results: dict[str, list[CaseResult]] = {}
    for name in provider_names:
        all_results[name] = await run_provider(name, dataset, DEFAULT_TOLERANCES)

    print("\n=== Summary ===")
    summary = {}
    for name, results in all_results.items():
        s = summarize(results)
        summary[name] = s
        if s:
            print(f"{name}: {s['pass_rate'] * 100:.0f}% pass ({s['cases']} cases), mean % error {s['mean_pct_error']}")

    if args.save:
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        out_path = RESULTS_DIR / f"{time.strftime('%Y%m%d-%H%M%S')}.json"
        out_path.write_text(
            json.dumps(
                {
                    "summary": summary,
                    "cases": {
                        name: [
                            {
                                "id": r.case_id,
                                "passed": r.passed,
                                "error": r.error,
                                "latency_s": r.latency_s,
                                "fields": [fr.__dict__ for fr in r.fields],
                            }
                            for r in results
                        ]
                        for name, results in all_results.items()
                    },
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        print(f"\nSaved report to {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
