"""Snapshot Arbiter's API, in sample mode, into static files for the portfolio's demo.

Pass 11, E.2; ADR-0050. Run against a fresh clone of Arbiter at the pinned
commit, with the API started in sample mode (no credentials, no models):

    SAMPLE_MODE=true LLM_PROVIDER=offline PORT=8765 python run.py serve
    python scripts/arbiter/capture.py http://127.0.0.1:8765 apps/arbiter-demo/public/data <sha>

It writes minified JSON (and the dossiers) under the output folder:

- index.json: each vendor's captured run_id, case_id and outcome, the commit and the time;
- every GET the console makes, as <path>.json (audit/recent.json for /audit/recent?limit=50);
- runs/<vendor_id>.json: one assessment per vendor, all of them in id order, as the events of
  POST /runs and its stream up to `done`; then each case's record, trace, dossiers
  (dossier.md, and dossier.htm, a name the Worker's html_handling leaves alone) and its
  replay (POST /cases/<id>/replay);
- /cases, /audit/* and /memory/precedents last, so they show the state after every run;
- /recordings filtered to the kinds captured, and each of those recordings.

Paths on the capturing machine (the API reports where its sample data lives) are made relative
to the clone, so nothing about that machine is published.

Budget: 8 MB in all, no file over 1 MB. The output folder is emptied first.
"""

import json
import pathlib
import shutil
import sys
import time

import httpx

KINDS = {"live_example", "live_session", "sample_example"}
STATIC = [
    "/health",
    "/questions",
    "/registry/queries",
    "/usl/model",
    "/agents",
    "/evidence/nightshift",
    "/evidence/parity",
    "/eval/latest",
]
BUDGET_TOTAL = 8 * 1024 * 1024
BUDGET_FILE = 1024 * 1024


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__)
        return 2
    base, out_dir, sha = sys.argv[1], pathlib.Path(sys.argv[2]), sys.argv[3]
    if out_dir.exists():
        shutil.rmtree(out_dir)
    client = httpx.Client(base_url=base, timeout=300)
    health = client.get("/health").json()
    if health.get("mode") != {"data": "duckdb", "llm": "offline"}:
        print(f"capture: run the API in sample mode with LLM_PROVIDER=offline: {health.get('mode')}")
        return 1
    # The clone's folder on this machine, from where the API says its sample data lives.
    sample_dir = health["data"]["sample_dir"].replace("\\", "/")
    suffix = "data/sample/systems"
    root = sample_dir[: -len(suffix)] if sample_dir.endswith(suffix) else ""
    prefixes = [root, root.replace("/", "\\")] if root else []

    def scrub(value):
        """Makes the capturing machine's paths relative to the clone."""
        if isinstance(value, str):
            for prefix in prefixes:
                value = value.replace(prefix, "")
            return value
        if isinstance(value, list):
            return [scrub(item) for item in value]
        if isinstance(value, dict):
            return {key: scrub(item) for key, item in value.items()}
        return value

    def save(rel: str, data, raw: bool = False) -> None:
        path = out_dir / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        data = scrub(data)
        text = data if raw else json.dumps(data, separators=(",", ":"), ensure_ascii=False)
        path.write_text(text, encoding="utf-8", newline="\n")

    def get(path: str, rel: str | None = None):
        response = client.get(path)
        response.raise_for_status()
        save(rel or path.strip("/") + ".json", response.json())
        return response.json()

    vendors = sorted(get("/vendors"), key=lambda vendor: vendor["vendor_id"])
    for path in STATIC:
        get(path)

    runs: dict[str, dict[str, str]] = {}
    for vendor in vendors:
        vendor_id = vendor["vendor_id"]
        started = client.post("/runs", json={"vendor_id": vendor_id})
        started.raise_for_status()
        events, done, kind = [], None, None
        with client.stream("GET", started.json()["events_url"]) as stream:
            for line in stream.iter_lines():
                if line.startswith("event: "):
                    kind = line[7:]
                elif line.startswith("data: "):
                    data = json.loads(line[6:])
                    if kind == "trace":
                        events.append(data)
                    elif kind == "done":
                        done = data
                        break
                    elif kind == "error":
                        print(f"capture: {vendor_id}: {data}")
                        return 1
        if done is None:
            print(f"capture: {vendor_id}: the stream ended without `done`")
            return 1
        case_id = done["case_id"]
        runs[vendor_id] = {"run_id": done["run_id"], "case_id": case_id, "outcome": done["outcome"]}
        save(f"runs/{vendor_id}.json", {"events": events, "done": done})
        get(f"/cases/{case_id}")
        get(f"/cases/{case_id}/trace")
        for fmt, name in (("md", "dossier.md"), ("html", "dossier.htm")):
            response = client.get(f"/cases/{case_id}/dossier", params={"format": fmt})
            response.raise_for_status()
            save(f"cases/{case_id}/{name}", response.text, raw=True)
        replay = client.post(f"/cases/{case_id}/replay")
        replay.raise_for_status()
        save(f"cases/{case_id}/replay.json", replay.json())
        print(f"capture: {vendor_id} {done['outcome']} ({len(events)} events)")

    get("/cases")
    get("/audit/recent?limit=50", "audit/recent.json")
    get("/audit/verify")
    get("/memory/precedents")

    recordings = client.get("/recordings")
    recordings.raise_for_status()
    captured = [item for item in recordings.json() if item.get("kind") in KINDS]
    save("recordings.json", captured)
    for item in captured:
        get(f"/recordings/{item['run_id']}")

    save(
        "index.json",
        {
            "runs": runs,
            "sha": sha,
            "captured_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
    )

    files = [path for path in out_dir.rglob("*") if path.is_file()]
    leaked = [
        path
        for path in files
        if any(prefix in path.read_text(encoding="utf-8") for prefix in prefixes)
        or "AppData" in path.read_text(encoding="utf-8")
    ]
    if leaked:
        print(f"capture: a local path is still in {[str(p.relative_to(out_dir)) for p in leaked]}")
        return 1
    total = sum(path.stat().st_size for path in files)
    too_big = [path for path in files if path.stat().st_size > BUDGET_FILE]
    print(
        f"capture: {len(runs)} runs, {len(captured)} recordings, {len(files)} files, "
        f"{total / 1024 / 1024:.2f} MB"
    )
    if total > BUDGET_TOTAL or too_big:
        for path in too_big:
            print(f"capture: over 1 MB: {path.relative_to(out_dir)} ({path.stat().st_size} bytes)")
        print("capture: over the snapshot budget (8 MB in all, 1 MB a file)")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
