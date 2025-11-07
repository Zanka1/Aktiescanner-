from __future__ import annotations

import csv
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Sequence
from urllib import error, parse, request

LOGGER = logging.getLogger(__name__)

DATAFEED_URL = "https://www.nasdaqomxnordic.com/webproxy/DataFeedProxy.aspx"


@dataclass(frozen=True)
class Company:
    symbol: str
    name: str
    segment: str


def _build_query(exchange: str, segments: Sequence[str] | None = None) -> str:
    params = {
        "SubSystem": "Prices",
        "Action": "StockList",
        "exchange": exchange,
    }
    if segments:
        # Data feed expects __ inst prefix for filtering by segment
        # e.g. inst__Segment=LargeCap;MidCap
        params["inst__Segment"] = ";".join(segments)
    return parse.urlencode(params)


def fetch_companies_from_nasdaq(
    exchange: str = "se",
    segments: Sequence[str] | None = ("Large Cap", "Mid Cap"),
    timeout: float | None = 15.0,
) -> List[Company]:
    """Fetch a list of companies from Nasdaq OMX Nordic's data feed.

    Parameters
    ----------
    exchange:
        Two-letter exchange code understood by Nasdaq OMX ("se" for Stockholm,
        "co" for Copenhagen, "no" for Oslo).
    segments:
        Optional filter for the "List Segment" field. Nasdaq expects the raw
        segment code without whitespace, so we remove spaces automatically.
    timeout:
        Optional timeout in seconds for the HTTP request.

    Returns
    -------
    list[Company]
        Parsed company objects in the order provided by the data feed.

    Raises
    ------
    URLError
        If the endpoint cannot be reached.
    ValueError
        If the payload cannot be decoded.
    """

    segment_codes: Sequence[str] | None = None
    if segments:
        segment_codes = [s.replace(" ", "") for s in segments]

    query = _build_query(exchange, segment_codes)
    url = f"{DATAFEED_URL}?{query}"
    headers = {
        "User-Agent": "Mozilla/5.0 (aktiescanner/1.0)",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://www.nasdaqomxnordic.com/shares/listed-companies",
    }
    req = request.Request(url, headers=headers)

    LOGGER.debug("Requesting Nasdaq OMX Nordic company list", extra={"url": url})
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read()
    except error.URLError:
        LOGGER.exception("Failed to reach Nasdaq OMX Nordic data feed")
        raise

    try:
        data = json.loads(payload.decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError("Nasdaq OMX Nordic payload was not valid JSON") from exc

    items = data.get("items") or data.get("data") or []
    companies: list[Company] = []

    for item in items:
        symbol = (item.get("symbol") or item.get("Symbol") or "").strip()
        name = (item.get("name") or item.get("CompanyName") or "").strip()
        segment = (item.get("segment") or item.get("ListSegment") or "").strip()
        if not symbol:
            continue
        if segments and segment and segment not in segments:
            continue
        companies.append(Company(symbol=f"{symbol}.ST" if not symbol.endswith(".ST") else symbol, name=name, segment=segment))

    if not companies:
        raise ValueError("No companies found in Nasdaq OMX Nordic response")

    return companies


def read_companies_from_csv(path: Path | str) -> List[Company]:
    """Load companies from a CSV file with columns symbol,name,segment."""
    resolved = Path(path)
    with resolved.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        companies = [
            Company(
                symbol=row.get("symbol", "").strip(),
                name=row.get("name", "").strip(),
                segment=row.get("segment", "").strip(),
            )
            for row in reader
            if row.get("symbol")
        ]
    return companies


def write_companies_to_csv(companies: Iterable[Company], path: Path | str) -> None:
    resolved = Path(path)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    with resolved.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["symbol", "name", "segment"])
        for company in companies:
            writer.writerow([company.symbol, company.name, company.segment])


def get_companies(
    fallback_csv: Path | str,
    *,
    exchange: str = "se",
    segments: Sequence[str] | None = ("Large Cap", "Mid Cap"),
) -> List[Company]:
    """Try to download the official list and fall back to a bundled CSV."""
    try:
        companies = fetch_companies_from_nasdaq(exchange=exchange, segments=segments)
        write_companies_to_csv(companies, fallback_csv)
        LOGGER.info(
            "Fetched %d companies from Nasdaq OMX Nordic (cached to %s)",
            len(companies),
            fallback_csv,
        )
        return companies
    except Exception as exc:  # noqa: BLE001 - we want to log and fall back
        LOGGER.warning(
            "Could not download company list, falling back to %s: %s",
            fallback_csv,
            exc,
        )
        return read_companies_from_csv(fallback_csv)
