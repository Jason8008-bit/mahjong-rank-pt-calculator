"""JSON command-line entry point for the TingQue rank-pt engine."""

import argparse
import json
import sys
from pathlib import Path

from rankpt import analyze


def main() -> int:
    for output in (sys.stdout, sys.stderr):
        if hasattr(output, 'reconfigure'):
            output.reconfigure(encoding='utf-8', errors='backslashreplace')
    parser = argparse.ArgumentParser(description="TingQue rank-pt scenario analysis")
    commands = parser.add_subparsers(dest="command", required=True)
    command = commands.add_parser("analyze", help="Analyze a JSON file (or - for stdin)")
    command.add_argument("input", nargs="?", default="-")
    args = parser.parse_args()
    try:
        if args.input == "-":
            stream = getattr(sys.stdin, 'buffer', None)
            source = stream.read().decode('utf-8-sig') if stream is not None else sys.stdin.read().removeprefix('\ufeff')
        else:
            source = Path(args.input).read_text(encoding="utf-8-sig")
        result = analyze(json.loads(source))
        print(json.dumps(result, ensure_ascii=False, allow_nan=False))
    except (OSError, ValueError, RecursionError) as exc:
        print(f"rankpt: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
