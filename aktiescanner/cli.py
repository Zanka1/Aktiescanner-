from __future__ import annotations

import argparse
import csv
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence

from . import company_lists
from .metrics import OUTPUT_COLUMNS, fetch_metrics, metrics_to_rows

LOGGER = logging.getLogger(__name__)

DEFAULT_CACHE = Path(__file__).resolve().parent / "data" / "stockholm_large_midcap_fallback.csv"


def _configure_logging(level: str) -> None:
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    )


def update_command(
    *,
    exchange: str,
    segments: Sequence[str],
    output: Path,
    cache: Path,
    limit: int | None,
    allow_download: bool,
) -> list[dict]:
    if allow_download:
        companies = company_lists.get_companies(cache, exchange=exchange, segments=segments)
    else:
        companies = company_lists.read_companies_from_csv(cache)
        LOGGER.info("Using cached company list from %s", cache)

    if limit is not None:
        companies = companies[:limit]
        LOGGER.info("Processing first %d companies", len(companies))
    else:
        LOGGER.info("Processing %d companies", len(companies))

    all_metrics = []
    for idx, company in enumerate(companies, start=1):
        LOGGER.info("[%d/%d] Fetching data for %s", idx, len(companies), company.symbol)
        try:
            metrics = fetch_metrics(company)
        except Exception as exc:  # noqa: BLE001
            LOGGER.exception("Failed to fetch data for %s: %s", company.symbol, exc)
            continue
        all_metrics.append(metrics)

    rows = metrics_to_rows(all_metrics)
    timestamp = datetime.now(timezone.utc).isoformat()
    for row in rows:
        row["updated_at"] = timestamp

    output.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = OUTPUT_COLUMNS + ["updated_at"]
    with output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)

    LOGGER.info("Saved %d rows to %s", len(rows), output)
    return rows


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Aktiescanner CLI")
    parser.add_argument("--log-level", default="INFO", help="Python logging level (default: INFO)")
    subparsers = parser.add_subparsers(dest="command")

    update = subparsers.add_parser("update", help="Download company list and compute valuations")
    update.add_argument("--exchange", default="se", help="Nasdaq OMX exchange code (default: se for Stockholm)")
    update.add_argument(
        "--segments",
        nargs="+",
        default=["Large Cap", "Mid Cap"],
        help="List segments to include (default: Large Cap Mid Cap)",
    )
    update.add_argument(
        "--output",
        type=Path,
        default=Path("reports/stockholm_large_midcap_metrics.csv"),
        help="Path to the CSV file that will contain the computed metrics.",
    )
    update.add_argument(
        "--cache",
        type=Path,
        default=DEFAULT_CACHE,
        help="Location where the downloaded company list is cached (defaults to bundled fallback).",
    )
    update.add_argument(
        "--limit",
        type=int,
        help="Optional limit for the number of companies to process (useful for quick tests).",
    )
    update.add_argument(
        "--no-download",
        action="store_true",
        help="Do not attempt to download the company list, rely on the cached CSV only.",
    )
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    _configure_logging(args.log_level)

    if args.command == "update":
        update_command(
            exchange=args.exchange,
            segments=args.segments,
            output=args.output,
            cache=args.cache,
            limit=args.limit,
            allow_download=not args.no_download,
        )
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
