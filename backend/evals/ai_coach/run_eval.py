"""
Rubric eval harness for the AI Coach chat feature (app/services/ai_service.py).

Every case gets:
  - deterministic word-count check, mirroring AICoachService._SYSTEM_PROMPT's
    "under 200 words unless asked for details" — measured directly off the
    response text, no judge needed.
  - markdown-marker count, reported for visibility only (not a pass/fail gate).
    It used to gate the case, back when the mobile chat screen rendered
    responses as plain text and raw "**bold**"/"- bullet" syntax showed up
    literally on screen. Now that ai-coach.tsx renders markdown properly
    (react-native-markdown-display), moderate markdown is fine — flag it here
    only if you want to eyeball a case that went unusually markdown-heavy.
  - LLM-judged rubric: per-case criteria (tone, specificity, respecting stated
    constraints, staying on topic) graded by a separate judge model via
    structured outputs, so there's no brittle regex-JSON-extraction step.

Usage (run from backend/):
    python -m evals.ai_coach.run_eval
    python -m evals.ai_coach.run_eval --save

Add cases to evals/ai_coach/fixtures/dataset.json — see fixtures/README.md.
"""
import argparse
import asyncio
import json
import re
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import anthropic

from app.ai.base import ChatMessage
from app.core.config import settings
from app.services.ai_service import AICoachService

FIXTURES_DIR = Path(__file__).parent / "fixtures"
RESULTS_DIR = Path(__file__).parent / "results"

# Judge should be at least as capable as (ideally more capable than) the model
# under test, to avoid a model grading its own homework leniently.
JUDGE_MODEL = "claude-opus-4-8"

MAX_WORDS_DEFAULT = 200

_MARKDOWN_MARKER_RE = re.compile(r'(\*\*|^#{1,6}\s|^[-*]\s|^\d+\.\s)', re.MULTILINE)

_JUDGE_SCHEMA = {
    "type": "object",
    "properties": {
        "criteria": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "criterion": {"type": "string"},
                    "passed": {"type": "boolean"},
                    "reason": {"type": "string"},
                },
                "required": ["criterion", "passed", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["criteria"],
    "additionalProperties": False,
}

_JUDGE_PROMPT = """\
You are grading a response from an AI fitness coach chatbot. Judge ONLY the \
assistant's response against each rubric criterion below — independently and \
strictly. Do not give credit for good intentions if the text doesn't actually \
satisfy the criterion.

User context: {user_context}
Conversation history: {history}
User message: {message}

Assistant's response to grade:
\"\"\"
{response}
\"\"\"

Rubric criteria:
{criteria_list}

For each criterion, decide pass/fail and give a one-sentence reason."""


@dataclass
class CriterionResult:
    criterion: str
    passed: bool
    reason: str


@dataclass
class CaseResult:
    case_id: str
    passed: bool
    response: str = ""
    word_count: int = 0
    word_count_passed: bool = True
    markdown_marker_count: int = 0
    criteria: list = field(default_factory=list)
    error: Optional[str] = None
    latency_s: Optional[float] = None


def load_dataset() -> list[dict]:
    path = FIXTURES_DIR / "dataset.json"
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


async def get_response(case: dict) -> tuple[str, float]:
    """Build the same message sequence AICoachService.chat() sends, without touching the DB.

    AICoachService(db=None) is safe here: __init__ only stores the db handle on each
    repository (see app/repositories/base.py) — nothing queries it until a repo method
    is called, and this harness only reaches for `_build_system_prompt` and `_ai`.
    """
    service = AICoachService(db=None)
    system_prompt = service._build_system_prompt(case.get("user_context", {}))

    messages = [ChatMessage(role="system", content=system_prompt)]
    for turn in case.get("history", []):
        messages.append(ChatMessage(role=turn["role"], content=turn["content"]))
    messages.append(ChatMessage(role="user", content=case["message"]))

    start = time.monotonic()
    ai_response = await service._ai.chat(messages, temperature=0.7, max_tokens=512)
    return ai_response.content, time.monotonic() - start


async def judge(case: dict, response_text: str, judge_client: anthropic.AsyncAnthropic) -> list[CriterionResult]:
    criteria = case.get("rubric", [])
    if not criteria:
        return []

    prompt = _JUDGE_PROMPT.format(
        user_context=case.get("user_context", {}),
        history=case.get("history", []),
        message=case["message"],
        response=response_text,
        criteria_list="\n".join(f"- {c}" for c in criteria),
    )
    result = await judge_client.messages.create(
        model=JUDGE_MODEL,
        max_tokens=1024,
        output_config={"format": {"type": "json_schema", "schema": _JUDGE_SCHEMA}},
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(result.content[0].text)
    return [CriterionResult(c["criterion"], c["passed"], c["reason"]) for c in data["criteria"]]


def check_word_count(text: str, expects_detail: bool) -> tuple[int, bool]:
    count = len(text.split())
    return count, (expects_detail or count <= MAX_WORDS_DEFAULT)


def check_markdown(text: str) -> int:
    return len(_MARKDOWN_MARKER_RE.findall(text))


async def run_case(case: dict, judge_client: anthropic.AsyncAnthropic) -> CaseResult:
    try:
        response_text, latency = await get_response(case)
    except Exception as exc:  # eval harness must survive a provider error and keep going
        return CaseResult(case["id"], False, error=str(exc))

    word_count, word_ok = check_word_count(response_text, case.get("expects_detail", False))
    markdown_count = check_markdown(response_text)

    try:
        criteria = await judge(case, response_text, judge_client)
    except Exception as exc:
        return CaseResult(
            case["id"], False, response=response_text, word_count=word_count, word_count_passed=word_ok,
            markdown_marker_count=markdown_count,
            error=f"judge error: {exc}", latency_s=latency,
        )

    passed = word_ok and all(c.passed for c in criteria)
    return CaseResult(
        case["id"], passed, response=response_text, word_count=word_count, word_count_passed=word_ok,
        markdown_marker_count=markdown_count, criteria=criteria, latency_s=latency,
    )


def summarize(results: list[CaseResult]) -> dict:
    if not results:
        return {}
    n = len(results)
    passed = sum(r.passed for r in results)
    all_criteria = [c for r in results for c in r.criteria]
    criteria_pass_rate = round(sum(c.passed for c in all_criteria) / len(all_criteria), 3) if all_criteria else None
    return {
        "cases": n,
        "pass_rate": round(passed / n, 3),
        "word_count_failures": sum(1 for r in results if not r.word_count_passed),
        "mean_markdown_markers": round(sum(r.markdown_marker_count for r in results) / n, 1),
        "criteria_pass_rate": criteria_pass_rate,
        "errors": sum(1 for r in results if r.error),
    }


async def main() -> None:
    parser = argparse.ArgumentParser(description="Rubric eval for AI Coach chat responses")
    parser.add_argument("--save", action="store_true", help="write a timestamped JSON report to results/")
    args = parser.parse_args()

    dataset = load_dataset()
    if not dataset:
        print(f"No fixtures found. Add cases to {FIXTURES_DIR / 'dataset.json'} - see fixtures/README.md")
        return

    if not settings.ANTHROPIC_API_KEY:
        print("ANTHROPIC_API_KEY is not set - the judge model needs it even if AI_PROVIDER isn't claude.")
        return

    judge_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    results = []
    for case in dataset:
        result = await run_case(case, judge_client)
        results.append(result)
        status = "PASS" if result.passed else "FAIL"
        if result.error:
            note = result.error
        else:
            failed_criteria = [c.criterion for c in result.criteria if not c.passed]
            bits = [
                f"words={result.word_count}({'ok' if result.word_count_passed else 'FAIL'})",
                f"markdown_markers={result.markdown_marker_count} (informational)",
            ]
            if failed_criteria:
                bits.append(f"failed criteria: {failed_criteria}")
            note = ", ".join(bits)
        print(f"{case['id']}: {status}  {note}")

    print("\n=== Summary ===")
    summary = summarize(results)
    if summary:
        print(
            f"{summary['pass_rate'] * 100:.0f}% pass ({summary['cases']} cases) | "
            f"word-count failures: {summary['word_count_failures']} | "
            f"mean markdown markers: {summary['mean_markdown_markers']} (informational) | "
            f"criteria pass rate: {summary['criteria_pass_rate']}"
        )

    if args.save:
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        out_path = RESULTS_DIR / f"{time.strftime('%Y%m%d-%H%M%S')}.json"
        out_path.write_text(
            json.dumps(
                {
                    "summary": summary,
                    "cases": [
                        {
                            "id": r.case_id,
                            "passed": r.passed,
                            "response": r.response,
                            "word_count": r.word_count,
                            "word_count_passed": r.word_count_passed,
                            "markdown_marker_count": r.markdown_marker_count,
                            "criteria": [c.__dict__ for c in r.criteria],
                            "error": r.error,
                            "latency_s": r.latency_s,
                        }
                        for r in results
                    ],
                },
                indent=2,
            ),
            encoding="utf-8",
        )
        print(f"\nSaved report to {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
