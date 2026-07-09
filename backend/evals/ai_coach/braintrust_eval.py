"""
Braintrust-reported variant of the AI Coach rubric eval.

Reuses the exact same prompt-building, judge prompt, and checks as
run_eval.py — this script only changes *where results go*: instead of the
console + a local JSON file, the run becomes a Braintrust experiment you can
view and share as a dashboard link, with each rubric criterion visible as its
own named score per case.

run_eval.py remains the free/offline/no-account way to run this eval; this
script is additive, not a replacement (see fixtures/README.md).

Requires BRAINTRUST_API_KEY in backend/.env — sign up at braintrust.dev,
create a key under Settings > API Keys. See .env.example.

Usage (run from backend/):
    python -m evals.ai_coach.braintrust_eval
"""
import anthropic
import braintrust

from app.core.config import settings
from evals.ai_coach.run_eval import (
    FIXTURES_DIR,
    JUDGE_MODEL,
    check_markdown,
    check_word_count,
    get_response,
    judge,
    load_dataset,
)

_judge_client: anthropic.AsyncAnthropic


async def task(case: dict) -> str:
    response_text, _latency = await get_response(case)
    return response_text


def word_count_scorer(input, output, expected):
    count, passed = check_word_count(output, input.get("expects_detail", False))
    return braintrust.Score(name="word_count_ok", score=1.0 if passed else 0.0, metadata={"word_count": count})


def markdown_scorer(input, output, expected):
    """Informational only (score=None) — the mobile app renders markdown properly now,
    see run_eval.py's module docstring for why this used to gate pass/fail."""
    count = check_markdown(output)
    return braintrust.Score(name="markdown_markers", score=None, metadata={"count": count})


async def rubric_scorer(input, output, expected):
    criteria = await judge(input, output, _judge_client)
    return [
        braintrust.Score(name=c.criterion, score=1.0 if c.passed else 0.0, metadata={"reason": c.reason})
        for c in criteria
    ]


def main() -> None:
    global _judge_client

    dataset = load_dataset()
    if not dataset:
        print(f"No fixtures found. Add cases to {FIXTURES_DIR / 'dataset.json'} - see fixtures/README.md")
        return

    if not settings.BRAINTRUST_API_KEY:
        print("BRAINTRUST_API_KEY is not set - see .env.example for how to get one.")
        return
    if not settings.ANTHROPIC_API_KEY:
        print("ANTHROPIC_API_KEY is not set - the judge model needs it even if AI_PROVIDER isn't claude.")
        return

    braintrust.login(api_key=settings.BRAINTRUST_API_KEY)
    _judge_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    result = braintrust.Eval(
        "fitness-tracker-ai-coach",
        data=lambda: [
            braintrust.EvalCase(input=case, expected=case.get("rubric"), metadata={"case_id": case["id"]})
            for case in dataset
        ],
        task=task,
        scores=[word_count_scorer, markdown_scorer, rubric_scorer],
        experiment_name="ai-coach",
        metadata={"judge_model": JUDGE_MODEL},
    )
    print(f"\n{result.summary}")


if __name__ == "__main__":
    main()
